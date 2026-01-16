-- Migration script to convert venues.td_id from UUID strings to id_auto integers
-- This will make the tournament director references use readable integer IDs

-- Step 1: Add a new temporary column for id_auto values
ALTER TABLE venues ADD COLUMN td_id_auto INT;

-- Step 2: Update the new column by matching UUIDs to id_auto values
-- Handle both UUID format and any existing string formats
UPDATE venues 
SET td_id_auto = profiles.id_auto
FROM profiles 
WHERE (
  -- Match UUID strings to profile id
  venues.td_id = profiles.id::text
  OR
  -- Match any existing string-based td_id that might be a username or email
  venues.td_id = profiles.user_name
  OR
  venues.td_id = profiles.email
)
AND venues.td_id IS NOT NULL 
AND venues.td_id != ''
AND venues.td_id != 'null';

-- Step 3: Handle any venues with old TD string formats that don't match profiles
-- Set them to NULL so they can be reassigned properly
UPDATE venues 
SET td_id_auto = NULL
WHERE td_id_auto IS NULL 
AND td_id IS NOT NULL 
AND td_id != '' 
AND td_id != 'null';

-- Step 4: Drop the old td_id column
ALTER TABLE venues DROP COLUMN td_id;

-- Step 5: Rename the new column to td_id
ALTER TABLE venues RENAME COLUMN td_id_auto TO td_id;

-- Step 6: Add foreign key constraint to ensure data integrity
ALTER TABLE venues 
ADD CONSTRAINT fk_venues_td_id 
FOREIGN KEY (td_id) 
REFERENCES profiles(id_auto) 
ON DELETE SET NULL;

-- Step 7: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_venues_td_id ON venues(td_id);

-- Step 8: Log migration results
DO $$
DECLARE
    venue_count INT;
    assigned_count INT;
    unassigned_count INT;
BEGIN
    SELECT COUNT(*) INTO venue_count FROM venues;
    SELECT COUNT(*) INTO assigned_count FROM venues WHERE td_id IS NOT NULL;
    SELECT COUNT(*) INTO unassigned_count FROM venues WHERE td_id IS NULL;
    
    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE '  Total venues: %', venue_count;
    RAISE NOTICE '  Venues with assigned directors: %', assigned_count;
    RAISE NOTICE '  Venues without directors: %', unassigned_count;
END $$;

-- Verification query to check the migration
-- SELECT v.id, v.venue, v.td_id, p.name, p.user_name 
-- FROM venues v 
-- LEFT JOIN profiles p ON v.td_id = p.id_auto 
-- WHERE v.td_id IS NOT NULL;
