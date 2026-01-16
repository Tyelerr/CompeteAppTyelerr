-- ============================================================================
-- FORCE DROP ALL VERSIONS OF fn_enter_giveaway
-- ============================================================================
-- This script aggressively removes ALL versions of fn_enter_giveaway function
-- Run this FIRST, then run fix_fn_enter_giveaway_single_entry.sql
-- ============================================================================

-- Method 1: Drop with CASCADE to remove dependencies
DROP FUNCTION IF EXISTS public.fn_enter_giveaway CASCADE;

-- Method 2: Drop specific signatures that might exist
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(UUID, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(UUID, BOOLEAN, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(UUID, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, VARCHAR, DATE) CASCADE;

-- Method 3: Use pg_proc to find and drop all versions dynamically
DO $$
DECLARE
    func_record RECORD;
    drop_statement TEXT;
BEGIN
    -- Find all functions named fn_enter_giveaway
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
        -- Build and execute DROP statement for each version
        drop_statement := format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                                func_record.proname, 
                                func_record.args);
        
        RAISE NOTICE 'Dropping: %', drop_statement;
        EXECUTE drop_statement;
    END LOOP;
    
    RAISE NOTICE '✅ All versions of fn_enter_giveaway have been dropped';
END $$;

-- Verify all versions are gone
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'fn_enter_giveaway'
    AND n.nspname = 'public';
    
    IF func_count = 0 THEN
        RAISE NOTICE '✅ VERIFIED: No versions of fn_enter_giveaway remain';
    ELSE
        RAISE WARNING '⚠️  WARNING: % version(s) of fn_enter_giveaway still exist!', func_count;
    END IF;
END $$;
