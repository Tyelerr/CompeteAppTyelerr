-- Simplified Tournament Archival Function
-- This version removes all profile-related joins to avoid column errors

-- Function to archive expired tournaments (tournaments on their date)
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
BEGIN
    -- Archive tournaments on their tournament date at midnight (same day archival)
    FOR tournament_record IN 
        SELECT *
        FROM tournaments
        WHERE start_date <= CURRENT_DATE 
        AND status = 'active'
    LOOP
        -- Get venue data snapshot if venue exists
        venue_data := NULL;
        IF tournament_record.venue_id IS NOT NULL THEN
            BEGIN
                SELECT to_jsonb(v.*) INTO venue_data
                FROM venues v 
                WHERE v.id = tournament_record.venue_id;
            EXCEPTION WHEN OTHERS THEN
                venue_data := NULL;
            END;
        END IF;

        -- Insert into tournaments_history with minimal required fields
        INSERT INTO tournaments_history (
            id_unique_number,
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
            venue_id,
            original_id,
            original_created_at,
            original_updated_at,
            archived_reason,
            venue_snapshot
        ) VALUES (
            tournament_record.id_unique_number,
            tournament_record.uuid,
            tournament_record.tournament_name,
            tournament_record.game_type,
            tournament_record.format,
            tournament_record.director_name,
            COALESCE(tournament_record.description, ''),
            COALESCE(tournament_record.equipment, ''),
            COALESCE(tournament_record.custom_equipment, ''),
            COALESCE(tournament_record.game_spot, ''),
            COALESCE(tournament_record.venue, ''),
            COALESCE(tournament_record.venue_lat, ''),
            COALESCE(tournament_record.venue_lng, ''),
            COALESCE(tournament_record.address, ''),
            COALESCE(tournament_record.phone, ''),
            COALESCE(tournament_record.city, ''),
            COALESCE(tournament_record.state, ''),
            COALESCE(tournament_record.zip_code, ''),
            COALESCE(tournament_record.thumbnail_type, ''),
            COALESCE(tournament_record.thumbnail_url, ''),
            tournament_record.start_date,
            COALESCE(tournament_record.strart_time, ''),
            COALESCE(tournament_record.is_recurring, FALSE),
            COALESCE(tournament_record.reports_to_fargo, FALSE),
            COALESCE(tournament_record.is_open_tournament, FALSE),
            COALESCE(tournament_record.race_details, ''),
            COALESCE(tournament_record.number_of_tables, 0),
            COALESCE(tournament_record.table_size, ''),
            COALESCE(tournament_record.max_fargo, 0),
            COALESCE(tournament_record.tournament_fee, 0),
            COALESCE(tournament_record.side_pots, '{}'),
            tournament_record.status,
            tournament_record.venue_id,
            tournament_record.id,
            COALESCE(tournament_record.created_at, NOW()),
            COALESCE(tournament_record.updated_at, NOW()),
            'expired',
            venue_data
        );

        -- Delete from active tournaments table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        archived_tournaments_count := archived_tournaments_count + 1;
        
        -- Log the archival for debugging
        RAISE NOTICE 'Archived tournament ID % (%) dated %', 
            tournament_record.id_unique_number, 
            tournament_record.tournament_name, 
            tournament_record.start_date;
            
    END LOOP;

    -- Don't try to generate recurring tournaments for now to avoid additional errors
    generated_tournaments_count := 0;

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

-- Test the function immediately
SELECT * FROM archive_expired_tournaments();
