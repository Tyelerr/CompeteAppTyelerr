-- ============================================================================
-- DIAGNOSE USERNAME COLUMN ISSUE
-- ============================================================================
-- This script checks if the username column exists and if the function
-- has been updated to use it.
-- ============================================================================

-- Step 1: Check if username column exists in giveaway_entries
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'giveaway_entries' AND column_name = 'username'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    RAISE NOTICE '✅ username column EXISTS in giveaway_entries table';
  ELSE
    RAISE NOTICE '❌ username column DOES NOT EXIST in giveaway_entries table';
    RAISE NOTICE '   → Run: add_username_to_giveaway_entries.sql';
  END IF;
END $$;

-- Step 2: Check if fn_enter_giveaway function includes username
DO $$
DECLARE
  v_func_source TEXT;
  v_has_username BOOLEAN := FALSE;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO v_func_source
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'fn_enter_giveaway'
    AND n.nspname = 'public'
  LIMIT 1;
  
  IF v_func_source IS NOT NULL THEN
    v_has_username := v_func_source LIKE '%v_username%' AND v_func_source LIKE '%username,%';
    
    IF v_has_username THEN
      RAISE NOTICE '✅ fn_enter_giveaway function HAS BEEN UPDATED to use username';
    ELSE
      RAISE NOTICE '❌ fn_enter_giveaway function HAS NOT BEEN UPDATED yet';
      RAISE NOTICE '   → Run: update_fn_enter_giveaway_with_username.sql';
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  THIS IS WHY YOU ARE GETTING THE ERROR!';
      RAISE NOTICE '   The function is trying to insert into the username column';
      RAISE NOTICE '   but the OLD version of the function does not have the logic';
      RAISE NOTICE '   to fetch and provide the username value.';
    END IF;
  ELSE
    RAISE NOTICE '❌ fn_enter_giveaway function NOT FOUND';
  END IF;
END $$;

-- Step 3: Show current function signature
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as parameters,
  pg_get_functiondef(p.oid) LIKE '%username%' as mentions_username
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_enter_giveaway'
  AND n.nspname = 'public';

-- Step 4: Provide next steps
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'NEXT STEP TO FIX THE ERROR:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Run this SQL script in your Supabase SQL Editor:';
  RAISE NOTICE '  → CompeteApp/sql/update_fn_enter_giveaway_with_username.sql';
  RAISE NOTICE '';
  RAISE NOTICE 'This will update the fn_enter_giveaway function to:';
  RAISE NOTICE '  1. Fetch username from profiles table';
  RAISE NOTICE '  2. Store username in the giveaway_entries table';
  RAISE NOTICE '';
  RAISE NOTICE 'After running that script, try entering the giveaway again.';
  RAISE NOTICE '';
END $$;
