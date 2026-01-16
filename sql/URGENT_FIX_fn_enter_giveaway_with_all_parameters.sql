-- ============================================================================
-- URGENT FIX: Update fn_enter_giveaway to include ALL required parameters
-- ============================================================================
-- This script fixes the "Could not find the function" error by ensuring
-- the database function matches what the app is calling.
--
-- The app is calling with these parameters:
-- - p_giveaway_id, p_agree_18, p_agree_one_entry, p_agree_privacy, 
-- - p_agree_rules, p_birthday, p_email, p_full_name, p_marketing_opt_in, 
-- - p_phone_number
--
-- Run this in your Supabase SQL Editor NOW to fix the giveaway entry issue.
-- ============================================================================

-- Step 1: Drop ALL existing versions of the function
DROP FUNCTION IF EXISTS public.fn_enter_giveaway CASCADE;

-- Step 2: Create the correct version with ALL 10 parameters
CREATE OR REPLACE FUNCTION public.fn_enter_giveaway(
  p_giveaway_id UUID,
  p_agree_18 BOOLEAN DEFAULT FALSE,
  p_agree_rules BOOLEAN DEFAULT FALSE,
  p_agree_privacy BOOLEAN DEFAULT FALSE,
  p_agree_one_entry BOOLEAN DEFAULT FALSE,
  p_marketing_opt_in BOOLEAN DEFAULT FALSE,
  p_full_name TEXT DEFAULT NULL,
  p_birthday TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_existing_entry_id UUID;
  v_entry_count INT;
  v_max_entries INT;
  v_next_entry_number INT;
  v_giveaway_status TEXT;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'You must be logged in to enter a giveaway'
    );
  END IF;

  -- Get giveaway status and max entries
  SELECT status, COALESCE(maximum_entries, 500)
  INTO v_giveaway_status, v_max_entries
  FROM giveaways
  WHERE id = p_giveaway_id;

  -- Check if giveaway exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Giveaway not found'
    );
  END IF;

  -- Check if giveaway is active
  IF v_giveaway_status != 'active' THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'This giveaway is not currently active'
    );
  END IF;

  -- Check if user already entered this giveaway
  SELECT id INTO v_existing_entry_id
  FROM giveaway_entries
  WHERE giveaway_id = p_giveaway_id
    AND user_id = v_user_id
  LIMIT 1;

  IF v_existing_entry_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'You have already entered this giveaway'
    );
  END IF;

  -- Get current entry count
  SELECT COUNT(*)
  INTO v_entry_count
  FROM giveaway_entries
  WHERE giveaway_id = p_giveaway_id;

  -- Check if giveaway is full
  IF v_entry_count >= v_max_entries THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'This giveaway has reached its maximum number of entries'
    );
  END IF;

  -- Get next entry number
  SELECT COALESCE(MAX(entry_number), 0) + 1
  INTO v_next_entry_number
  FROM giveaway_entries
  WHERE giveaway_id = p_giveaway_id;

  -- Insert new entry with all fields including email and phone_number
  INSERT INTO giveaway_entries (
    giveaway_id,
    user_id,
    entry_number,
    agree_18,
    agree_rules,
    agree_privacy,
    agree_one_entry,
    marketing_opt_in,
    full_name,
    birthday,
    email,
    phone_number
  ) VALUES (
    p_giveaway_id,
    v_user_id,
    v_next_entry_number,
    p_agree_18,
    p_agree_rules,
    p_agree_privacy,
    p_agree_one_entry,
    p_marketing_opt_in,
    p_full_name,
    p_birthday,
    p_email,
    p_phone_number
  );

  RETURN json_build_object(
    'success', TRUE,
    'message', 'Successfully entered! Entry #' || v_next_entry_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Error entering giveaway: ' || SQLERRM
    );
END;
$$;

-- Step 3: Add comment for documentation
COMMENT ON FUNCTION public.fn_enter_giveaway IS 'Handles giveaway entry with all required fields including email and phone number. Returns JSON with success status and message.';

-- Step 4: Verification
DO $$
DECLARE
  func_count INT;
BEGIN
  -- Count how many versions of the function exist
  SELECT COUNT(*)
  INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'fn_enter_giveaway'
    AND n.nspname = 'public';
  
  IF func_count = 1 THEN
    RAISE NOTICE '✅ SUCCESS: fn_enter_giveaway function has been updated';
    RAISE NOTICE '✅ Function now accepts all 10 parameters:';
    RAISE NOTICE '   - p_giveaway_id (UUID)';
    RAISE NOTICE '   - p_agree_18 (BOOLEAN)';
    RAISE NOTICE '   - p_agree_rules (BOOLEAN)';
    RAISE NOTICE '   - p_agree_privacy (BOOLEAN)';
    RAISE NOTICE '   - p_agree_one_entry (BOOLEAN)';
    RAISE NOTICE '   - p_marketing_opt_in (BOOLEAN)';
    RAISE NOTICE '   - p_full_name (TEXT)';
    RAISE NOTICE '   - p_birthday (TEXT)';
    RAISE NOTICE '   - p_email (TEXT)';
    RAISE NOTICE '   - p_phone_number (TEXT)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ The giveaway entry error should now be fixed!';
  ELSE
    RAISE WARNING '⚠️  WARNING: Expected 1 function but found %', func_count;
  END IF;
END $$;
