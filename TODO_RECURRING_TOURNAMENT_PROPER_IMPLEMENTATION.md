# TODO: Proper Recurring Tournament Implementation

## Current Problem

The existing `generate_recurring_tournaments()` function has flaws:

- Generates from latest tournament date (can create past tournaments)
- Tries to maintain exactly 4 instances (inflexible)
- No duplicate prevention (can create duplicates on multiple runs)

## Recommended Logic (Horizon-Based Generation)

### Concept

- **Master tournament** = Template (is_recurring_master = true)
- **Child tournaments** = Actual weekly instances players join (is_recurring_master = false)
- Both share the same `recurring_series_id`

### Schema Requirements

#### Current Columns (Already Exist):

- `id` (UUID) - Primary key
- `id_unique_number` (int8) - Numeric identifier
- `is_recurring` (boolean)
- `is_recurring_master` (boolean)
- `recurring_series_id` (text/uuid)
- `parent_recurring_tournament_id` (int8) - **NEEDS FIX**
- `start_date` (date)
- `status` (text)

#### Schema Fix Required:

**Problem**: `parent_recurring_tournament_id` is int8, but `id` is UUID (type mismatch)

**Solution Options**:

1. **Option A (Recommended)**: Change to UUID

   ```sql
   ALTER TABLE tournaments
   ADD COLUMN parent_recurring_tournament_uuid UUID;

   -- Migrate data if needed
   -- Then drop old column
   ALTER TABLE tournaments DROP COLUMN parent_recurring_tournament_id;
   ```

2. **Option B**: Use `id_unique_number` consistently
   - Keep `parent_recurring_tournament_id` as int8
   - Always reference `id_unique_number` instead of `id`

#### Add Unique Constraint (Must-Have):

```sql
-- Prevent duplicate tournaments for same series on same date
ALTER TABLE tournaments
ADD CONSTRAINT unique_recurring_series_date
UNIQUE (recurring_series_id, start_date)
WHERE is_recurring = true;
```

### New Generation Algorithm

```sql
CREATE OR REPLACE FUNCTION generate_recurring_tournaments_horizon()
RETURNS TABLE (
    series_id TEXT,
    tournaments_created INTEGER
) AS $$
DECLARE
    master_record RECORD;
    horizon_days INTEGER := 60; -- Generate 60 days ahead
    target_date DATE;
    cursor_date DATE;
    latest_child_date DATE;
    new_count INTEGER;
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
                DECLARE
                    next_id INTEGER;
                BEGIN
                    SELECT COALESCE(MAX(id_unique_number), 0) + 1
                    INTO next_id
                    FROM tournaments;

                    -- Insert child tournament (ON CONFLICT DO NOTHING prevents duplicates)
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
                        parent_recurring_tournament_id, -- or parent_recurring_tournament_uuid
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
                        master_record.id_unique_number, -- or master_record.id if using UUID
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
                    ON CONFLICT (recurring_series_id, start_date)
                    WHERE is_recurring = true
                    DO NOTHING;

                    -- Check if insert succeeded
                    IF FOUND THEN
                        new_count := new_count + 1;
                    END IF;
                END;
            END IF;
        END LOOP;

        -- Return results for this series
        RETURN QUERY SELECT
            master_record.recurring_series_id::TEXT,
            new_count;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Benefits of This Approach

1. **No Past Tournaments**: Only creates tournaments with `start_date >= CURRENT_DATE`
2. **Horizon-Based**: Always maintains tournaments 60 days ahead
3. **Duplicate-Safe**: Uses `ON CONFLICT DO NOTHING` with unique constraint
4. **Flexible**: Can run multiple times safely
5. **Predictable**: Always generates to a fixed horizon, not a fixed count

### Implementation Steps

1. **Fix Schema**:

   - Add unique constraint on (recurring_series_id, start_date)
   - Fix parent_recurring_tournament_id type mismatch

2. **Replace Function**:

   - Replace `generate_recurring_tournaments()` with `generate_recurring_tournaments_horizon()`

3. **Update Archival Function**:

   - Modify `archive_expired_tournaments()` to call the new function

4. **Test**:
   - Create a test recurring master tournament
   - Run the generation function
   - Verify it creates tournaments up to 60 days ahead
   - Run again - should not create duplicates

### Immediate Action for Current Issue

For the 2 persisting "metro chip tournament" entries:

1. Run `fix_recurring_tournament_issue.sql` to delete the entire series
2. This stops the regeneration cycle
3. Then implement the proper logic above

## Files to Create/Modify

1. `sql/add_unique_constraint_recurring_tournaments.sql` - Add unique constraint
2. `sql/fix_parent_tournament_id_type.sql` - Fix type mismatch
3. `sql/generate_recurring_tournaments_horizon.sql` - New generation function
4. `sql/update_archive_function_with_horizon.sql` - Update archival to use new function

This is a separate task from Build 141 and should be implemented carefully with proper testing.
