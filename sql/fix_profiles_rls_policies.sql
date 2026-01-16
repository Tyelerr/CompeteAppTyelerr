-- Fix Row Level Security policies for profiles table to allow validation

-- Step 1: Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 2: Check existing policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 3: Temporarily disable RLS for testing (REMOVE THIS AFTER TESTING)
-- UNCOMMENT THE LINE BELOW TO TEST:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Create proper RLS policies that allow validation while maintaining security

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Allow read access for validation" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow reading all profiles for validation purposes
-- This is needed for username/email uniqueness checking
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

-- Step 5: Verify policies were created
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 6: Test query to verify access
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT user_name, email FROM profiles LIMIT 5;
