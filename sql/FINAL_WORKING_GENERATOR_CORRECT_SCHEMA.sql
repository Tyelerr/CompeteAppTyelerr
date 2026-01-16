-- FINAL WORKING GENERATOR - Uses actual table schema
-- Copies all columns from master, overrides only what needs to change

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
    new_id UUID;
    new_id_num BIGINT;
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
                -- Generate new IDs
                new_id := gen_random_uuid();
                SELECT COALESCE(MAX(id_unique_number), 0) + 1 INTO new_id_num FROM tournaments;
                
                -- Insert by copying master and overriding specific fields
                INSERT INTO tournaments
                SELECT 
                    new_id,  -- new UUID
                    tournament_name,
                    game_type,
                    format,
                    director_name,
                    description,
                    equipment,
                    game_spot,
                    venue,
                    address,
                    phone,
                    thumbnail_url,
                    next_date,  -- NEW DATE
                    true,  -- is_recurring
                    reports_to_fargo,
                    is_open_tournament,
                    race_details,
                    number_of_tables,
                    max_fargo,
                    tournament_fee,
                    CURRENT_TIMESTAMP,  -- created_at
                    CURRENT_TIMESTAMP,  -- updated_at
                    new_id,  -- uuid (same as id)
                    side_pots,
                    thumbnail_type,
                    'active',  -- status (always active for new/reactivated)
                    NULL,  -- deleted_at
                    new_id_num,  -- id_unique_number
                    venue_lat,
                    venue_lng,
                    custom_equipment,
                    point_location,
                    table_size,
                    id_unique_number,  -- parent_recurring_tournament_id
                    required_fargo_games,
                    has_required_fargo_games,
                    venue_id,
                    recurring_series_id,  -- same series
                    false,  -- is_recurring_master (this is a child)
                    chip_allocations,
                    id,  -- parent_recurring_tournament_uuid
                    recurring_template_status  -- inherit template status
                FROM tournaments
                WHERE id = master_rec.id
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

COMMENT ON FUNCTION generate_recurring_tournaments_horizon() IS
'Generates recurring tournaments to maintain 60-day horizon.
Uses INSERT...SELECT to copy all columns from master, overriding only date and IDs.
Finds latest ACTIVE child, generates from there + 7 days until horizon.
Uses UPSERT to reactivate archived future tournaments.';
