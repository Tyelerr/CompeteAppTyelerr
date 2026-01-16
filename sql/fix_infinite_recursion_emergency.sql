-- EMERGENCY FIX: Infinite recursion in RLS policies for profiles table
-- This error occurs when RLS policies reference themselves or create circular dependencies

-- Step 1: Immediately drop ALL existing policies to stop the recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Allow read access for validation" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Step 2: Temporarily disable RLS to restore functionality
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Test that the app works now (run this query to verify)
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT user_name, email, role FROM profiles WHERE user_name ILIKE 'user5' LIMIT 1;

-- Step 4: Re-enable RLS with SIMPLE, non-recursive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create minimal, safe policies that won't cause recursion

-- Policy 1: Allow all reads (needed for authentication and validation)
-- This is the most important policy for login to work
CREATE POLICY "profiles_select_all" ON profiles
FOR SELECT USING (true);

-- Policy 2: Allow users to update their own profile only
CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow profile creation during registration
CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 6: Verify policies are working
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 7: Test the fix
SELECT 'Testing profile access after fix:' as test_message;
SELECT user_name, email, role FROM profiles WHERE user_name ILIKE 'tmoneyhill' LIMIT 1;
SELECT user_name, email, role FROM profiles WHERE user_name ILIKE 'user5' LIMIT 1;

-- IMPORTANT: If this fixes the login issue, you can add more specific policies later
-- But for now, this should restore basic functionality
