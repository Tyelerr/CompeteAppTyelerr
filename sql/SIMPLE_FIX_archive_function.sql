-- SIMPLE WORKING VERSION - Archives tournaments without complex field mapping
-- This version only copies fields that definitely exist in both tables

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
    generation_result RECORD;
BEGIN
    -- Archive tournaments where start_date has passed
    FOR tournament_record IN 
        SELECT *
        FROM tournaments
        WHERE start_date < CURRENT_DATE 
        AND status = 'active'
    LOOP
        -- Simple insert - only copy core fields that exist in both tables
        INSERT INTO tournaments_history (
            id_unique_number,
            uuid,
            tournament_name,
            game_type,
            format,
            director_name,
            description,
            equipment,
            venue,
            address,
            phone,
            thumbnail_type,
            thumbnail_url,
            start_date,
            strart_time,
            is_recurring,
            reports_to_fargo,
            is_open_tournament,
            status,
            recurring_series_id,
            is_recurring_master,
            original_id,
            archived_reason
        ) VALUES (
            tournament_record.id_unique_number,
            tournament_record.uuid,
            tournament_record.tournament_name,
            tournament_record.game_type,
            tournament_record.format,
            tournament_record.director_name,
            tournament_record.description,
            tournament_record.equipment,
            tournament_record.venue,
            tournament_record.address,
            tournament_record.phone,
            tournament_record.thumbnail_type,
            tournament_record.thumbnail_url,
            tournament_record.start_date,
            tournament_record.strart_time,
            tournament_record.is_recurring,
            tournament_record.reports_to_fargo,
            tournament_record.is_open_tournament,
            tournament_record.status,
            tournament_record.recurring_series_id,
            tournament_record.is_recurring_master,
            tournament_record.id,
            'expired'
        );

        -- Delete from active tournaments table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        archived_tournaments_count := archived_tournaments_count + 1;
    END LOOP;

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
'Archives past tournaments (start_date < today) and generates new recurring tournaments up to 60 days ahead.';

-- After running this, test it with:
-- SELECT * FROM archive_expired_tournaments();
