-- Add venue_id column to tournaments table
-- This migration adds the venue_id foreign key column to link tournaments with venues

-- Add the venue_id column as an integer that can be null (for backward compatibility)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS venue_id INTEGER;

-- Add a foreign key constraint to link to the venues table
-- Note: This assumes the venues table has an 'id' column as primary key
-- Using DO block to handle constraint existence check since PostgreSQL doesn't support IF NOT EXISTS with ADD CONSTRAINT
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tournaments_venue_id' 
        AND table_name = 'tournaments'
    ) THEN
        ALTER TABLE tournaments 
        ADD CONSTRAINT fk_tournaments_venue_id 
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_tournaments_venue_id ON tournaments(venue_id);

-- Add a comment to document the new column
COMMENT ON COLUMN tournaments.venue_id IS 'Foreign key reference to venues table - links tournament to a specific venue';

-- Display the result
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
  AND column_name = 'venue_id';
