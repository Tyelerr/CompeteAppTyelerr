-- =====================================================
-- FIX: FetchProfileData After Successful Authentication
-- =====================================================
-- Problem: User can authenticate but can't fetch their own profile data
-- This happens AFTER Supabase auth succeeds but BEFORE the app gets user data
-- =====================================================

-- Check current policies that might block authenticated users from seeing their own profile
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- The issue might be that "Users can view own profile" policy has a problem
-- Let's recreate it to ensure it works correctly

-- Drop and recreate the "Users can view own profile" policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Verify it was created
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
  AND policyname = 'Users can view own profile';
