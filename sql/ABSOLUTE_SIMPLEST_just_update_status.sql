-- ABSOLUTE SIMPLEST - Just updates status, no recurring generation
-- Use this first to clean up past tournaments

CREATE OR REPLACE FUNCTION archive_expired_tournaments()
RETURNS TABLE (
    archived_count INTEGER,
    recurring_generated_count INTEGER,
    error_message TEXT
) AS $$
DECLARE
    archived_tournaments_count INTEGER := 0;
BEGIN
    -- Simply update status to 'archived' for past tournaments
    UPDATE tournaments
    SET status = 'archived'
    WHERE start_date < CURRENT_DATE 
    AND status = 'active';
    
    GET DIAGNOSTICS archived_tournaments_count = ROW_COUNT;

    -- Return results (no recurring generation for now to avoid errors)
    RETURN QUERY SELECT 
        archived_tournaments_count,
        0, -- No recurring generated yet
        'Archived past tournaments. Run generate_recurring_tournaments_horizon() separately to generate new ones.'::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0,
        0,
        SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- After running this, you can separately run:
-- SELECT * FROM generate_recurring_tournaments_horizon();
-- to generate new recurring tournaments
