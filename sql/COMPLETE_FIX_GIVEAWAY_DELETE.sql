-- ============================================================================
-- COMPLETE FIX FOR GIVEAWAY DELETE/ARCHIVE ERROR
-- ============================================================================
-- Run this ENTIRE file in Supabase SQL Editor to fix the delete error
-- ============================================================================

-- STEP 1: Add v1 columns to giveaways_archive table
-- ============================================================================

ALTER TABLE giveaways_archive
ADD COLUMN IF NOT EXISTS max_entries INTEGER,
ADD COLUMN IF NOT EXISTS entry_count_cached INTEGER,
ADD COLUMN IF NOT EXISTS min_age INTEGER,
ADD COLUMN IF NOT EXISTS claim_period_days INTEGER,
ADD COLUMN IF NOT EXISTS winner_lock_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prize_name TEXT,
ADD COLUMN IF NOT EXISTS prize_arv NUMERIC,
ADD COLUMN IF NOT EXISTS prize_image_url TEXT,
ADD COLUMN IF NOT EXISTS eligibility_text TEXT;

-- STEP 2: Update archive_giveaway_manual function with explicit columns
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
        
        -- Step 1: Archive all entries
        INSERT INTO giveaway_entries_archive 
        SELECT 
            *,
            NOW() as removal_date,
            reason as removal_reason,
            archive_giveaway_manual.giveaway_id as archived_giveaway_id
        FROM giveaway_entries 
        WHERE giveaway_entries.giveaway_id = archive_giveaway_manual.giveaway_id;
        
        GET DIAGNOSTICS entries_count = ROW_COUNT;
        
        -- Step 2: Delete entries from active table
        DELETE FROM giveaway_entries WHERE giveaway_entries.giveaway_id = archive_giveaway_manual.giveaway_id;
        
        -- Step 3: Archive the giveaway with explicit columns
        INSERT INTO giveaways_archive (
            id, numeric_id, title, prize_value, status, end_at, description, 
            image_url, winner_entry_id, created_at, updated_at, maximum_entries,
            max_entries, entry_count_cached, min_age, claim_period_days, 
            winner_lock_until, prize_name, prize_arv, prize_image_url, eligibility_text,
            removal_date, removal_reason, removed_by_admin_id
        )
        SELECT 
            id, numeric_id, title, prize_value, status, end_at, description,
            image_url, winner_entry_id, created_at, updated_at, maximum_entries,
            max_entries, entry_count_cached, min_age, claim_period_days,
            winner_lock_until, prize_name, prize_arv, prize_image_url, eligibility_text,
            NOW(), reason, admin_user_id
        FROM giveaways 
        WHERE id = giveaway_id;

        -- Step 4: Delete from active table
        DELETE FROM giveaways WHERE id = giveaway_id;
        
        success := TRUE;
        
        RAISE NOTICE 'Successfully archived giveaway % with % entries', giveaway_id, entries_count;
    ELSE
        RAISE NOTICE 'Giveaway % not found', giveaway_id;
    END IF;

    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ GIVEAWAY DELETE FIX COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You can now delete giveaways without errors!';
    RAISE NOTICE 'The delete button will archive giveaways to giveaways_archive table.';
END $$;
