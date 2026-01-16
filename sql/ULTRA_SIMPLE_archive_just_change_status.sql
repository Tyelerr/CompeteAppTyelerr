-- ULTRA SIMPLE VERSION - Just changes status to 'archived' instead of moving to history table
-- This avoids all the field mapping issues

CREATE OR REPLACE FUNCTION archive_expired_tournaments()
RETURNS TABLE (
    archived_count INTEGER,
    recurring_generated_count INTEGER,
    error_message TEXT
) AS $$
DECLARE
    archived_tournaments_count INTEGER := 0;
    generated_tournaments_count INTEGER := 0;
    generation_result RECORD;
BEGIN
    -- Simply update status to 'archived' for past tournaments
    UPDATE tournaments
    SET status = 'archived'
    WHERE start_date < CURRENT_DATE 
    AND status = 'active';
    
    GET DIAGNOSTICS archived_tournaments_count = ROW_COUNT;

    -- Generate new recurring tournaments
    FOR generation_result IN 
        SELECT * FROM generate_recurring_tournaments_horizon()
    LOOP
        generated_tournaments_count := generated_tournaments_count + COALESCE(generation_result.tournaments_created, 0);
    END LOOP;

    RETURN QUERY SELECT 
        archived_tournaments_count,
        generated_tournaments_count,
        NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0,
        0,
        SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_expired_tournaments() IS 
'Marks past tournaments as archived (status = archived) and generates new recurring tournaments up to 60 days ahead.';

-- Test it:
-- SELECT * FROM archive_expired_tournaments();
