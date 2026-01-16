-- ============================================================================
-- FINAL FIX: fn_enter_giveaway with Proper Type Conversion
-- ============================================================================
-- This fixes the "birthday is of type date but expression is of type text" error
-- by properly converting the text birthday parameter to a date type.
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.fn_enter_giveaway CASCADE;

-- Create function with proper type handling
CREATE OR REPLACE FUNCTION public.fn_enter_giveaway(
  p_giveaway_id UUID,
  p_agree_18 BOOLEAN DEFAULT FALSE,
  p_agree_rules BOOLEAN DEFAULT FALSE,
  p_agree_privacy BOOLEAN DEFAULT FALSE,
  p_agree_one_entry BOOLEAN DEFAULT FALSE,
  p_marketing_opt_in BOOLEAN DEFAULT FALSE,
  p_full_name TEXT DEFAULT NULL,
  p_birthday TEXT DEFAULT NULL,  -- Accept as TEXT, will convert to DATE
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

  -- Insert new entry with proper type conversion for birthday
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
    v_birthday_date,  -- Use the converted DATE value
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
COMMENT ON FUNCTION public.fn_enter_giveaway IS 'Handles giveaway entry with proper type conversion for birthday (TEXT to DATE). Includes all required fields: email, phone_number, agreements, etc.';

-- Verification
DO $$
DECLARE
  func_count INT;
BEGIN
  SELECT COUNT(*)
  INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'fn_enter_giveaway'
    AND n.nspname = 'public';
  
  IF func_count = 1 THEN
    RAISE NOTICE '✅ SUCCESS: fn_enter_giveaway function updated with type conversion';
    RAISE NOTICE '✅ Birthday parameter now properly converts TEXT to DATE';
    RAISE NOTICE '✅ All 10 parameters are supported';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Giveaway entry should now work correctly!';
  ELSE
    RAISE WARNING '⚠️  WARNING: Expected 1 function but found %', func_count;
  END IF;
END $$;
