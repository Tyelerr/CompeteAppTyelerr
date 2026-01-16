-- Step 3: Update Archive Function to Preserve recurring_template_status
-- FIXED VERSION: Drop the old function first, then create the new one

-- Drop the existing function first (with all possible signatures)
DROP FUNCTION IF EXISTS archive_expired_tournaments();
DROP FUNCTION IF EXISTS archive_expired_tournaments() CASCADE;

-- Now create the updated function with the correct signature
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
    -- Archive past tournaments (INCLUDING MASTERS)
    -- CRITICAL: We now archive masters too, but preserve their template status
    FOR tournament_record IN 
        SELECT *
        FROM tournaments
        WHERE start_date < CURRENT_DATE 
        AND status = 'active'
        -- NO LONGER EXCLUDE MASTERS - they can be archived as instances
    LOOP
        -- Delete likes
        DELETE FROM likes WHERE turnament_id = tournament_record.id;
        
        -- Move to archive (preserving recurring_template_status)
        INSERT INTO tournaments_archive 
        SELECT *, NOW(), 'expired', NULL
        FROM tournaments 
        WHERE id = tournament_record.id;

        -- Delete from main table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        archived_tournaments_count := archived_tournaments_count + 1;
        
        -- Log if we archived a master (for monitoring)
        IF tournament_record.is_recurring_master THEN
            RAISE NOTICE 'Archived master tournament % (series: %, template_status: %)', 
                tournament_record.tournament_name,
                tournament_record.recurring_series_id,
                tournament_record.recurring_template_status;
        END IF;
    END LOOP;

    RETURN QUERY SELECT 
        archived_tournaments_count,
        0,
        format('Archived %s past tournaments (including masters if past). Template status preserved. Run generate_recurring_tournaments_horizon() to create new instances.', 
            archived_tournaments_count)::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0,
        0,
        SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_expired_tournaments() IS 
'Archives expired tournaments including master tournaments when their date passes.
CRITICAL: This function NEVER modifies recurring_template_status.
Master tournaments can be archived as instances while their template remains active for generation.
The generator uses recurring_template_status (not instance status) to determine which series to generate.';

-- Verification query to check the system is working correctly
DO $$
DECLARE
    archived_masters_count INTEGER;
    active_template_count INTEGER;
BEGIN
    -- Count archived masters with active templates
    SELECT COUNT(*) INTO archived_masters_count
    FROM tournaments
    WHERE is_recurring_master = true
    AND status = 'archived'
    AND recurring_template_status = 'active';
    
    -- Count all active templates
    SELECT COUNT(*) INTO active_template_count
    FROM tournaments
    WHERE is_recurring_master = true
    AND recurring_template_status = 'active';
    
    RAISE NOTICE 'System Status:';
    RAISE NOTICE '  Archived masters with active templates: %', archived_masters_count;
    RAISE NOTICE '  Total active templates: %', active_template_count;
    RAISE NOTICE '  These archived masters will continue generating future tournaments';
END $$;
