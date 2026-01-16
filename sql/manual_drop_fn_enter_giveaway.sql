-- ============================================================================
-- MANUAL DROP - Run this query FIRST to see all versions
-- ============================================================================
-- Step 1: Run this to see what versions exist
SELECT 
    p.oid,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    format('DROP FUNCTION IF EXISTS public.%I(%s);', 
           p.proname, 
           pg_get_function_identity_arguments(p.oid)) as drop_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_enter_giveaway'
AND n.nspname = 'public';

-- ============================================================================
-- Step 2: Copy the DROP commands from the results above and run them
-- ============================================================================
-- The query above will show you the exact DROP commands to run
-- Copy each "drop_command" from the results and execute them one by one

-- ============================================================================
-- Step 3: After running all DROP commands, verify they're gone
-- ============================================================================
SELECT COUNT(*) as remaining_versions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_enter_giveaway'
AND n.nspname = 'public';

-- Should return 0 if all versions are dropped
