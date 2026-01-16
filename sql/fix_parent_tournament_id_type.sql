-- Fix parent_recurring_tournament_id Type Mismatch
-- Current: parent_recurring_tournament_id is int8 (bigint)
-- Problem: tournaments.id is UUID, creating a type mismatch
-- Solution: Add new UUID column and migrate data

-- Step 1: Check current schema
DO $$
BEGIN
    RAISE NOTICE 'Checking current schema...';
    
    -- Check if parent_recurring_tournament_id exists and its type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tournaments' 
        AND column_name = 'parent_recurring_tournament_id'
    ) THEN
        RAISE NOTICE 'Found parent_recurring_tournament_id column (int8)';
    END IF;
    
    -- Check if parent_recurring_tournament_uuid already exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tournaments' 
        AND column_name = 'parent_recurring_tournament_uuid'
    ) THEN
        RAISE NOTICE 'parent_recurring_tournament_uuid column already exists';
    ELSE
        RAISE NOTICE 'parent_recurring_tournament_uuid column does not exist yet';
    END IF;
END $$;

-- Step 2: Add new UUID column if it doesn't exist
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS parent_recurring_tournament_uuid UUID;

-- Step 3: Migrate data from int8 to UUID
-- Match id_unique_number (int8) to find the corresponding UUID
UPDATE tournaments t1
SET parent_recurring_tournament_uuid = t2.id
FROM tournaments t2
WHERE t1.parent_recurring_tournament_id = t2.id_unique_number
AND t1.parent_recurring_tournament_id IS NOT NULL
AND t1.parent_recurring_tournament_uuid IS NULL;

-- Step 4: Verify migration
DO $$
DECLARE
    migrated_count INTEGER;
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count
    FROM tournaments
    WHERE parent_recurring_tournament_uuid IS NOT NULL;
    
    SELECT COUNT(*) INTO remaining_count
    FROM tournaments
    WHERE parent_recurring_tournament_id IS NOT NULL
    AND parent_recurring_tournament_uuid IS NULL;
    
    RAISE NOTICE 'Migrated % records to parent_recurring_tournament_uuid', migrated_count;
    
    IF remaining_count > 0 THEN
        RAISE WARNING '% records still have parent_recurring_tournament_id but no UUID match', remaining_count;
    ELSE
        RAISE NOTICE 'All records successfully migrated';
    END IF;
END $$;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN tournaments.parent_recurring_tournament_uuid IS 
'UUID reference to the parent/master recurring tournament. Replaces parent_recurring_tournament_id (int8) to match tournaments.id type.';

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_parent_recurring_uuid 
ON tournaments(parent_recurring_tournament_uuid)
WHERE parent_recurring_tournament_uuid IS NOT NULL;

-- Step 7: Final confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Migration complete. Review the results and drop parent_recurring_tournament_id when ready.';
    RAISE NOTICE 'To drop the old column later, run: ALTER TABLE tournaments DROP COLUMN parent_recurring_tournament_id;';
END $$;

-- Note: We keep the old parent_recurring_tournament_id column for now
-- It can be dropped later after verifying the migration worked correctly
