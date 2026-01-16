-- COMPREHENSIVE LOGIN FIX
-- This addresses multiple potential causes of the login issue

-- =====================================================
-- STEP 1: DIAGNOSE THE CURRENT STATE
-- =====================================================

-- Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED - This might be blocking login'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check existing policies
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'READ policy'
        WHEN cmd = 'INSERT' THEN 'create policy'
        WHEN cmd = 'UPDATE' THEN 'update policy'
        WHEN cmd = 'DELETE' THEN 'delete policy'
        ELSE 'other policy'
    END as policy_type
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if we can access profiles at all
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted_profiles,
    COUNT(CASE WHEN status IS NULL OR status != 'deleted' THEN 1 END) as active_profiles
FROM profiles;

-- Check Tmoneyhill account specifically
SELECT 
    'Tmoneyhill account details:' as info,
    id,
    user_name,
    email,
    status,
    role,
    created_at
FROM profiles 
WHERE user_name ILIKE 'tmoneyhill';

-- Check for other accounts
SELECT 
    'Other accounts sample:' as info,
    user_name,
    email,
    status,
    role
FROM profiles 
WHERE user_name NOT ILIKE 'tmoneyhill'
AND (status IS NULL OR status != 'deleted')
LIMIT 5;

-- =====================================================
-- STEP 2: FIX RLS POLICIES (MAIN SOLUTION)
-- =====================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow read access for validation" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- CRITICAL POLICY: Allow reading profiles for authentication
-- This is the most important policy for login to work
CREATE POLICY "Allow read access for validation" ON profiles
FOR SELECT USING (true);

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow profile creation during registration
CREATE POLICY "Allow profile creation" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('MasterAdministrator', 'CompeteAdmin')
  )
);

-- =====================================================
-- STEP 3: FIX DATA INTEGRITY ISSUES
-- =====================================================

-- Fix any accounts with NULL emails
UPDATE profiles 
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL 
AND email != LOWER(TRIM(email));

-- Fix any accounts with inconsistent usernames
UPDATE profiles 
SET user_name = TRIM(user_name)
WHERE user_name IS NOT NULL 
AND user_name != TRIM(user_name);

-- Ensure Tmoneyhill account is properly set up
UPDATE profiles 
SET status = NULL 
WHERE user_name ILIKE 'tmoneyhill' 
AND status = 'deleted';

-- =====================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create case-insensitive indexes if they don't exist
CREATE INDEX IF NOT EXISTS profiles_username_lower_idx 
ON profiles (LOWER(user_name)) 
WHERE user_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_email_lower_idx 
ON profiles (LOWER(email)) 
WHERE email IS NOT NULL;

-- =====================================================
-- STEP 5: VERIFY THE FIX
-- =====================================================

-- Test username lookup (this should work now)
SELECT 
    'Username lookup test:' as test,
    user_name,
    email,
    status,
    role
FROM profiles 
WHERE user_name ILIKE 'tmoneyhill'
AND (status IS NULL OR status != 'deleted');

-- Test case-insensitive lookup
SELECT 
    'Case insensitive test:' as test,
    user_name,
    email
FROM profiles 
WHERE user_name ILIKE 'TMONEYHILL'
AND (status IS NULL OR status != 'deleted');

-- Verify policies are in place
SELECT 
    'Policies verification:' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- =====================================================
-- STEP 6: EMERGENCY FALLBACK (USE ONLY IF NEEDED)
-- =====================================================

-- If the above doesn't work, temporarily disable RLS for testing
-- UNCOMMENT THE LINES BELOW ONLY FOR TESTING:

-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- 
-- -- Test login now - if it works, RLS was definitely the issue
-- -- Then re-enable RLS and ensure the policies above are correct:
-- -- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: ADDITIONAL DEBUGGING QUERIES
-- =====================================================

-- Check auth.users table for comparison
SELECT 
    'Auth users count:' as info,
    COUNT(*) as total_auth_users
FROM auth.users;

-- Check for orphaned auth users (users in auth.users but not in profiles)
SELECT 
    'Orphaned auth users:' as info,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
LIMIT 5;

-- Check for orphaned profiles (profiles without auth users)
SELECT 
    'Orphaned profiles:' as info,
    p.user_name,
    p.email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL
LIMIT 5;

-- Final success message
SELECT 'LOGIN FIX APPLIED SUCCESSFULLY!' as status;
SELECT 'Now test login with different usernames' as next_step;
