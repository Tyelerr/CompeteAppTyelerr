-- COMPLETE SOLUTION: Move past tournaments to tournaments_archive table
-- This replaces the status update approach with actual table movement

-- Step 1: Ensure tournaments_archive table exists with proper structure
CREATE TABLE IF NOT EXISTS tournaments_archive AS 
SELECT * FROM tournaments WHERE 1=0;

-- Add archival tracking fields
ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removal_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removal_reason TEXT DEFAULT 'expired';

ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removed_by_admin_id TEXT;

-- Step 2: Create the archival function that MOVES tournaments to archive table
CREATE OR REPLACE FUNCTION archive_expired_tournaments()
RETURNS TABLE (
    archived_count INTEGER,
    recurring_generated INTEGER,
    error_message TEXT
) AS $$
DECLARE
    archived_tournaments_count INTEGER := 0;
    tournament_record RECORD;
BEGIN
    -- Archive past tournaments by MOVING them to tournaments_archive
    FOR tournament_record IN 
        SELECT *
        FROM tournaments
        WHERE start_date < CURRENT_DATE 
        AND status = 'active'
    LOOP
        -- Delete likes first (column is 'turnament_id' with one 'o')
        DELETE FROM likes WHERE turnament_id = tournament_record.id;
        
        -- Insert into tournaments_archive with archival metadata
        INSERT INTO tournaments_archive 
        SELECT *, NOW(), 'expired', NULL
        FROM tournaments 
        WHERE id = tournament_record.id;

        -- Delete from active tournaments table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        archived_tournaments_count := archived_tournaments_count + 1;
        
        RAISE NOTICE 'Archived tournament % to archive table', tournament_record.tournament_name;
    END LOOP;

    -- Return results (no recurring generation to avoid errors)
    RETURN QUERY SELECT 
        archived_tournaments_count,
        0,
        'Archived tournaments moved to tournaments_archive table. Run generate_recurring_tournaments_horizon() separately.'::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0,
        0,
        SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Test it
SELECT * FROM archive_expired_tournaments();

-- Step 4: After this works, run the recurring generator separately:
-- SELECT * FROM generate_recurring_tournaments_horizon();
