-- Fix RLS policies to allow admin users to delete tournaments and likes
-- This script ensures that admin users can properly delete tournaments

-- 1. Check current RLS policies on tournaments table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'tournaments';

-- 2. Check current RLS policies on likes table  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'likes';

-- 3. Add policy to allow admins to delete tournaments
-- First, drop existing delete policy if it exists
DROP POLICY IF EXISTS "Admin users can delete tournaments" ON tournaments;

-- Create new policy allowing admins to delete
CREATE POLICY "Admin users can delete tournaments"
ON tournaments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('CompeteAdmin', 'MasterAdministrator')
  )
);

-- 4. Add policy to allow admins to delete likes
-- First, drop existing delete policy if it exists
DROP POLICY IF EXISTS "Admin users can delete likes" ON likes;

-- Create new policy allowing admins to delete likes
CREATE POLICY "Admin users can delete likes"
ON likes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('CompeteAdmin', 'MasterAdministrator')
  )
);

-- 5. Verify the new policies were created
SELECT 'Tournaments DELETE policies:' as info;
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'tournaments' AND cmd = 'DELETE';

SELECT 'Likes DELETE policies:' as info;
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'likes' AND cmd = 'DELETE';
