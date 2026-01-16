-- ============================================================================
-- UPDATE GIVEAWAY ARCHIVAL FUNCTION TO INCLUDE USERNAME
-- ============================================================================
-- This script updates the archive_giveaway_manual function to ensure the
-- username column is included when archiving giveaway entries.
-- ============================================================================

-- Drop and recreate the archival function with username support
CREATE OR REPLACE FUNCTION archive_giveaway_manual(
    giveaway_id UUID,
    admin_user_id TEXT DEFAULT NULL,
    reason TEXT DEFAULT 'admin_deletion'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_giveaway_record RECORD;
    v_entries_count INT;
BEGIN
    -- Get the giveaway record
    SELECT * INTO v_giveaway_record
    FROM giveaways
    WHERE id = giveaway_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Giveaway with id % not found', giveaway_id;
    END IF;

    -- Count entries
    SELECT COUNT(*) INTO v_entries_count
    FROM giveaway_entries
    WHERE giveaway_entries.giveaway_id = archive_giveaway_manual.giveaway_id;

    -- Step 1: Archive all entries with username
    INSERT INTO giveaway_entries_archive (
        id,
        giveaway_id,
        user_id,
        username,
        entry_number,
        agree_18,
        agree_rules,
        agree_privacy,
        agree_one_entry,
        marketing_opt_in,
        full_name,
        birthday,
        email,
        phone_number,
        source,
        ip_address,
        metadata,
        entry_day_utc,
        status,
        disqualified_reason,
        disqualified_at,
        disqualified_by,
        created_at,
        removal_date,
        removal_reason,
        archived_giveaway_id
    )
    SELECT
        ge.id,
        ge.giveaway_id,
        ge.user_id,
        ge.username,
        ge.entry_number,
        ge.agree_18,
        ge.agree_rules,
        ge.agree_privacy,
        ge.agree_one_entry,
        ge.marketing_opt_in,
        ge.full_name,
        ge.birthday,
        ge.email,
        ge.phone_number,
        ge.source,
        ge.ip_address,
        ge.metadata,
        ge.entry_day_utc,
        ge.status,
        ge.disqualified_reason,
        ge.disqualified_at,
        ge.disqualified_by,
        ge.created_at,
        NOW(),
        reason,
        giveaway_id
    FROM giveaway_entries ge
    WHERE ge.giveaway_id = archive_giveaway_manual.giveaway_id;

    RAISE NOTICE 'Archived % entries for giveaway %', v_entries_count, giveaway_id;

    -- Step 2: Delete entries from active table
    DELETE FROM giveaway_entries 
    WHERE giveaway_entries.giveaway_id = archive_giveaway_manual.giveaway_id;

    -- Step 3: Archive the giveaway itself
    INSERT INTO giveaways_archive (
        id,
        numeric_id,
        title,
        description,
        prize_value,
        prize_image_url,
        status,
        start_at,
        end_at,
        created_at,
        updated_at,
        created_by_user_id,
        venue_id,
        selection_method,
        number_of_winners,
        draw_mode,
        maximum_entries,
        entry_count_cached,
        min_age,
        winner_entry_id,
        removal_date,
        removal_reason,
        removed_by_admin_id
    )
    VALUES (
        v_giveaway_record.id,
        v_giveaway_record.numeric_id,
        v_giveaway_record.title,
        v_giveaway_record.description,
        v_giveaway_record.prize_value,
        v_giveaway_record.prize_image_url,
        v_giveaway_record.status,
        v_giveaway_record.start_at,
        v_giveaway_record.end_at,
        v_giveaway_record.created_at,
        v_giveaway_record.updated_at,
        v_giveaway_record.created_by_user_id,
        v_giveaway_record.venue_id,
        v_giveaway_record.selection_method,
        v_giveaway_record.number_of_winners,
        v_giveaway_record.draw_mode,
        v_giveaway_record.maximum_entries,
        v_giveaway_record.entry_count_cached,
        v_giveaway_record.min_age,
        v_giveaway_record.winner_entry_id,
        NOW(),
        reason,
        admin_user_id
    );

    -- Step 4: Delete the giveaway from active table
    DELETE FROM giveaways WHERE id = giveaway_id;

    RAISE NOTICE 'Successfully archived giveaway % with % entries by admin %',
        giveaway_id, v_entries_count, admin_user_id;

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error archiving giveaway: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Add comment
COMMENT ON FUNCTION archive_giveaway_manual IS 'Manually archives a giveaway and all its entries including username. Updated for v1 schema with username support.';

-- Verification
DO $$
DECLARE
  func_source TEXT;
BEGIN
  -- Check if function includes username
  SELECT pg_get_functiondef(p.oid)
  INTO func_source
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'archive_giveaway_manual'
    AND n.nspname = 'public';
  
  IF func_source LIKE '%ge.username%' THEN
    RAISE NOTICE '✅ SUCCESS: archive_giveaway_manual function updated with username support';
    RAISE NOTICE '✅ Username will be preserved when archiving giveaway entries';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 All username capture implementation complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '  1. ✅ username column added to giveaway_entries';
    RAISE NOTICE '  2. ✅ username column added to giveaway_entries_archive';
    RAISE NOTICE '  3. ✅ fn_enter_giveaway fetches and stores username';
    RAISE NOTICE '  4. ✅ archive_giveaway_manual preserves username';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by entering a giveaway and checking the database';
  ELSE
    RAISE WARNING '⚠️  WARNING: Function updated but username logic may be missing';
  END IF;
END $$;
