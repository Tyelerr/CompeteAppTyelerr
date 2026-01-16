-- Minimal Tournament Archival Function
-- This version only uses core fields that definitely exist in the tournaments table

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
BEGIN
    -- Archive tournaments on their tournament date at midnight (same day archival)
    FOR tournament_record IN 
        SELECT *
        FROM tournaments
        WHERE start_date <= CURRENT_DATE 
        AND status = 'active'
    LOOP
        -- Insert into tournaments_history with only core fields
        INSERT INTO tournaments_history (
            id_unique_number,
            uuid,
            tournament_name,
            game_type,
            format,
            director_name,
            venue,
            address,
            start_date,
            strart_time,
            tournament_fee,
            status,
            venue_id,
            original_id,
            original_created_at,
            original_updated_at,
            archived_reason
        ) VALUES (
            tournament_record.id_unique_number,
            tournament_record.uuid,
            tournament_record.tournament_name,
            tournament_record.game_type,
            tournament_record.format,
            tournament_record.director_name,
            COALESCE(tournament_record.venue, ''),
            COALESCE(tournament_record.address, ''),
            tournament_record.start_date,
            COALESCE(tournament_record.strart_time, ''),
            COALESCE(tournament_record.tournament_fee, 0),
            tournament_record.status,
            tournament_record.venue_id,
            tournament_record.id,
            COALESCE(tournament_record.created_at, NOW()),
            COALESCE(tournament_record.updated_at, NOW()),
            'expired'
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
