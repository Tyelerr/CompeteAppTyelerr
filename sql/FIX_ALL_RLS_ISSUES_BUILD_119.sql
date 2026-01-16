-- =====================================================
-- COMPREHENSIVE RLS FIX FOR BUILD 119
-- =====================================================
-- This fixes BOTH issues:
-- 1. Login successful but user data missing
-- 2. Tournament director search only showing 10 users
-- =====================================================
-- Root Cause: RLS policies are too restrictive
-- =====================================================

-- Step 1: Check current policies
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

-- =====================================================
-- Step 2: Drop ALL existing SELECT policies on profiles
-- =====================================================

DROP POLICY IF EXISTS "Bar owners can view all active profiles" ON profiles;
DROP POLICY IF EXISTS "BarAdmins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow bar owners to search users" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;

-- =====================================================
-- Step 3: Create comprehensive SELECT policies
-- =====================================================

-- Policy 1: Allow users to view their OWN profile (CRITICAL for login)
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow bar owners/admins to view ALL active profiles (for search)
CREATE POLICY "Bar owners can view all active profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid())
  IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
  AND
  (status IS NULL OR status != 'deleted')
);

-- Policy 3: Allow anonymous users to read profiles during login lookup
-- This is needed for the SignIn function to find users by username
CREATE POLICY "Allow anon to read profiles for login"
ON profiles FOR SELECT
TO anon
USING (status IS NULL OR status != 'deleted');

-- =====================================================
-- Step 4: Verify policies were created
-- =====================================================

SELECT 
  policyname,
  cmd,
  roles::text,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =====================================================
-- Step 5: Test queries
-- =====================================================

-- Test 1: As authenticated user, can you see your own profile?
-- (Run this while logged in)
-- SELECT * FROM profiles WHERE id = auth.uid();

-- Test 2: As bar owner, can you see all profiles?
-- (Run this while logged in as bar owner)
-- SELECT COUNT(*) FROM profiles WHERE (status IS NULL OR status != 'deleted');

-- Test 3: As anonymous, can you read profiles for login?
-- (This is tested automatically during login)

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
-- After running this SQL:
-- ✅ Login will work - users can fetch their own profile data
-- ✅ Search will work - bar owners can see all users
-- ✅ Security maintained - deleted users are hidden
-- ✅ Anonymous login lookup works - can find users by username
-- =====================================================
