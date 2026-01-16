-- Add Unique Constraint to Prevent Duplicate Recurring Tournaments
-- This prevents the same recurring series from having multiple tournaments on the same date

-- Step 1: First, check if there are any existing duplicates
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT recurring_series_id, start_date, COUNT(*) as cnt
        FROM tournaments
        WHERE is_recurring = true
        AND recurring_series_id IS NOT NULL
        GROUP BY recurring_series_id, start_date
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % duplicate recurring tournament entries. These should be cleaned up before adding the constraint.', duplicate_count;
        RAISE NOTICE 'Run the diagnose_recurring_tournaments.sql to identify duplicates.';
    ELSE
        RAISE NOTICE 'No duplicates found. Safe to add constraint.';
    END IF;
END $$;

-- Step 2: Create a partial unique index (PostgreSQL doesn't support WHERE in UNIQUE constraints)
-- This will prevent future duplicates from being created
-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_unique_recurring_series_date;

-- Create partial unique index
CREATE UNIQUE INDEX idx_unique_recurring_series_date 
ON tournaments (recurring_series_id, start_date)
WHERE is_recurring = true;

-- Add comment for documentation
COMMENT ON INDEX idx_unique_recurring_series_date IS 
'Prevents duplicate tournaments for the same recurring series on the same date. Only applies to recurring tournaments (is_recurring = true).';

-- Verify the index was added
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname = 'idx_unique_recurring_series_date';
