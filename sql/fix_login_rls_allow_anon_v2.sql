-- =====================================================
-- FIX LOGIN ISSUE - Allow Anon Users to Read Profiles
-- VERSION 2 - Handles existing policies
-- =====================================================

-- Drop ALL existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and bar owners can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public read for login" ON profiles;
DROP POLICY IF EXISTS "Bar owners can view all active profiles" ON profiles;

-- Create new policies that allow login to work

-- Policy 1: Allow anon AND authenticated users to read profiles (for login)
-- This is the KEY policy that fixes login
CREATE POLICY "Allow public read for login"
ON profiles FOR SELECT
TO anon, authenticated
USING (status IS NULL OR status != 'deleted');

-- Policy 2: Users can see their own profile (redundant but explicit)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Admins can see all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) 
  IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
);

-- Verify the policies were created
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
  AND cmd = 'SELECT'
ORDER BY policyname;
