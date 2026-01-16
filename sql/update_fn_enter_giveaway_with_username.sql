-- ============================================================================
-- UPDATE fn_enter_giveaway TO CAPTURE USERNAME
-- ============================================================================
-- This script updates the fn_enter_giveaway function to automatically fetch
-- and store the user's username from the profiles table when they enter a
-- giveaway.
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.fn_enter_giveaway CASCADE;

-- Create updated function with username capture
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
  v_username TEXT;
  v_existing_entry_id UUID;
  v_entry_count INT;
  v_max_entries INT;
  v_next_entry_number INT;
  v_giveaway_status TEXT;
  v_birthday_date DATE;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'You must be logged in to enter a giveaway'
    );
  END IF;

  -- Fetch username from profiles table
  SELECT username INTO v_username
  FROM profiles
  WHERE id = v_user_id;

  -- If username not found, set to NULL (shouldn't happen but handle gracefully)
  IF v_username IS NULL THEN
    RAISE WARNING 'Username not found for user_id: %', v_user_id;
  END IF;

  -- Convert birthday text to date (handle NULL case)
  IF p_birthday IS NOT NULL AND p_birthday != '' THEN
    BEGIN
      v_birthday_date := p_birthday::DATE;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object(
          'success', FALSE,
          'message', 'Invalid birthday format. Please use YYYY-MM-DD format.'
        );
    END;
  ELSE
    v_birthday_date := NULL;
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

  -- Insert new entry with username
  INSERT INTO giveaway_entries (
    giveaway_id,
    user_id,
    username,
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
    v_username,
    v_next_entry_number,
    p_agree_18,
    p_agree_rules,
    p_agree_privacy,
    p_agree_one_entry,
    p_marketing_opt_in,
    p_full_name,
    v_birthday_date,
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

-- Add comment
COMMENT ON FUNCTION public.fn_enter_giveaway IS 'Handles giveaway entry with automatic username capture from profiles table. Includes all required fields: username, email, phone_number, agreements, etc.';

-- Verification
DO $$
DECLARE
  func_count INT;
  func_source TEXT;
BEGIN
  SELECT COUNT(*)
  INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'fn_enter_giveaway'
    AND n.nspname = 'public';
  
  IF func_count = 1 THEN
    -- Check if function includes username
    SELECT pg_get_functiondef(p.oid)
    INTO func_source
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'fn_enter_giveaway'
      AND n.nspname = 'public';
    
    IF func_source LIKE '%v_username%' AND func_source LIKE '%username,%' THEN
      RAISE NOTICE '✅ SUCCESS: fn_enter_giveaway function updated with username capture';
      RAISE NOTICE '✅ Function now fetches username from profiles table';
      RAISE NOTICE '✅ Username is stored in giveaway_entries on each entry';
      RAISE NOTICE '';
      RAISE NOTICE '📝 Next step: Run update_giveaway_archival_with_username.sql';
    ELSE
      RAISE WARNING '⚠️  WARNING: Function updated but username logic may be missing';
    END IF;
  ELSE
    RAISE WARNING '⚠️  WARNING: Expected 1 function but found %', func_count;
  END IF;
END $$;
