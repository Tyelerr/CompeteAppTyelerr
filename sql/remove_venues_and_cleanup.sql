-- Drop foreign key constraint from tournaments table if exists
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_venue_id_fkey;

-- Remove venue_id column from tournaments table
ALTER TABLE tournaments DROP COLUMN IF EXISTS venue_id;

-- Drop the venues table
DROP TABLE IF EXISTS venues CASCADE;

-- Optional: Remove any other references to venues in the database (indexes, triggers, etc.)
-- Add additional cleanup commands here if needed
