-- Generator that SHOWS all errors instead of hiding them

CREATE OR REPLACE FUNCTION generate_recurring_tournaments_horizon()
RETURNS TABLE (
    series_id TEXT,
    tournaments_created INTEGER,
    message TEXT
) AS $$
DECLARE
    master_rec RECORD;
    horizon_date DATE;
    next_date DATE;
    latest_active DATE;
    created_count INTEGER;
    total_count INTEGER := 0;
BEGIN
    horizon_date := CURRENT_DATE + INTERVAL '60 days';
    
    FOR master_rec IN
        SELECT * FROM tournaments
        WHERE is_recurring_master = true
        AND is_recurring = true
        AND recurring_template_status = 'active'
    LOOP
        created_count := 0;
        
        SELECT MAX(start_date) INTO latest_active
        FROM tournaments
        WHERE recurring_series_id = master_rec.recurring_series_id
        AND is_recurring_master = false
        AND status = 'active';
        
        IF latest_active IS NULL THEN
            latest_active := master_rec.start_date;
        END IF;
        
        next_date := latest_active + INTERVAL '7 days';
        
        WHILE next_date <= horizon_date LOOP
            IF next_date >= CURRENT_DATE THEN
                -- DON'T catch exceptions - let them bubble up so we can see them!
                INSERT INTO tournaments (
                    id, id_unique_number, uuid,
                    tournament_name, game_type, format, director_name, description,
                    equipment, custom_equipment, game_spot, venue, venue_lat, venue_lng,
                    address, phone, city, state, zip_code, thumbnail_type, thumbnail_url,
                    start_date, strart_time,
                    is_recurring, is_recurring_master, recurring_series_id,
                    parent_recurring_tournament_id, parent_recurring_tournament_uuid,
                    recurring_template_status, reports_to_fargo, is_open_tournament,
                    race_details, number_of_tables, table_size, max_fargo,
                    tournament_fee, side_pots, chip_allocations, status,
                    required_fargo_games, has_required_fargo_games,
                    green_fee, has_green_fee, point_location, venue_id, profiles
                )
                SELECT
                    gen_random_uuid(),
                    (SELECT COALESCE(MAX(id_unique_number), 0) + 1 FROM tournaments),
                    gen_random_uuid(),
                    master_rec.tournament_name, master_rec.game_type, master_rec.format,
                    master_rec.director_name, master_rec.description, master_rec.equipment,
                    master_rec.custom_equipment, master_rec.game_spot, master_rec.venue,
                    master_rec.venue_lat, master_rec.venue_lng, master_rec.address,
                    master_rec.phone, master_rec.city, master_rec.state, master_rec.zip_code,
                    master_rec.thumbnail_type, master_rec.thumbnail_url,
                    next_date,
                    master_rec.strart_time,
                    true, false, master_rec.recurring_series_id,
                    master_rec.id_unique_number, master_rec.id,
                    master_rec.recurring_template_status, master_rec.reports_to_fargo,
                    master_rec.is_open_tournament, master_rec.race_details,
                    master_rec.number_of_tables, master_rec.table_size, master_rec.max_fargo,
                    master_rec.tournament_fee, master_rec.side_pots, master_rec.chip_allocations,
                    'active',
                    master_rec.required_fargo_games, master_rec.has_required_fargo_games,
                    master_rec.green_fee, master_rec.has_green_fee,
                    master_rec.point_location, master_rec.venue_id, master_rec.profiles
                ON CONFLICT ON CONSTRAINT idx_unique_recurring_series_date
                DO UPDATE SET status = 'active';
                
                created_count := created_count + 1;
                total_count := total_count + 1;
            END IF;
            
            next_date := next_date + INTERVAL '7 days';
        END LOOP;
        
        IF created_count > 0 THEN
            RETURN QUERY SELECT
                master_rec.recurring_series_id::TEXT,
                created_count,
                format('%s tournaments created/reactivated for %s', created_count, master_rec.tournament_name)::TEXT;
        END IF;
    END LOOP;
    
    IF total_count = 0 THEN
        RETURN QUERY SELECT
            NULL::TEXT,
            0,
            'No new tournaments needed - all series up to date'::TEXT;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
