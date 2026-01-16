-- =====================================================
-- DIAGNOSE AND FIX RLS ISSUES - BUILD 120
-- =====================================================
-- Run this to diagnose and fix BOTH login and search issues
-- =====================================================

-- STEP 1: Check what RLS policies currently exist
-- =====================================================
SELECT 
  policyname,
  cmd,
  roles::text as roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as has_using
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- STEP 2: Check if RLS is even enabled
-- =====================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- STEP 3: NUCLEAR OPTION - Temporarily disable RLS to test
-- =====================================================
-- Uncomment ONLY for testing, then re-enable immediately after
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- STEP 4: THE REAL FIX - Drop ALL policies and create simple ones
-- =====================================================

-- Drop EVERYTHING
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
END $$;

-- Create SIMPLE, PERMISSIVE policies

-- Policy 1: EVERYONE can view their own profile
CREATE POLICY "allow_own_profile_select"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: EVERYONE can view ALL non-deleted profiles
-- This is the simplest fix - just let authenticated users see all profiles
CREATE POLICY "allow_all_profiles_select"
ON profiles FOR SELECT
TO authenticated
USING (status IS NULL OR status != 'deleted');

-- Policy 3: Allow anonymous to read for login
CREATE POLICY "allow_anon_select_for_login"
ON profiles FOR SELECT
TO anon
USING (true);  -- Allow all for login lookup

-- STEP 5: Verify new policies
-- =====================================================
SELECT 
  policyname,
  cmd,
  roles::text,
  permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- STEP 6: Test query (should return your profile)
-- =====================================================
-- Run this while logged in to test:
-- SELECT id, email, user_name, role FROM profiles WHERE id = auth.uid();

-- STEP 7: If still not working, check auth.uid()
-- =====================================================
-- SELECT auth.uid() as my_user_id;
-- If this returns NULL, you're not authenticated properly

-- =====================================================
-- EXPECTED RESULTS AFTER RUNNING THIS:
-- =====================================================
-- ✅ Login works - users can see their own profile
-- ✅ Search works - bar owners can see all users  
-- ✅ No "user data missing" errors
-- ✅ Tournament director search shows all users
-- =====================================================

-- =====================================================
-- IF STILL NOT WORKING:
-- =====================================================
-- The issue might be that auth.users and profiles are out of sync
-- Run this to check:
--
-- SELECT 
--   a.id as auth_id,
--   a.email as auth_email,
--   p.id as profile_id,
--   p.email as profile_email,
--   p.user_name
-- FROM auth.users a
-- LEFT JOIN profiles p ON a.id = p.id
-- WHERE a.email = 'Tyelerr95@gmail.com';
--
-- If profile_id is NULL, the profile doesn't exist!
-- =====================================================
