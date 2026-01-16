-- FIXED VERSION - Only copies essential fields that definitely exist
-- Avoids the strart_time and other problematic fields

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
        AND status = 'active'
    LOOP
        new_count := 0;
        target_date := CURRENT_DATE + (horizon_days || ' days')::INTERVAL;

        SELECT MAX(start_date) INTO latest_child_date
        FROM tournaments
        WHERE recurring_series_id = master_record.recurring_series_id
        AND is_recurring_master = false;

        cursor_date := COALESCE(
            GREATEST(latest_child_date, master_record.start_date),
            master_record.start_date
        );

        WHILE cursor_date < target_date LOOP
            cursor_date := cursor_date + INTERVAL '7 days';

            IF cursor_date >= CURRENT_DATE THEN
                SELECT COALESCE(MAX(id_unique_number), 0) + 1
                INTO next_id
                FROM tournaments;

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
                        venue,
                        address,
                        phone,
                        thumbnail_type,
                        thumbnail_url,
                        start_date,
                        is_recurring,
                        is_recurring_master,
                        recurring_series_id,
                        parent_recurring_tournament_id,
                        parent_recurring_tournament_uuid,
                        reports_to_fargo,
                        is_open_tournament,
                        status,
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
                        master_record.venue,
                        master_record.address,
                        master_record.phone,
                        master_record.thumbnail_type,
                        master_record.thumbnail_url,
                        cursor_date,
                        true,
                        false,
                        master_record.recurring_series_id,
                        master_record.id_unique_number,
                        master_record.id,
                        master_record.reports_to_fargo,
                        master_record.is_open_tournament,
                        'active',
                        master_record.venue_id,
                        master_record.profiles
                    )
                    ON CONFLICT (recurring_series_id, start_date) DO NOTHING;

                    IF EXISTS (
                        SELECT 1 FROM tournaments 
                        WHERE recurring_series_id = master_record.recurring_series_id 
                        AND start_date = cursor_date
                    ) THEN
                        new_count := new_count + 1;
                        total_created := total_created + 1;
                    END IF;

                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING 'Error creating tournament for series % on date %: %', 
                        master_record.recurring_series_id, cursor_date, SQLERRM;
                END;
            END IF;
        END LOOP;

        IF new_count > 0 THEN
            RETURN QUERY SELECT
                master_record.recurring_series_id::TEXT,
                new_count,
                format('Created %s tournaments for series %s', new_count, master_record.tournament_name)::TEXT;
        END IF;
    END LOOP;

    IF total_created = 0 THEN
        RETURN QUERY SELECT
            NULL::TEXT,
            0,
            'No new tournaments needed - all series are up to date'::TEXT;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_recurring_tournaments_horizon() IS 
'Generates recurring tournament instances up to 60 days ahead with only essential fields.';
