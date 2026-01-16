-- Move tournaments that already have status='archived' to the tournaments_archive table
-- This is for tournaments that were already marked as archived but not moved to the archive table

-- Step 1: Ensure tournaments_archive table exists
CREATE TABLE IF NOT EXISTS tournaments_archive AS 
SELECT * FROM tournaments WHERE 1=0;

-- Add archival tracking fields if they don't exist
ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removal_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removal_reason TEXT DEFAULT 'expired';

ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removed_by_admin_id TEXT;

-- Step 2: Move tournaments with status='archived' to the archive table
DO $$
DECLARE
    tournament_record RECORD;
    moved_count INTEGER := 0;
BEGIN
    FOR tournament_record IN 
        SELECT *
        FROM tournaments
        WHERE status = 'archived'
    LOOP
        -- Delete likes first (column is 'turnament_id' with one 'o')
        DELETE FROM likes WHERE turnament_id = tournament_record.id;
        
        -- Insert into tournaments_archive
        INSERT INTO tournaments_archive 
        SELECT *, NOW(), 'expired', NULL
        FROM tournaments 
        WHERE id = tournament_record.id;

        -- Delete from tournaments table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        moved_count := moved_count + 1;
        
        RAISE NOTICE 'Moved tournament % (%) to archive table', 
            tournament_record.id_unique_number, 
            tournament_record.tournament_name;
    END LOOP;

    RAISE NOTICE 'Total tournaments moved to archive: %', moved_count;
END $$;

-- Step 3: Verify the move
SELECT COUNT(*) as tournaments_in_archive FROM tournaments_archive;
SELECT COUNT(*) as tournaments_still_active FROM tournaments WHERE status = 'active';
SELECT COUNT(*) as tournaments_still_archived_status FROM tournaments WHERE status = 'archived';
