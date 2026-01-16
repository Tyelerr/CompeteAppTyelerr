-- ============================================================================
-- GIVEAWAY V1 MIGRATION - STEP 3 OF 5
-- ============================================================================
-- Update giveaway_entries table with validation system
-- RUN THIS AFTER STEP 2 COMPLETES
-- ============================================================================

-- Create entry_status enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_status') THEN
    CREATE TYPE entry_status AS ENUM ('valid', 'disqualified');
  END IF;
END $$;

-- Add entry validation columns
-- Note: Check if status column already exists and handle accordingly
DO $$
BEGIN
  -- Add disqualification tracking columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_entries' AND column_name = 'disqualified_reason'
  ) THEN
    ALTER TABLE giveaway_entries ADD COLUMN disqualified_reason TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_entries' AND column_name = 'disqualified_at'
  ) THEN
    ALTER TABLE giveaway_entries ADD COLUMN disqualified_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_entries' AND column_name = 'disqualified_by'
  ) THEN
    ALTER TABLE giveaway_entries ADD COLUMN disqualified_by UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_entries' AND column_name = 'status'
  ) THEN
    ALTER TABLE giveaway_entries ADD COLUMN status entry_status NOT NULL DEFAULT 'valid';
  END IF;
END $$;

-- Remove duplicate entries (keep the first one)
DELETE FROM giveaway_entries a
USING giveaway_entries b
WHERE a.id > b.id
  AND a.giveaway_id = b.giveaway_id
  AND a.user_id = b.user_id;

-- Add unique constraint for one entry per user per giveaway
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'giveaway_entries_user_giveaway_unique'
  ) THEN
    ALTER TABLE giveaway_entries 
    ADD CONSTRAINT giveaway_entries_user_giveaway_unique 
      UNIQUE (giveaway_id, user_id);
  END IF;
END $$;

-- Add comments (only if columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_entries' AND column_name = 'status'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN giveaway_entries.status IS ''Entry validity status (valid or disqualified)''';
    
    -- Create index for valid entries queries
    CREATE INDEX IF NOT EXISTS idx_giveaway_entries_status 
      ON giveaway_entries(giveaway_id, status) 
      WHERE status = 'valid';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_entries' AND column_name = 'disqualified_reason'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN giveaway_entries.disqualified_reason IS ''Reason for disqualification''';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_entries' AND column_name = 'disqualified_at'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN giveaway_entries.disqualified_at IS ''Timestamp when entry was disqualified''';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_entries' AND column_name = 'disqualified_by'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN giveaway_entries.disqualified_by IS ''Admin user who disqualified the entry''';
  END IF;
END $$;
