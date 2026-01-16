-- Complete Fix for tournaments_archive Table
-- This ensures the archive table matches the tournaments table structure

-- Step 1: Add recurring_template_status column if missing
ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS recurring_template_status recurring_template_status_enum DEFAULT 'active';

-- Step 2: Fix the removal_date column type (change from timestamp to timestamptz)
ALTER TABLE tournaments_archive 
ALTER COLUMN removal_date TYPE timestamp with time zone USING removal_date AT TIME ZONE 'UTC';

-- Step 3: Verify the changes
DO $$
DECLARE
    template_status_exists BOOLEAN;
    removal_date_type TEXT;
BEGIN
    -- Check if recurring_template_status exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tournaments_archive'
        AND column_name = 'recurring_template_status'
    ) INTO template_status_exists;
    
    -- Get removal_date type
    SELECT data_type INTO removal_date_type
    FROM information_schema.columns
    WHERE table_name = 'tournaments_archive'
    AND column_name = 'removal_date';
    
    RAISE NOTICE '✅ Archive table fix complete:';
    RAISE NOTICE '   - recurring_template_status column exists: %', template_status_exists;
    RAISE NOTICE '   - removal_date type: %', removal_date_type;
    
    IF template_status_exists AND removal_date_type = 'timestamp with time zone' THEN
        RAISE NOTICE '✅ Archive table is ready! You can now run archive_expired_tournaments()';
    ELSE
        RAISE WARNING '⚠️  Some issues remain. Check the output above.';
    END IF;
END $$;
