-- ============================================================================
-- DROP EXACT VERSIONS OF fn_enter_giveaway
-- ============================================================================
-- Based on the diagnostic query results, drop each version individually
-- Run these commands ONE AT A TIME in order
-- ============================================================================

-- Version 1: Old version with just giveaway_id, source, and ip
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(p_giveaway_id uuid, p_source text, p_ip inet);

-- Version 2: Version with 5 boolean parameters (no full_name/birthday)
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(p_giveaway_id uuid, p_agree_18 boolean, p_agree_rules boolean, p_agree_privacy boolean, p_agree_one_entry boolean, p_marketing_opt_in boolean);

-- Version 3: Version with 5 boolean parameters (duplicate or slightly different)
-- This might be the same as version 2, but we'll try to drop it anyway
DROP FUNCTION IF EXISTS public.fn_enter_giveaway(uuid, boolean, boolean, boolean, boolean, boolean);

-- ============================================================================
-- Verification: Check if all versions are gone
-- ============================================================================
SELECT COUNT(*) as remaining_versions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_enter_giveaway'
AND n.nspname = 'public';

-- Should return 0 if successful

-- ============================================================================
-- If the above doesn't work, try this alternative approach:
-- ============================================================================
-- Drop by OID (Object ID) - use the OIDs from your diagnostic query
-- Replace XXXXX with the actual OID numbers from your query results

-- DROP FUNCTION IF EXISTS public.fn_enter_giveaway(oid::regprocedure) WHERE oid = 185924;
-- DROP FUNCTION IF EXISTS public.fn_enter_giveaway(oid::regprocedure) WHERE oid = 118405;
-- DROP FUNCTION IF EXISTS public.fn_enter_giveaway(oid::regprocedure) WHERE oid = 118466;

-- ============================================================================
-- After successfully dropping all versions, run the fix script:
-- CompeteApp/sql/fix_fn_enter_giveaway_single_entry.sql
-- ============================================================================
