-- Create a simple tournaments archive table
-- This table mirrors the tournaments table exactly and adds archival fields

-- First, let's create the archive table based on the tournaments table structure
CREATE TABLE IF NOT EXISTS tournaments_archive AS 
SELECT * FROM tournaments WHERE 1=0; -- Copy structure but no data

-- Add our archival fields to the new table
ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removal_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removal_reason TEXT DEFAULT 'expired';

ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removed_by_admin_id TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tournaments_archive_removal_date 
ON tournaments_archive(removal_date);

CREATE INDEX IF NOT EXISTS idx_tournaments_archive_removal_reason 
ON tournaments_archive(removal_reason);

CREATE INDEX IF NOT EXISTS idx_tournaments_archive_start_date 
ON tournaments_archive(start_date);

CREATE INDEX IF NOT EXISTS idx_tournaments_archive_id_unique_number 
ON tournaments_archive(id_unique_number);

-- Add comments for documentation
COMMENT ON TABLE tournaments_archive IS 'Archive of tournaments that have ended or been deleted';
COMMENT ON COLUMN tournaments_archive.removal_date IS 'Timestamp when the tournament was archived';
COMMENT ON COLUMN tournaments_archive.removal_reason IS 'Reason for archival: expired, admin_deletion, etc.';
COMMENT ON COLUMN tournaments_archive.removed_by_admin_id IS 'Admin user ID who deleted the tournament (if applicable)';

-- Simple function to archive expired tournaments
CREATE OR REPLACE FUNCTION archive_expired_tournaments_simple()
RETURNS TABLE (
    archived_count INTEGER,
    error_message TEXT
) AS $$
DECLARE
    archived_tournaments_count INTEGER := 0;
    tournament_record RECORD;
BEGIN
    -- Archive tournaments on their tournament date at midnight (same day archival)
    FOR tournament_record IN 
        SELECT *
        FROM tournaments
        WHERE start_date <= CURRENT_DATE 
        AND status = 'active'
    LOOP
        -- Insert into tournaments_archive (all fields from tournaments + archival fields)
        INSERT INTO tournaments_archive 
        SELECT *, NOW(), 'expired', NULL
        FROM tournaments 
        WHERE id = tournament_record.id;

        -- Delete from active tournaments table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        archived_tournaments_count := archived_tournaments_count + 1;
        
        -- Log the archival for debugging
        RAISE NOTICE 'Archived tournament ID % (%) dated %', 
            tournament_record.id_unique_number, 
            tournament_record.tournament_name, 
            tournament_record.start_date;
            
    END LOOP;

    RETURN QUERY SELECT 
        archived_tournaments_count,
        NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0,
        SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to manually archive a tournament (for admin deletions)
CREATE OR REPLACE FUNCTION archive_tournament_manual_simple(
    tournament_id UUID,
    admin_user_id TEXT DEFAULT NULL,
    reason TEXT DEFAULT 'admin_deletion'
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    -- Check if tournament exists
    IF EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_id) THEN
        -- Insert into tournaments_archive
        INSERT INTO tournaments_archive 
        SELECT *, NOW(), reason, admin_user_id
        FROM tournaments 
        WHERE id = tournament_id;

        -- Delete from active tournaments table
        DELETE FROM tournaments WHERE id = tournament_id;
        
        success := TRUE;
        
        RAISE NOTICE 'Manually archived tournament % by admin %', tournament_id, admin_user_id;
    END IF;

    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Test the function immediately
SELECT * FROM archive_expired_tournaments_simple();
