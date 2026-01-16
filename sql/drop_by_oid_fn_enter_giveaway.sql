-- ============================================================================
-- DROP fn_enter_giveaway BY OID (Object ID)
-- ============================================================================
-- This approach drops functions by their unique OID to avoid ambiguity
-- Based on the diagnostic query showing OIDs: 185924, 118405, 118466
-- ============================================================================

-- Drop each function by converting OID to regprocedure
DO $$
DECLARE
    func_oid OID;
    drop_count INTEGER := 0;
BEGIN
    -- Drop function with OID 185924
    BEGIN
        EXECUTE 'DROP FUNCTION IF EXISTS ' || 185924::regprocedure;
        drop_count := drop_count + 1;
        RAISE NOTICE 'Dropped function with OID 185924';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop OID 185924: %', SQLERRM;
    END;
    
    -- Drop function with OID 118405
    BEGIN
        EXECUTE 'DROP FUNCTION IF EXISTS ' || 118405::regprocedure;
        drop_count := drop_count + 1;
        RAISE NOTICE 'Dropped function with OID 118405';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop OID 118405: %', SQLERRM;
    END;
    
    -- Drop function with OID 118466
    BEGIN
        EXECUTE 'DROP FUNCTION IF EXISTS ' || 118466::regprocedure;
        drop_count := drop_count + 1;
        RAISE NOTICE 'Dropped function with OID 118466';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop OID 118466: %', SQLERRM;
    END;
    
    RAISE NOTICE '✅ Attempted to drop % function(s)', drop_count;
END $$;

-- ============================================================================
-- Verification: Check if all versions are gone
-- ============================================================================
SELECT 
    COUNT(*) as remaining_versions,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All versions successfully dropped!'
        ELSE '⚠️  ' || COUNT(*) || ' version(s) still remain'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_enter_giveaway'
AND n.nspname = 'public';

-- ============================================================================
-- If verification shows 0 remaining, proceed to run:
-- CompeteApp/sql/fix_fn_enter_giveaway_single_entry.sql
-- ============================================================================
