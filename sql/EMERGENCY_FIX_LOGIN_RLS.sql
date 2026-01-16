-- =====================================================
-- EMERGENCY FIX - Restore Login Functionality
-- =====================================================
-- The previous RLS policy broke login for all users
-- This script fixes it by allowing users to see their own profile
-- and allowing admins/bar owners to see all profiles
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Bar owners can view all active profiles" ON profiles;

-- Create a policy that allows users to see their own profile (CRITICAL FOR LOGIN)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a separate policy for bar owners/admins to see all profiles
CREATE POLICY "Admins and bar owners can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) 
  IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
  AND
  (status IS NULL OR status != 'deleted')
);

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND policyname IN ('Users can view own profile', 'Admins and bar owners can view all profiles');
