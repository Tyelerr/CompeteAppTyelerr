-- ============================================================================
-- CHECK USER PROFILE USERNAME
-- ============================================================================
-- This script checks if the current user has a username in their profile
-- and if RLS policies are blocking the query
-- ============================================================================

-- Check current user's profile
SELECT 
  id,
  username,
  email,
  full_name,
  created_at
FROM profiles
WHERE id = auth.uid();

-- If the above returns no rows or username is NULL, check if username exists at all
SELECT 
  COUNT(*) as total_profiles,
  COUNT(username) as profiles_with_username,
  COUNT(*) - COUNT(username) as profiles_without_username
FROM profiles;

-- Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Provide guidance
DO $$
DECLARE
  v_current_user_id UUID;
  v_username TEXT;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE NOTICE '❌ No user is currently logged in';
    RAISE NOTICE '   → You must be logged in to check your profile';
  ELSE
    RAISE NOTICE '✅ Current user ID: %', v_current_user_id;
    
    -- Try to get username
    SELECT username INTO v_username
    FROM profiles
    WHERE id = v_current_user_id;
    
    IF v_username IS NULL OR v_username = '' THEN
      RAISE NOTICE '❌ Your profile does NOT have a username set';
      RAISE NOTICE '   → Go to your profile and set a username';
      RAISE NOTICE '   → Then try entering the giveaway again';
    ELSE
      RAISE NOTICE '✅ Your username is: %', v_username;
      RAISE NOTICE '   → Username should be captured on next giveaway entry';
    END IF;
  END IF;
END $$;
