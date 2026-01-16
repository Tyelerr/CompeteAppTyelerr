-- Apply the updated tournament maintenance functions to the database
-- Run this script in your Supabase SQL editor to update the functions

-- Tournament Maintenance Functions
-- Functions for archiving expired tournaments and managing recurring tournaments

-- Function to archive expired tournaments (tournaments past their date)
CREATE OR REPLACE FUNCTION archive_expired_tournaments()
RETURNS TABLE (
    archived_count INTEGER,
    recurring_generated_count INTEGER,
    error_message TEXT
) AS $$
DECLARE
    archived_tournaments_count INTEGER := 0;
    generated_tournaments_count INTEGER := 0;
    tournament_record RECORD;
    venue_data JSONB;
    profile_data RECORD;
BEGIN
    -- Archive tournaments on their tournament date at midnight (same day archival)
    FOR tournament_record IN 
        SELECT t.*, p.user_name, p.email, p.name as profile_name
        FROM tournaments t
        LEFT JOIN profiles p ON t.profiles = p.id
        WHERE t.start_date <= CURRENT_DATE 
        AND t.status = 'active'
    LOOP
        -- Get venue data snapshot if venue exists
        venue_data := NULL;
        IF tournament_record.venue_id IS NOT NULL THEN
            SELECT to_jsonb(v.*) INTO venue_data
            FROM venues v 
            WHERE v.id = tournament_record.venue_id;
        END IF;

        -- Insert into tournaments_history
        INSERT INTO tournaments_history (
            id_unique_number,
            parent_recurring_tournament_id,
            uuid,
            tournament_name,
            game_type,
            format,
            director_name,
            description,
            equipment,
            custom_equipment,
            game_spot,
            venue,
            venue_lat,
            venue_lng,
            address,
            phone,
            city,
            state,
            zip_code,
            thumbnail_type,
            thumbnail_url,
            start_date,
            strart_time,
            is_recurring,
            reports_to_fargo,
            is_open_tournament,
            race_details,
            number_of_tables,
            table_size,
            max_fargo,
            tournament_fee,
            side_pots,
            status,
            required_fargo_games,
            has_required_fargo_games,
            green_fee,
            has_green_fee,
            recurring_series_id,
            is_recurring_master,
            point_location,
            venue_id,
            original_id,
            original_created_at,
            original_updated_at,
            original_deleted_at,
            archived_reason,
            creator_profile_id,
            creator_user_name,
            creator_email,
            creator_name,
            venue_snapshot
        ) VALUES (
            tournament_record.id_unique_number,
            tournament_record.parent_recurring_tournament_id,
            tournament_record.uuid,
            tournament_record.tournament_name,
            tournament_record.game_type,
            tournament_record.format,
            tournament_record.director_name,
            tournament_record.description,
            tournament_record.equipment,
            tournament_record.custom_equipment,
            tournament_record.game_spot,
            tournament_record.venue,
            tournament_record.venue_lat,
            tournament_record.venue_lng,
            tournament_record.address,
            tournament_record.phone,
            tournament_record.city,
            tournament_record.state,
            tournament_record.zip_code,
            tournament_record.thumbnail_type,
            tournament_record.thumbnail_url,
            tournament_record.start_date,
            tournament_record.strart_time,
            tournament_record.is_recurring,
            tournament_record.reports_to_fargo,
            tournament_record.is_open_tournament,
            tournament_record.race_details,
            tournament_record.number_of_tables,
            tournament_record.table_size,
            tournament_record.max_fargo,
            tournament_record.tournament_fee,
            tournament_record.side_pots,
            tournament_record.status,
            tournament_record.required_fargo_games,
            tournament_record.has_required_fargo_games,
            tournament_record.green_fee,
            tournament_record.has_green_fee,
            tournament_record.recurring_series_id,
            tournament_record.is_recurring_master,
            tournament_record.point_location,
            tournament_record.venue_id,
            tournament_record.id,
            tournament_record.created_at,
            tournament_record.updated_at,
            tournament_record.deleted_at,
            'expired',
            tournament_record.profiles,
            tournament_record.user_name,
            tournament_record.email,
            tournament_record.profile_name,
            venue_data
        );

        -- Delete from active tournaments table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        archived_tournaments_count := archived_tournaments_count + 1;
    END LOOP;

    -- Generate new recurring tournaments to maintain at least 4 future instances
    SELECT count INTO generated_tournaments_count 
    FROM generate_recurring_tournaments();

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

-- Test the function immediately after creation
-- This will archive any tournaments that should already be archived
SELECT * FROM archive_expired_tournaments();
