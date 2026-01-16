-- ============================================================================
-- GIVEAWAY ARCHIVAL SYSTEM - Database Functions
-- ============================================================================
-- This script creates the database functions for archiving giveaways and entries
-- Uses SECURITY DEFINER to bypass RLS policies for proper deletion
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: archive_giveaway_manual
-- ============================================================================
-- Manually archives a giveaway (for admin deletions)
-- Archives both the giveaway and all its entries
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
        
        -- Step 3: Archive the giveaway
        INSERT INTO giveaways_archive 
        SELECT 
            *,
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
'Manually archives a giveaway and all its entries. Used for admin deletions. Uses SECURITY DEFINER to bypass RLS policies.';

-- ============================================================================
-- FUNCTION 2: archive_expired_giveaways
-- ============================================================================
-- Automatically archives giveaways that have ended
-- Archives both giveaways and their entries
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_expired_giveaways()
RETURNS TABLE (
    archived_giveaways_count INTEGER,
    archived_entries_count INTEGER,
    error_message TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    giveaway_count INTEGER := 0;
    total_entries_count INTEGER := 0;
    giveaway_record RECORD;
    entries_for_giveaway INTEGER := 0;
BEGIN
    -- Archive giveaways that have ended (status = 'ended' OR past their end_at date)
    FOR giveaway_record IN 
        SELECT *
        FROM giveaways
        WHERE (status = 'ended' OR (end_at IS NOT NULL AND end_at < NOW()))
        AND status != 'archived' -- Don't re-archive
    LOOP
        -- Archive entries for this giveaway
        INSERT INTO giveaway_entries_archive 
        SELECT 
            *,
            NOW() as removal_date,
            'giveaway_expired' as removal_reason,
            giveaway_record.id as archived_giveaway_id
        FROM giveaway_entries 
        WHERE giveaway_id = giveaway_record.id;
        
        GET DIAGNOSTICS entries_for_giveaway = ROW_COUNT;
        total_entries_count := total_entries_count + entries_for_giveaway;
        
        -- Delete entries from active table
        DELETE FROM giveaway_entries WHERE giveaway_id = giveaway_record.id;
        
        -- Archive the giveaway
        INSERT INTO giveaways_archive 
        SELECT 
            *,
            NOW() as removal_date,
            'expired' as removal_reason,
            NULL as removed_by_admin_id
        FROM giveaways 
        WHERE id = giveaway_record.id;

        -- Delete from active giveaways table
        DELETE FROM giveaways WHERE id = giveaway_record.id;
        
        giveaway_count := giveaway_count + 1;
        
        RAISE NOTICE 'Archived giveaway % (%) with % entries', 
            giveaway_record.numeric_id, 
            giveaway_record.title, 
            entries_for_giveaway;
            
    END LOOP;

    RETURN QUERY SELECT 
        giveaway_count,
        total_entries_count,
        NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0,
        0,
        SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_expired_giveaways IS 
'Automatically archives expired giveaways and their entries. Uses SECURITY DEFINER to bypass RLS policies.';

-- ============================================================================
-- FUNCTION 3: get_giveaway_archival_stats
-- ============================================================================
-- Returns statistics about giveaway archival
-- ============================================================================

CREATE OR REPLACE FUNCTION get_giveaway_archival_stats()
RETURNS TABLE (
    total_archived_giveaways INTEGER,
    total_archived_entries INTEGER,
    expired_giveaways INTEGER,
    admin_deleted_giveaways INTEGER,
    manual_archived_giveaways INTEGER,
    oldest_archived_date TIMESTAMPTZ,
    newest_archived_date TIMESTAMPTZ,
    total_archived_prize_value NUMERIC
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM giveaways_archive),
        (SELECT COUNT(*)::INTEGER FROM giveaway_entries_archive),
        (SELECT COUNT(*)::INTEGER FROM giveaways_archive WHERE removal_reason = 'expired'),
        (SELECT COUNT(*)::INTEGER FROM giveaways_archive WHERE removal_reason = 'admin_deletion'),
        (SELECT COUNT(*)::INTEGER FROM giveaways_archive WHERE removal_reason = 'manual'),
        (SELECT MIN(removal_date) FROM giveaways_archive),
        (SELECT MAX(removal_date) FROM giveaways_archive),
        (SELECT COALESCE(SUM(prize_value), 0) FROM giveaways_archive);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_giveaway_archival_stats IS 
'Returns comprehensive statistics about archived giveaways and entries';

-- ============================================================================
-- FUNCTION 4: get_archived_giveaway_with_entries
-- ============================================================================
-- Retrieves an archived giveaway with all its entries
-- ============================================================================

CREATE OR REPLACE FUNCTION get_archived_giveaway_with_entries(giveaway_id UUID)
RETURNS TABLE (
    giveaway_data JSON,
    entries_data JSON
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT row_to_json(g.*) FROM giveaways_archive g WHERE g.id = giveaway_id) as giveaway_data,
        (SELECT json_agg(e.*) FROM giveaway_entries_archive e WHERE e.giveaway_id = get_archived_giveaway_with_entries.giveaway_id) as entries_data;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_archived_giveaway_with_entries IS 
'Retrieves a complete archived giveaway with all its entries as JSON';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if functions were created successfully
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'archive_giveaway_manual',
        'archive_expired_giveaways',
        'get_giveaway_archival_stats',
        'get_archived_giveaway_with_entries'
    );
    
    IF func_count = 4 THEN
        RAISE NOTICE '✅ All 4 giveaway archival functions created successfully';
    ELSE
        RAISE NOTICE '⚠️  Only % of 4 functions were created', func_count;
    END IF;
END $$;

-- List all created functions
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'archive_giveaway_manual',
    'archive_expired_giveaways',
    'get_giveaway_archival_stats',
    'get_archived_giveaway_with_entries'
)
ORDER BY routine_name;
