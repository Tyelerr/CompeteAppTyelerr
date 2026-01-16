-- =====================================================
-- FINAL LOGIN FIX - Build 117
-- =====================================================
-- Problem: Build 115 created a policy that ONLY allows admins to view profiles
-- This broke login for regular users because they can't fetch their own profile
-- Solution: Ensure BOTH anon users (for username lookup) AND authenticated users
-- (for fetching their own profile) can read the profiles table
-- =====================================================

-- Step 1: Drop ALL existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and bar owners can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public read for login" ON profiles;
DROP POLICY IF EXISTS "Bar owners can view all active profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;

-- Step 2: Create comprehensive policies that allow login AND admin search

-- Policy 1: Allow EVERYONE (anon + authenticated) to read profiles for login
-- This is CRITICAL for username->email lookup during login
CREATE POLICY "Allow public read for login"
ON profiles FOR SELECT
TO anon, authenticated
USING (status IS NULL OR status != 'deleted');

-- Policy 2: Explicitly allow users to see their own profile
-- (Redundant with Policy 1 but kept for clarity and security)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Allow admins/bar owners to see all profiles
-- (Also redundant with Policy 1 but kept for explicit admin permissions)
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) 
  IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
);

-- Step 3: Verify all policies were created correctly
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Expected output: 3 policies
-- 1. "Allow public read for login" - {anon, authenticated}
-- 2. "Admins can view all profiles" - {authenticated}
-- 3. "Users can view own profile" - {authenticated}
