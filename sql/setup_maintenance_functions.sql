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
    -- Archive tournaments that are past their date (day after tournament date)
    FOR tournament_record IN 
        SELECT t.*, p.user_name, p.email, p.name as profile_name
        FROM tournaments t
        LEFT JOIN profiles p ON t.profiles = p.id
        WHERE t.start_date < CURRENT_DATE 
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

        -- Clean up tournament likes before deleting the tournament
        DELETE FROM likes WHERE tournament_id = tournament_record.id;
        
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

-- Function to generate new recurring tournament instances
CREATE OR REPLACE FUNCTION generate_recurring_tournaments()
RETURNS TABLE (count INTEGER) AS $$
DECLARE
    series_record RECORD;
    master_tournament RECORD;
    new_tournament_count INTEGER := 0;
    future_count INTEGER;
    weeks_to_add INTEGER;
    new_date DATE;
    new_time TEXT;
    next_id INTEGER;
BEGIN
    -- Find all recurring series that need more future tournaments
    FOR series_record IN 
        SELECT 
            recurring_series_id,
            COUNT(*) as current_count
        FROM tournaments 
        WHERE recurring_series_id IS NOT NULL 
        AND start_date >= CURRENT_DATE
        AND status = 'active'
        GROUP BY recurring_series_id
        HAVING COUNT(*) < 4
    LOOP
        -- Get the master tournament for this series
        SELECT * INTO master_tournament
        FROM tournaments 
        WHERE recurring_series_id = series_record.recurring_series_id
        AND is_recurring_master = true
        LIMIT 1;

        -- If no master found, try to get any tournament from the series
        IF master_tournament IS NULL THEN
            SELECT * INTO master_tournament
            FROM tournaments 
            WHERE recurring_series_id = series_record.recurring_series_id
            LIMIT 1;
        END IF;

        -- If we found a template tournament, generate new instances
        IF master_tournament IS NOT NULL THEN
            -- Calculate how many tournaments we need to add
            weeks_to_add := 4 - series_record.current_count;
            
            -- Find the latest tournament date in this series
            SELECT MAX(start_date) INTO new_date
            FROM tournaments 
            WHERE recurring_series_id = series_record.recurring_series_id;

            -- Generate new tournaments
            FOR i IN 1..weeks_to_add LOOP
                -- Add one week to the latest date
                new_date := new_date + INTERVAL '7 days';
                
                -- Get next tournament ID
                SELECT COALESCE(MAX(id_unique_number), 0) + 1 INTO next_id
                FROM tournaments;

                -- Create new tournament
                INSERT INTO tournaments (
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
                    required_fargo_games,
                    has_required_fargo_games,
                    green_fee,
                    has_green_fee,
                    recurring_series_id,
                    is_recurring_master,
                    point_location,
                    venue_id,
                    profiles,
                    parent_recurring_tournament_id
                ) VALUES (
                    next_id,
                    gen_random_uuid(),
                    master_tournament.tournament_name,
                    master_tournament.game_type,
                    master_tournament.format,
                    master_tournament.director_name,
                    master_tournament.description,
                    master_tournament.equipment,
                    master_tournament.custom_equipment,
                    master_tournament.game_spot,
                    master_tournament.venue,
                    master_tournament.venue_lat,
                    master_tournament.venue_lng,
                    master_tournament.address,
                    master_tournament.phone,
                    master_tournament.city,
                    master_tournament.state,
                    master_tournament.zip_code,
                    master_tournament.thumbnail_type,
                    master_tournament.thumbnail_url,
                    new_date,
                    master_tournament.strart_time,
                    master_tournament.is_recurring,
                    master_tournament.reports_to_fargo,
                    master_tournament.is_open_tournament,
                    master_tournament.race_details,
                    master_tournament.number_of_tables,
                    master_tournament.table_size,
                    master_tournament.max_fargo,
                    master_tournament.tournament_fee,
                    master_tournament.side_pots,
                    'active',
                    master_tournament.required_fargo_games,
                    master_tournament.has_required_fargo_games,
                    master_tournament.green_fee,
                    master_tournament.has_green_fee,
                    series_record.recurring_series_id,
                    false,
                    master_tournament.point_location,
                    master_tournament.venue_id,
                    master_tournament.profiles,
                    master_tournament.parent_recurring_tournament_id
                );

                new_tournament_count := new_tournament_count + 1;
            END LOOP;
        END IF;
    END LOOP;

    RETURN QUERY SELECT new_tournament_count;
END;
$$ LANGUAGE plpgsql;

-- Function to manually archive a tournament (for deletions)
CREATE OR REPLACE FUNCTION archive_tournament_manual(
    tournament_id UUID,
    user_id TEXT DEFAULT NULL,
    reason TEXT DEFAULT 'deleted'
)
RETURNS BOOLEAN AS $$
DECLARE
    tournament_record RECORD;
    venue_data JSONB;
    success BOOLEAN := FALSE;
BEGIN
    -- Get tournament data with profile info
    SELECT t.*, p.user_name, p.email, p.name as profile_name
    INTO tournament_record
    FROM tournaments t
    LEFT JOIN profiles p ON t.profiles = p.id
    WHERE t.id = tournament_id;

    IF tournament_record IS NOT NULL THEN
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
            archived_by_user_id,
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
            reason,
            user_id,
            tournament_record.profiles,
            tournament_record.user_name,
            tournament_record.email,
            tournament_record.profile_name,
            venue_data
        );

        -- Delete from active tournaments table
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        success := TRUE;
    END IF;

    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Function to get tournament archival statistics
CREATE OR REPLACE FUNCTION get_tournament_archival_stats()
RETURNS TABLE (
    total_archived INTEGER,
    expired_count INTEGER,
    deleted_count INTEGER,
    manual_count INTEGER,
    oldest_archived_date DATE,
    newest_archived_date DATE,
    active_tournaments INTEGER,
    recurring_series_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM tournaments_history),
        (SELECT COUNT(*)::INTEGER FROM tournaments_history WHERE archived_reason = 'expired'),
        (SELECT COUNT(*)::INTEGER FROM tournaments_history WHERE archived_reason = 'deleted'),
        (SELECT COUNT(*)::INTEGER FROM tournaments_history WHERE archived_reason = 'manual'),
        (SELECT MIN(start_date) FROM tournaments_history),
        (SELECT MAX(start_date) FROM tournaments_history),
        (SELECT COUNT(*)::INTEGER FROM tournaments WHERE status = 'active'),
        (SELECT COUNT(DISTINCT recurring_series_id)::INTEGER FROM tournaments WHERE recurring_series_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql;
