-- CRITICAL FIX: Never archive master tournaments
-- Master tournaments (is_recurring_master = true) must stay active forever as templates

-- Update the archival function to exclude masters
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
    -- Archive past tournaments BUT EXCLUDE MASTERS
    FOR tournament_record IN 
        SELECT *
        FROM tournaments
        WHERE start_date < CURRENT_DATE 
        AND status = 'active'
        AND (is_recurring_master = false OR is_recurring_master IS NULL)  -- NEVER archive masters!
    LOOP
        -- Delete likes
        DELETE FROM likes WHERE turnament_id = tournament_record.id;
        
        -- Move to archive
        INSERT INTO tournaments_archive 
        SELECT *, NOW(), 'expired', NULL
        FROM tournaments 
        WHERE id = tournament_record.id;

        -- Delete from main table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        archived_tournaments_count := archived_tournaments_count + 1;
        
        RAISE NOTICE 'Archived tournament %', tournament_record.tournament_name;
    END LOOP;

    RETURN QUERY SELECT 
        archived_tournaments_count,
        0,
        'Archived past tournaments (masters excluded). Run generate_recurring_tournaments_horizon() separately.'::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0,
        0,
        SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_expired_tournaments() IS 
'Archives expired tournaments but NEVER archives master tournaments (is_recurring_master=true). 
Masters must stay active forever as templates for generating new instances.';

-- Also update the manual UPDATE approach to exclude masters
-- If you want to manually set status to archived:
UPDATE tournaments
SET status = 'archived'
WHERE start_date < CURRENT_DATE 
AND status = 'active'
AND (is_recurring_master = false OR is_recurring_master IS NULL);  -- NEVER archive masters!
