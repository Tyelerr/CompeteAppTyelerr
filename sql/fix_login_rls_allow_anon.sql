-- =====================================================
-- FIX LOGIN ISSUE - Allow Anon Users to Read Profiles
-- =====================================================
-- Problem: Current RLS policies require authentication to read profiles
-- This breaks login because username->email lookup happens BEFORE authentication
-- Solution: Allow anon users to read profiles for login purposes
-- =====================================================

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and bar owners can view all profiles" ON profiles;

-- Step 2: Create new policies that allow login to work

-- Policy 1: Allow anon AND authenticated users to read profiles (for login)
-- This allows username->email lookup before authentication
CREATE POLICY "Allow public read for login"
ON profiles FOR SELECT
TO anon, authenticated
USING (status IS NULL OR status != 'deleted');

-- Policy 2: Keep existing policy for users to see their own profile
-- (This is redundant with Policy 1 but kept for clarity)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Keep existing policy for admins to see all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) 
  IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
);

-- Step 3: Verify the policies were created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected output:
-- 1. "Allow public read for login" - SELECT - {anon, authenticated}
-- 2. "Users can view own profile" - SELECT - {authenticated}
-- 3. "Admins can view all profiles" - SELECT - {authenticated}
