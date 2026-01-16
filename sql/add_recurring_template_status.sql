-- Step 1: Add recurring_template_status field to tournaments table
-- This separates "Tournament Instance Active" from "Recurring Template Active"

-- Create the enum type for recurring template status
DO $$ BEGIN
    CREATE TYPE recurring_template_status_enum AS ENUM ('active', 'paused', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the column to tournaments table with default value 'active'
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS recurring_template_status recurring_template_status_enum DEFAULT 'active';

-- Migrate existing data: Set all recurring masters to 'active'
UPDATE tournaments
SET recurring_template_status = 'active'
WHERE is_recurring_master = true
AND is_recurring = true;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tournaments_recurring_template_status
ON tournaments(recurring_template_status)
WHERE is_recurring_master = true;

-- Add comment to document the field
COMMENT ON COLUMN tournaments.recurring_template_status IS 
'Controls whether the recurring series should keep generating future instances. 
Values: active (keep generating), paused (temporarily stop), archived (permanently stop).
This is independent of the tournament instance status field.';

-- Verify the migration
DO $$
DECLARE
    master_count INTEGER;
    active_template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO master_count
    FROM tournaments
    WHERE is_recurring_master = true AND is_recurring = true;
    
    SELECT COUNT(*) INTO active_template_count
    FROM tournaments
    WHERE is_recurring_master = true 
    AND is_recurring = true 
    AND recurring_template_status = 'active';
    
    RAISE NOTICE 'Migration complete:';
    RAISE NOTICE '  Total recurring masters: %', master_count;
    RAISE NOTICE '  Masters with active template status: %', active_template_count;
    
    IF master_count > 0 AND active_template_count = 0 THEN
        RAISE WARNING 'No masters have active template status! Check migration.';
    END IF;
END $$;
