-- SIMPLEST VERSION - Just copy whatever columns exist, don't assume structure

-- Step 1: Drop and recreate tournaments_archive to match current tournaments table exactly
DROP TABLE IF EXISTS tournaments_archive CASCADE;

CREATE TABLE tournaments_archive AS 
SELECT * FROM tournaments WHERE 1=0;

-- Add only the archival tracking fields
ALTER TABLE tournaments_archive 
ADD COLUMN removal_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE tournaments_archive 
ADD COLUMN removal_reason TEXT DEFAULT 'expired';

ALTER TABLE tournaments_archive 
ADD COLUMN removed_by_admin_id TEXT;

-- Step 2: Move archived tournaments
DO $$
DECLARE
    moved_count INTEGER := 0;
BEGIN
    -- Insert all tournaments with status='archived' into archive
    INSERT INTO tournaments_archive (
        SELECT *, NOW(), 'expired', NULL
        FROM tournaments
        WHERE status = 'archived'
    );
    
    GET DIAGNOSTICS moved_count = ROW_COUNT;
    
    -- Delete likes for archived tournaments
    DELETE FROM likes 
    WHERE turnament_id IN (
        SELECT id FROM tournaments WHERE status = 'archived'
    );
    
    -- Delete archived tournaments from main table
    DELETE FROM tournaments WHERE status = 'archived';
    
    RAISE NOTICE 'Moved % tournaments to archive', moved_count;
END $$;

-- Verify
SELECT 'Tournaments in archive:' as info, COUNT(*) as count FROM tournaments_archive
UNION ALL
SELECT 'Tournaments still with archived status:', COUNT(*) FROM tournaments WHERE status = 'archived';
