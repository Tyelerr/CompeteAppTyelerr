-- ============================================================================
-- ADD ENTRY_NUMBER COLUMN TO GIVEAWAY_ENTRIES TABLE
-- ============================================================================
-- This adds a sequential entry number (1, 2, 3, etc.) to each giveaway entry
-- for easier random winner selection
-- ============================================================================

-- Step 1: Add the entry_number column
ALTER TABLE giveaway_entries 
ADD COLUMN IF NOT EXISTS entry_number INTEGER;

-- Step 2: Create a function to automatically assign entry numbers
CREATE OR REPLACE FUNCTION assign_entry_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the next entry number for this giveaway
  SELECT COALESCE(MAX(entry_number), 0) + 1
  INTO NEW.entry_number
  FROM giveaway_entries
  WHERE giveaway_id = NEW.giveaway_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to auto-assign entry numbers on insert
DROP TRIGGER IF EXISTS trigger_assign_entry_number ON giveaway_entries;
CREATE TRIGGER trigger_assign_entry_number
  BEFORE INSERT ON giveaway_entries
  FOR EACH ROW
  EXECUTE FUNCTION assign_entry_number();

-- Step 4: Backfill entry numbers for existing entries
DO $$
DECLARE
  giveaway_record RECORD;
  entry_record RECORD;
  counter INTEGER;
BEGIN
  -- Loop through each giveaway
  FOR giveaway_record IN 
    SELECT DISTINCT giveaway_id FROM giveaway_entries WHERE entry_number IS NULL
  LOOP
    counter := 1;
    
    -- Assign sequential numbers to entries for this giveaway
    FOR entry_record IN 
      SELECT id FROM giveaway_entries 
      WHERE giveaway_id = giveaway_record.giveaway_id 
      AND entry_number IS NULL
      ORDER BY created_at ASC
    LOOP
      UPDATE giveaway_entries 
      SET entry_number = counter 
      WHERE id = entry_record.id;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Step 5: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_entry_number 
ON giveaway_entries(giveaway_id, entry_number);

-- Step 6: Add comment for documentation
COMMENT ON COLUMN giveaway_entries.entry_number IS 'Sequential entry number (1, 2, 3, etc.) for each giveaway, used for random winner selection';
