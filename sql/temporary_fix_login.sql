-- TEMPORARY FIX: Disable RLS to test login functionality
-- WARNING: This removes security temporarily - only use for debugging!

-- Step 1: Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 2: Temporarily disable RLS for testing
-- UNCOMMENT THE LINE BELOW TO TEST (BE CAREFUL!):
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Test queries that should work after disabling RLS
-- Test username lookup (this should work for all users now)
SELECT user_name, email, status, role 
FROM profiles 
WHERE user_name ILIKE 'tmoneyhill' 
AND (status IS NULL OR status != 'deleted');

-- Test other usernames (replace with actual usernames you're trying)
SELECT user_name, email, status, role 
FROM profiles 
WHERE user_name ILIKE 'testuser' 
AND (status IS NULL OR status != 'deleted');

-- Step 4: If login works after disabling RLS, the problem is RLS policies
-- Re-enable RLS with proper policies:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create proper RLS policies that allow login functionality
DROP POLICY IF EXISTS "Allow read access for validation" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Policy 1: Allow reading profiles for authentication/validation
-- This is CRITICAL for login to work
CREATE POLICY "Allow read access for validation" ON profiles
FOR SELECT USING (true);

-- Policy 2: Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Allow profile creation during registration
CREATE POLICY "Allow profile creation" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 5: Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('MasterAdministrator', 'CompeteAdmin')
  )
);

-- Step 6: Verify the fix worked
SELECT 'Testing username lookup after fix:' as test;
SELECT user_name, email, status, role 
FROM profiles 
WHERE user_name ILIKE 'tmoneyhill' 
AND (status IS NULL OR status != 'deleted');

-- Step 7: Check all policies are in place
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
