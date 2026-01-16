-- FIX: Column count mismatch when inserting into tournaments_archive
-- The issue is we're trying to insert archival fields that are already in the table

-- Step 1: Ensure tournaments_archive exists with archival fields
CREATE TABLE IF NOT EXISTS tournaments_archive AS 
SELECT * FROM tournaments WHERE 1=0;

ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removal_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removal_reason TEXT DEFAULT 'expired';

ALTER TABLE tournaments_archive 
ADD COLUMN IF NOT EXISTS removed_by_admin_id TEXT;

-- Step 2: Move tournaments with status='archived' to archive table
-- FIX: Don't add extra columns in SELECT, let DEFAULT values handle archival fields
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
        -- Delete likes first
        DELETE FROM likes WHERE turnament_id = tournament_record.id;
        
        -- Insert into tournaments_archive (only tournament fields, archival fields use DEFAULT)
        INSERT INTO tournaments_archive (
            id, id_unique_number, uuid, tournament_name, game_type, format,
            director_name, description, equipment, custom_equipment, game_spot,
            venue, venue_lat, venue_lng, address, phone, city, state, zip_code,
            thumbnail_type, thumbnail_url, start_date, is_recurring,
            is_recurring_master, recurring_series_id, parent_recurring_tournament_id,
            parent_recurring_tournament_uuid, reports_to_fargo, is_open_tournament,
            race_details, number_of_tables, table_size, max_fargo, tournament_fee,
            side_pots, chip_allocations, status, required_fargo_games,
            has_required_fargo_games, green_fee, has_green_fee, point_location,
            venue_id, profiles, created_at, updated_at
        )
        SELECT 
            id, id_unique_number, uuid, tournament_name, game_type, format,
            director_name, description, equipment, custom_equipment, game_spot,
            venue, venue_lat, venue_lng, address, phone, city, state, zip_code,
            thumbnail_type, thumbnail_url, start_date, is_recurring,
            is_recurring_master, recurring_series_id, parent_recurring_tournament_id,
            parent_recurring_tournament_uuid, reports_to_fargo, is_open_tournament,
            race_details, number_of_tables, table_size, max_fargo, tournament_fee,
            side_pots, chip_allocations, status, required_fargo_games,
            has_required_fargo_games, green_fee, has_green_fee, point_location,
            venue_id, profiles, created_at, updated_at
        FROM tournaments 
        WHERE id = tournament_record.id;

        -- Delete from tournaments table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        moved_count := moved_count + 1;
        
        RAISE NOTICE 'Moved tournament % to archive', tournament_record.tournament_name;
    END LOOP;

    RAISE NOTICE 'Total moved: %', moved_count;
END $$;

-- Verify
SELECT COUNT(*) as in_archive FROM tournaments_archive;
SELECT COUNT(*) as still_archived_status FROM tournaments WHERE status = 'archived';
