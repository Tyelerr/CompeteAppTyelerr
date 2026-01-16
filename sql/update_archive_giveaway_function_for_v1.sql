-- ============================================================================
-- UPDATE ARCHIVE_GIVEAWAY_MANUAL FUNCTION FOR V1
-- ============================================================================
-- This updates the archival function to explicitly list columns instead of
-- using SELECT *, which prevents column mismatch errors
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_giveaway_manual(
    giveaway_id UUID,
    admin_user_id TEXT DEFAULT NULL,
    reason TEXT DEFAULT 'admin_deletion'
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    success BOOLEAN := FALSE;
    entries_count INTEGER := 0;
BEGIN
    -- Check if giveaway exists
    IF EXISTS (SELECT 1 FROM giveaways WHERE id = giveaway_id) THEN
        
        -- Step 1: Archive all entries associated with this giveaway
        INSERT INTO giveaway_entries_archive 
        SELECT 
            *,
            NOW() as removal_date,
            reason as removal_reason,
            giveaway_id as archived_giveaway_id
        FROM giveaway_entries 
        WHERE giveaway_entries.giveaway_id = archive_giveaway_manual.giveaway_id;
        
        GET DIAGNOSTICS entries_count = ROW_COUNT;
        
        RAISE NOTICE 'Archived % entries for giveaway %', entries_count, giveaway_id;
        
        -- Step 2: Delete entries from active table
        DELETE FROM giveaway_entries WHERE giveaway_entries.giveaway_id = archive_giveaway_manual.giveaway_id;
        
        -- Step 3: Archive the giveaway with explicit column listing
        INSERT INTO giveaways_archive (
            id,
            numeric_id,
            title,
            prize_value,
            status,
            end_at,
            description,
            image_url,
            winner_entry_id,
            created_at,
            updated_at,
            maximum_entries,
            -- V1 columns
            max_entries,
            entry_count_cached,
            min_age,
            claim_period_days,
            winner_lock_until,
            prize_name,
            prize_arv,
            prize_image_url,
            eligibility_text,
            -- Archive metadata
            removal_date,
            removal_reason,
            removed_by_admin_id
        )
        SELECT 
            id,
            numeric_id,
            title,
            prize_value,
            status,
            end_at,
            description,
            image_url,
            winner_entry_id,
            created_at,
            updated_at,
            maximum_entries,
            -- V1 columns
            max_entries,
            entry_count_cached,
            min_age,
            claim_period_days,
            winner_lock_until,
            prize_name,
            prize_arv,
            prize_image_url,
            eligibility_text,
            -- Archive metadata
            NOW() as removal_date,
            reason as removal_reason,
            admin_user_id as removed_by_admin_id
        FROM giveaways 
        WHERE id = giveaway_id;

        -- Step 4: Delete from active giveaways table
        DELETE FROM giveaways WHERE id = giveaway_id;
        
        success := TRUE;
        
        RAISE NOTICE 'Successfully archived giveaway % with % entries by admin %', 
            giveaway_id, entries_count, admin_user_id;
    ELSE
        RAISE NOTICE 'Giveaway % not found', giveaway_id;
    END IF;

    RETURN success;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_giveaway_manual IS 
'Manually archives a giveaway and all its entries. Updated for v1 schema with explicit column listing.';

-- Verify function was updated
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'archive_giveaway_manual'
    ) THEN
        RAISE NOTICE '✅ archive_giveaway_manual function updated successfully';
    ELSE
        RAISE WARNING '⚠️ Function not found';
    END IF;
END $$;
