-- ============================================================================
-- EMERGENCY FIX: Make Username Column Optional
-- ============================================================================
-- This makes the username column nullable and provides a default value
-- so the old function can still work while we troubleshoot
-- ============================================================================

-- Make username column nullable (if it isn't already)
ALTER TABLE giveaway_entries 
ALTER COLUMN username DROP NOT NULL;

-- Set default value to NULL
ALTER TABLE giveaway_entries 
ALTER COLUMN username SET DEFAULT NULL;

-- Do the same for archive table
ALTER TABLE giveaway_entries_archive 
ALTER COLUMN username DROP NOT NULL;

ALTER TABLE giveaway_entries_archive 
ALTER COLUMN username SET DEFAULT NULL;

-- Now recreate the function one more time with explicit NULL handling
DROP FUNCTION IF EXISTS public.fn_enter_giveaway CASCADE;

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

  -- Fetch username from profiles table (set to NULL if not found)
  BEGIN
    SELECT username INTO v_username
    FROM profiles
    WHERE id = v_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      v_username := NULL;
  END;

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

  -- Insert new entry with username (will be NULL if not found, which is OK)
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
    v_username,  -- Can be NULL
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

COMMENT ON FUNCTION public.fn_enter_giveaway IS 'Handles giveaway entry with automatic username capture from profiles table (NULL-safe). Includes all required fields.';

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ EMERGENCY FIX APPLIED';
  RAISE NOTICE '✅ Username column is now nullable';
  RAISE NOTICE '✅ Function updated with NULL-safe username handling';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Try entering the giveaway again - it should work now';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Username will be captured if available in profiles table';
  RAISE NOTICE '📝 If username is not found, entry will still succeed with username=NULL';
END $$;
