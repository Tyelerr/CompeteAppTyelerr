-- Horizon-Based Recurring Tournament Generation Function
-- Generates recurring tournament instances up to 60 days ahead
-- Prevents duplicates and past tournaments

CREATE OR REPLACE FUNCTION generate_recurring_tournaments_horizon()
RETURNS TABLE (
    series_id TEXT,
    tournaments_created INTEGER,
    message TEXT
) AS $$
DECLARE
    master_record RECORD;
    horizon_days INTEGER := 60; -- Generate 60 days ahead
    target_date DATE;
    cursor_date DATE;
    latest_child_date DATE;
    new_count INTEGER;
    next_id INTEGER;
    total_created INTEGER := 0;
BEGIN
    -- For each recurring master tournament
    FOR master_record IN
        SELECT * FROM tournaments
        WHERE is_recurring_master = true
        AND is_recurring = true
        AND status = 'active'
    LOOP
        new_count := 0;

        -- Calculate target date (60 days from now)
        target_date := CURRENT_DATE + (horizon_days || ' days')::INTERVAL;

        -- Find latest child already created in this series
        SELECT MAX(start_date) INTO latest_child_date
        FROM tournaments
        WHERE recurring_series_id = master_record.recurring_series_id
        AND is_recurring_master = false;

        -- Start from latest child date or master date, whichever is later
        cursor_date := COALESCE(
            GREATEST(latest_child_date, master_record.start_date),
            master_record.start_date
        );

        -- Generate weekly instances until target date
        WHILE cursor_date < target_date LOOP
            cursor_date := cursor_date + INTERVAL '7 days';

            -- Only create if date is in the future
            IF cursor_date >= CURRENT_DATE THEN
                -- Get next id_unique_number
                SELECT COALESCE(MAX(id_unique_number), 0) + 1
                INTO next_id
                FROM tournaments;

                -- Insert child tournament (ON CONFLICT DO NOTHING prevents duplicates)
                BEGIN
                    INSERT INTO tournaments (
                        id,
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
                        is_recurring_master,
                        recurring_series_id,
                        parent_recurring_tournament_id,
                        parent_recurring_tournament_uuid,
                        reports_to_fargo,
                        is_open_tournament,
                        race_details,
                        number_of_tables,
                        table_size,
                        max_fargo,
                        tournament_fee,
                        side_pots,
                        chip_allocations,
                        status,
                        required_fargo_games,
                        has_required_fargo_games,
                        green_fee,
                        has_green_fee,
                        point_location,
                        venue_id,
                        profiles
                    ) VALUES (
                        gen_random_uuid(),
                        next_id,
                        gen_random_uuid(),
                        master_record.tournament_name,
                        master_record.game_type,
                        master_record.format,
                        master_record.director_name,
                        master_record.description,
                        master_record.equipment,
                        master_record.custom_equipment,
                        master_record.game_spot,
                        master_record.venue,
                        master_record.venue_lat,
                        master_record.venue_lng,
                        master_record.address,
                        master_record.phone,
                        master_record.city,
                        master_record.state,
                        master_record.zip_code,
                        master_record.thumbnail_type,
                        master_record.thumbnail_url,
                        cursor_date, -- NEW DATE
                        master_record.strart_time, -- SAME TIME
                        true, -- is_recurring
                        false, -- is_recurring_master (this is a child)
                        master_record.recurring_series_id,
                        master_record.id_unique_number, -- int8 reference (legacy)
                        master_record.id, -- UUID reference (new)
                        master_record.reports_to_fargo,
                        master_record.is_open_tournament,
                        master_record.race_details,
                        master_record.number_of_tables,
                        master_record.table_size,
                        master_record.max_fargo,
                        master_record.tournament_fee,
                        master_record.side_pots,
                        master_record.chip_allocations,
                        'active', -- status
                        master_record.required_fargo_games,
                        master_record.has_required_fargo_games,
                        master_record.green_fee,
                        master_record.has_green_fee,
                        master_record.point_location,
                        master_record.venue_id,
                        master_record.profiles
                    )
                    ON CONFLICT (recurring_series_id, start_date) DO NOTHING;

                    -- Check if insert succeeded (GET DIAGNOSTICS doesn't work with ON CONFLICT)
                    -- So we check if a tournament with this series_id and date exists
                    IF EXISTS (
                        SELECT 1 FROM tournaments 
                        WHERE recurring_series_id = master_record.recurring_series_id 
                        AND start_date = cursor_date
                    ) THEN
                        new_count := new_count + 1;
                        total_created := total_created + 1;
                    END IF;

                EXCEPTION WHEN OTHERS THEN
                    -- Log error but continue with next date
                    RAISE WARNING 'Error creating tournament for series % on date %: %', 
                        master_record.recurring_series_id, cursor_date, SQLERRM;
                END;
            END IF;
        END LOOP;

        -- Return results for this series
        IF new_count > 0 THEN
            RETURN QUERY SELECT
                master_record.recurring_series_id::TEXT,
                new_count,
                format('Created %s tournaments for series %s', new_count, master_record.tournament_name)::TEXT;
        END IF;
    END LOOP;

    -- Return summary if no tournaments were created
    IF total_created = 0 THEN
        RETURN QUERY SELECT
            NULL::TEXT,
            0,
            'No new tournaments needed - all series are up to date'::TEXT;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION generate_recurring_tournaments_horizon() IS 
'Generates recurring tournament instances using horizon-based approach (60 days ahead). 
Only creates future tournaments, prevents duplicates via unique constraint, and can be run multiple times safely.';

-- Example usage:
-- SELECT * FROM generate_recurring_tournaments_horizon();
