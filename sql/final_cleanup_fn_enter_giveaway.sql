-- ============================================================================
-- FINAL CLEANUP - Drop Remaining fn_enter_giveaway Version
-- ============================================================================
-- Run this to identify and drop the last remaining version
-- ============================================================================

-- Step 1: Identify the remaining version
SELECT 
    p.oid,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_catalog.pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_enter_giveaway'
AND n.nspname = 'public';

-- Step 2: Drop the remaining version using a dynamic approach
DO $$
DECLARE
    func_record RECORD;
    drop_stmt TEXT;
BEGIN
    FOR func_record IN 
        SELECT 
            p.oid,
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'fn_enter_giveaway'
        AND n.nspname = 'public'
    LOOP
        -- Try to drop by OID first
        BEGIN
            EXECUTE 'DROP FUNCTION ' || func_record.oid::regprocedure;
            RAISE NOTICE '✅ Dropped function with OID %', func_record.oid;
        EXCEPTION
            WHEN OTHERS THEN
                -- If OID approach fails, try with full signature
                BEGIN
                    drop_stmt := format('DROP FUNCTION public.%I(%s)', 
                                      func_record.proname, 
                                      func_record.args);
                    EXECUTE drop_stmt;
                    RAISE NOTICE '✅ Dropped function: %', drop_stmt;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE WARNING '❌ Could not drop OID %: %', func_record.oid, SQLERRM;
                END;
        END;
    END LOOP;
END $$;

-- Step 3: Final verification
SELECT 
    COUNT(*) as remaining_versions,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All versions dropped!'
        ELSE '⚠️  WARNING: ' || COUNT(*) || ' version(s) still remain'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_enter_giveaway'
AND n.nspname = 'public';

-- ============================================================================
-- If this shows 0 remaining, proceed to:
-- CompeteApp/sql/fix_fn_enter_giveaway_single_entry.sql
-- ============================================================================
