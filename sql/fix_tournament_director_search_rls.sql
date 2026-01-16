-- =====================================================
-- Fix Tournament Director Search - RLS Policies
-- =====================================================
-- This fixes the issue where bar owners can't see all users
-- when searching for tournament directors to assign
-- =====================================================

-- First, check existing policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =====================================================
-- Create or replace policy to allow bar owners to view all active profiles
-- =====================================================

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Bar owners can view all active profiles" ON profiles;
DROP POLICY IF EXISTS "BarAdmins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow bar owners to search users" ON profiles;

-- Create new policy that allows bar owners to see all active users
CREATE POLICY "Bar owners can view all active profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Allow if requesting user is a bar owner, admin, or master admin
  (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
  AND
  -- Only show non-deleted users
  (status IS NULL OR status != 'deleted')
);

-- =====================================================
-- Verify the policy was created
-- =====================================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND policyname = 'Bar owners can view all active profiles';

-- =====================================================
-- Test query (run as bar owner to verify)
-- =====================================================
-- This should return all active users when run by a bar owner
-- SELECT 
--   id_auto,
--   user_name,
--   name,
--   email,
--   role,
--   status
-- FROM profiles
-- WHERE (status IS NULL OR status != 'deleted')
-- ORDER BY user_name
-- LIMIT 20;
