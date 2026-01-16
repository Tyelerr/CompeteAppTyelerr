-- =====================================================
-- FINAL COMPREHENSIVE LOGIN FIX - Apply This Now!
-- =====================================================
-- This fixes BOTH parts of the login flow:
-- 1. Username lookup (before auth) - needs anon access
-- 2. Profile data fetch (after auth) - needs authenticated access
-- =====================================================

-- Step 1: Remove ALL existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and bar owners can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public read for login" ON profiles;
DROP POLICY IF EXISTS "Bar owners can view all active profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- Step 2: Create ONE comprehensive policy that handles EVERYTHING
-- (Skip if already exists - that's fine!)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'profiles_select_policy'
  ) THEN
    CREATE POLICY "profiles_select_policy"
    ON profiles FOR SELECT
    TO anon, authenticated
    USING (status IS NULL OR status != 'deleted');
  END IF;
END $$;

-- Step 3: Verify the policy was created
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected output: ONE policy called "profiles_select_policy" with roles {anon, authenticated}
