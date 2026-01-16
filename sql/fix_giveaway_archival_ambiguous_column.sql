-- ============================================================================
-- FIX: Ambiguous column reference in archive_giveaway_manual
-- ============================================================================
-- This fixes the "column reference 'giveaway_id' is ambiguous" error
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
            ge.*,
            NOW() as removal_date,
            reason as removal_reason,
            ge.giveaway_id as archived_giveaway_id
        FROM giveaway_entries ge
        WHERE ge.giveaway_id = archive_giveaway_manual.giveaway_id;
        
        GET DIAGNOSTICS entries_count = ROW_COUNT;
        
        RAISE NOTICE 'Archived % entries for giveaway %', entries_count, giveaway_id;
        
        -- Step 2: Delete entries from active table
        DELETE FROM giveaway_entries WHERE giveaway_entries.giveaway_id = archive_giveaway_manual.giveaway_id;
        
        -- Step 3: Archive the giveaway
        INSERT INTO giveaways_archive 
        SELECT 
            g.*,
            NOW() as removal_date,
            reason as removal_reason,
            admin_user_id as removed_by_admin_id
        FROM giveaways g
        WHERE g.id = giveaway_id;

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
'Manually archives a giveaway and all its entries. Used for admin deletions. Uses SECURITY DEFINER to bypass RLS policies.';

-- Verify the function was updated
SELECT 
    'archive_giveaway_manual function updated successfully' as status,
    NOW() as updated_at;
