-- ============================================================================
-- FINAL COMPLETE FIX FOR GIVEAWAY DELETE/ARCHIVE ERROR
-- ============================================================================
-- This fixes BOTH giveaways_archive AND giveaway_entries_archive tables
-- Run this ENTIRE file in Supabase SQL Editor
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

-- STEP 2: Add v1 columns to giveaway_entries_archive table
-- ============================================================================

ALTER TABLE giveaway_entries_archive
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS disqualified_reason TEXT,
ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disqualified_by UUID;

-- STEP 3: Drop and recreate archive_giveaway_manual function
-- ============================================================================

DROP FUNCTION IF EXISTS archive_giveaway_manual(UUID, TEXT, TEXT);

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
    v_success BOOLEAN := FALSE;
    v_entries_count INTEGER := 0;
    v_giveaway_id ALIAS FOR giveaway_id;
BEGIN
    -- Check if giveaway exists
    IF EXISTS (SELECT 1 FROM giveaways WHERE id = v_giveaway_id) THEN
        
        -- Step 1: Archive all entries with explicit columns
        INSERT INTO giveaway_entries_archive (
            id, giveaway_id, user_id, name, email, phone, birthday, 
            agreed_to_terms, entry_number, created_at,
            status, disqualified_reason, disqualified_at, disqualified_by,
            removal_date, removal_reason, archived_giveaway_id
        )
        SELECT 
            ge.id, ge.giveaway_id, ge.user_id, ge.name, ge.email, ge.phone, ge.birthday,
            ge.agreed_to_terms, ge.entry_number, ge.created_at,
            ge.status, ge.disqualified_reason, ge.disqualified_at, ge.disqualified_by,
            NOW(), reason, v_giveaway_id
        FROM giveaway_entries ge
        WHERE ge.giveaway_id = v_giveaway_id;
        
        GET DIAGNOSTICS v_entries_count = ROW_COUNT;
        
        -- Step 2: Delete entries from active table
        DELETE FROM giveaway_entries WHERE giveaway_entries.giveaway_id = v_giveaway_id;
        
        -- Step 3: Archive the giveaway with explicit columns
        INSERT INTO giveaways_archive (
            id, numeric_id, title, prize_value, status, end_at, description, 
            image_url, winner_entry_id, created_at, updated_at, maximum_entries,
            max_entries, entry_count_cached, min_age, claim_period_days, 
            winner_lock_until, prize_name, prize_arv, prize_image_url, eligibility_text,
            removal_date, removal_reason, removed_by_admin_id
        )
        SELECT 
            g.id, g.numeric_id, g.title, g.prize_value, g.status, g.end_at, g.description,
            g.image_url, g.winner_entry_id, g.created_at, g.updated_at, g.maximum_entries,
            g.max_entries, g.entry_count_cached, g.min_age, g.claim_period_days,
            g.winner_lock_until, g.prize_name, g.prize_arv, g.prize_image_url, g.eligibility_text,
            NOW(), reason, admin_user_id
        FROM giveaways g
        WHERE g.id = v_giveaway_id;

        -- Step 4: Delete from active table
        DELETE FROM giveaways WHERE id = v_giveaway_id;
        
        v_success := TRUE;
        
        RAISE NOTICE 'Successfully archived giveaway % with % entries', v_giveaway_id, v_entries_count;
    ELSE
        RAISE NOTICE 'Giveaway % not found', v_giveaway_id;
    END IF;

    RETURN v_success;
END;
$$ LANGUAGE plpgsql;

-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ GIVEAWAY DELETE FIX COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fixed both archive tables:';
    RAISE NOTICE '  - giveaways_archive (added 9 v1 columns)';
    RAISE NOTICE '  - giveaway_entries_archive (added 4 v1 columns)';
    RAISE NOTICE 'Updated archive_giveaway_manual function';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now delete giveaways without errors!';
END $$;
