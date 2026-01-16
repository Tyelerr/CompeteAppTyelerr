-- ============================================================================
-- DROP OLD fn_enter_giveaway (OID 185924)
-- ============================================================================
-- This is the old version with signature: (p_giveaway_id uuid, p_source text, p_ip inet)
-- ============================================================================

-- Drop the old version by its exact signature
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(p_giveaway_id uuid, p_source text, p_ip inet);

-- Alternative: Drop by OID
DROP FUNCTION IF EXISTS pg_catalog.fn_enter_giveaway(185924);

-- Verification
SELECT 
    COUNT(*) as remaining_versions,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All versions dropped! Ready to create new function.'
        ELSE '⚠️  WARNING: ' || COUNT(*) || ' version(s) still remain'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_enter_giveaway'
AND n.nspname = 'public';

-- ============================================================================
-- After this shows 0 remaining, run:
-- CompeteApp/sql/fix_fn_enter_giveaway_single_entry.sql
-- ============================================================================
