-- Add recurring_template_status column to tournaments_archive table
-- This is needed before the archive function can preserve this field

-- Add the column to tournaments_archive table
ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS recurring_template_status recurring_template_status_enum DEFAULT 'active';

-- Add comment
COMMENT ON COLUMN tournaments_archive.recurring_template_status IS 
'Preserved template status from when tournament was archived. 
Shows whether the recurring series was set to continue generating at time of archival.';

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tournaments_archive'
AND column_name = 'recurring_template_status';

-- Show confirmation
DO $$
BEGIN
    RAISE NOTICE 'Column recurring_template_status added to tournaments_archive table';
    RAISE NOTICE 'You can now run the archive function without errors';
END $$;
