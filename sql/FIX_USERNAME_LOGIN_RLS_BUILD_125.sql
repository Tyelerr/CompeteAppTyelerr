-- Fix for Build 125 username login issue
-- The problem is likely that RLS policies are blocking anonymous users from reading profiles

-- Step 1: Check current RLS policies on profiles table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 2: Enable anonymous users to SELECT from profiles (for username lookup during login)
-- This is SAFE because we're only allowing SELECT (read), not INSERT/UPDATE/DELETE

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Allow anonymous users to read profiles for login" ON public.profiles;

-- Create new policy that allows anonymous users to SELECT profiles
CREATE POLICY "Allow anonymous users to read profiles for login"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Step 3: Verify the policy was created
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'Allow anonymous users to read profiles for login';

-- Step 4: Test that anonymous users can now read profiles
SET ROLE anon;
SELECT user_name, email, status 
FROM public.profiles 
WHERE user_name ILIKE 'tbar'
LIMIT 1;
RESET ROLE;

-- If the above query returns results, username login should now work!
