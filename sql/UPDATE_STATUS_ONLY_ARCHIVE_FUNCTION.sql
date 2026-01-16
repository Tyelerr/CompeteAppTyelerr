-- CORRECT Archive Function: Just Update Status, Don't Move to Archive Table
-- This keeps tournaments in the main table but changes their status to 'archived'

DROP FUNCTION IF EXISTS archive_expired_tournaments() CASCADE;

CREATE OR REPLACE FUNCTION archive_expired_tournaments()
RETURNS TABLE (
    archived_count INTEGER,
    recurring_generated INTEGER,
    error_message TEXT
) AS $$
DECLARE
    archived_tournaments_count INTEGER := 0;
BEGIN
    -- Simply update the status to 'archived' for past tournaments
    -- DO NOT move them to archive table
    -- DO NOT delete them
    -- PRESERVE recurring_template_status
    
    UPDATE tournaments
    SET status = 'archived'
    WHERE start_date < CURRENT_DATE 
    AND status = 'active';
    
    GET DIAGNOSTICS archived_tournaments_count = ROW_COUNT;

    RETURN QUERY SELECT 
        archived_tournaments_count,
        0,
        format('Updated status to archived for %s past tournaments. Tournaments remain in main table. Template status preserved.', 
            archived_tournaments_count)::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0,
        0,
        SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_expired_tournaments() IS 
'Updates status to archived for expired tournaments. 
Tournaments stay in the main tournaments table (not moved to archive table).
NEVER modifies recurring_template_status.
Master tournaments can have status=archived while recurring_template_status=active for continued generation.';

-- Verification
SELECT 
    COUNT(*) as total_tournaments,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_count,
    COUNT(CASE WHEN status = 'archived' AND recurring_template_status = 'active' THEN 1 END) as archived_with_active_template
FROM tournaments;
