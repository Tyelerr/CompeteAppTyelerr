-- Update fn_enter_giveaway function to include email and phone_number parameters
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION fn_enter_giveaway(
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
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'You must be logged in to enter a giveaway'
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

  -- Get current entry count and max entries
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(g.maximum_entries, 500)
  INTO v_entry_count, v_max_entries
  FROM giveaway_entries ge
  RIGHT JOIN giveaways g ON g.id = p_giveaway_id
  WHERE ge.giveaway_id = p_giveaway_id OR ge.giveaway_id IS NULL
  GROUP BY g.maximum_entries;

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
