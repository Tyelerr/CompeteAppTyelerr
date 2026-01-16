-- Debug version of generator with detailed logging

CREATE OR REPLACE FUNCTION generate_recurring_tournaments_horizon()
RETURNS TABLE (
    series_id TEXT,
    tournaments_created INTEGER,
    message TEXT
) AS $$
DECLARE
    master_record RECORD;
    horizon_days INTEGER := 60;
    target_date DATE;
    cursor_date DATE;
    latest_child_date DATE;
    new_count INTEGER;
    next_id INTEGER;
    total_created INTEGER := 0;
BEGIN
    FOR master_record IN
        SELECT * FROM tournaments
        WHERE is_recurring_master = true
        AND is_recurring = true
        AND recurring_template_status = 'active'
    LOOP
        RAISE NOTICE '=== Processing series: % ===', master_record.tournament_name;
        
        new_count := 0;
        target_date := CURRENT_DATE + (horizon_days || ' days')::INTERVAL;
        
        RAISE NOTICE 'Target date (horizon): %', target_date;

        -- Find latest ACTIVE child only
        SELECT MAX(start_date) INTO latest_child_date
        FROM tournaments
        WHERE recurring_series_id = master_record.recurring_series_id
        AND is_recurring_master = false
        AND status = 'active';
        
        RAISE NOTICE 'Latest active child date: %', latest_child_date;
        RAISE NOTICE 'Master start date: %', master_record.start_date;

        cursor_date := COALESCE(
            GREATEST(latest_child_date, master_record.start_date),
            master_record.start_date
        );
        
        RAISE NOTICE 'Starting cursor_date: %', cursor_date;
        RAISE NOTICE 'Will loop while cursor_date (%) < target_date (%)', cursor_date, target_date;

        WHILE cursor_date < target_date LOOP
            cursor_date := cursor_date + INTERVAL '7 days';
            RAISE NOTICE '  Checking date: % (is >= CURRENT_DATE %? %)', 
                cursor_date, CURRENT_DATE, cursor_date >= CURRENT_DATE;

            IF cursor_date >= CURRENT_DATE THEN
                SELECT COALESCE(MAX(id_unique_number), 0) + 1 INTO next_id FROM tournaments;

                BEGIN
                    RAISE NOTICE '    Attempting to create/upsert tournament for %', cursor_date;
                    
                    INSERT INTO tournaments (
                        id, id_unique_number, uuid, tournament_name, game_type, format,
                        director_name, description, equipment, custom_equipment, game_spot,
                        venue, venue_lat, venue_lng, address, phone, city, state, zip_code,
                        thumbnail_type, thumbnail_url, start_date, strart_time,
                        is_recurring, is_recurring_master, recurring_series_id,
                        parent_recurring_tournament_id, parent_recurring_tournament_uuid,
                        recurring_template_status, reports_to_fargo, is_open_tournament,
                        race_details, number_of_tables, table_size, max_fargo,
                        tournament_fee, side_pots, chip_allocations, status,
                        required_fargo_games, has_required_fargo_games, green_fee,
                        has_green_fee, point_location, venue_id, profiles
                    ) VALUES (
                        gen_random_uuid(), next_id, gen_random_uuid(),
                        master_record.tournament_name, master_record.game_type, master_record.format,
                        master_record.director_name, master_record.description,
                        master_record.equipment, master_record.custom_equipment, master_record.game_spot,
                        master_record.venue, master_record.venue_lat, master_record.venue_lng,
                        master_record.address, master_record.phone, master_record.city,
                        master_record.state, master_record.zip_code, master_record.thumbnail_type,
                        master_record.thumbnail_url, cursor_date, master_record.strart_time,
                        true, false, master_record.recurring_series_id,
                        master_record.id_unique_number, master_record.id,
                        master_record.recurring_template_status, master_record.reports_to_fargo,
                        master_record.is_open_tournament, master_record.race_details,
                        master_record.number_of_tables, master_record.table_size,
                        master_record.max_fargo, master_record.tournament_fee,
                        master_record.side_pots, master_record.chip_allocations, 'active',
                        master_record.required_fargo_games, master_record.has_required_fargo_games,
                        master_record.green_fee, master_record.has_green_fee,
                        master_record.point_location, master_record.venue_id, master_record.profiles
                    )
                    ON CONFLICT ON CONSTRAINT idx_unique_recurring_series_date
                    DO UPDATE SET status = 'active';

                    new_count := new_count + 1;
                    total_created := total_created + 1;
                    RAISE NOTICE '    ✅ Created/reactivated tournament for %', cursor_date;

                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING '    ❌ Error for %: %', cursor_date, SQLERRM;
                END;
            ELSE
                RAISE NOTICE '    ⏭️  Skipped % (in the past)', cursor_date;
            END IF;
        END LOOP;

        RAISE NOTICE 'Finished series. Created: %', new_count;

        IF new_count > 0 THEN
            RETURN QUERY SELECT
                master_record.recurring_series_id::TEXT,
                new_count,
                format('Created/reactivated %s for %s', new_count, master_record.tournament_name)::TEXT;
        END IF;
    END LOOP;

    IF total_created = 0 THEN
        RETURN QUERY SELECT NULL::TEXT, 0, 'No new tournaments needed'::TEXT;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;
