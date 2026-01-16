-- Fix RLS policies for Tournament Director assignment in venues table
-- Based on screenshot showing existing policies:
-- 1. "Bar owners can update their venues including TD assignment"
-- 2. "bar_owners_can_update_venues" (authenticated role, checking profiles.role = 'BarOwner')

-- First, check what's blocking the update
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'venues' AND cmd = 'UPDATE';

-- The issue is likely that the policy is checking for role = 'BarOwner' 
-- but the actual role value might be 'barowner' (lowercase) or 'BarAdmin'

-- Drop the restrictive policy
DROP POLICY IF EXISTS "bar_owners_can_update_venues" ON public.venues;

-- Drop the other update policy to recreate it properly
DROP POLICY IF EXISTS "Bar owners can update their venues including TD assignment" ON public.venues;

-- Create a comprehensive policy that handles all cases
CREATE POLICY "Bar owners can update their venues including TD assignment"
ON public.venues
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is the bar owner of this venue (match by id_auto)
  barowner_id = (SELECT id_auto FROM public.profiles WHERE id = auth.uid())
  OR
  -- Allow if user is an admin (any admin role)
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('MasterAdministrator', 'CompeteAdmin', 'BarAdmin', 'barowner')
  OR
  -- Allow if user's role contains 'admin' or 'owner' (case insensitive)
  LOWER((SELECT role FROM public.profiles WHERE id = auth.uid())) LIKE '%admin%'
  OR
  LOWER((SELECT role FROM public.profiles WHERE id = auth.uid())) LIKE '%owner%'
)
WITH CHECK (
  -- Same conditions for the updated data
  barowner_id = (SELECT id_auto FROM public.profiles WHERE id = auth.uid())
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('MasterAdministrator', 'CompeteAdmin', 'BarAdmin', 'barowner')
  OR
  LOWER((SELECT role FROM public.profiles WHERE id = auth.uid())) LIKE '%admin%'
  OR
  LOWER((SELECT role FROM public.profiles WHERE id = auth.uid())) LIKE '%owner%'
);

-- Verify the new policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'venues' AND cmd = 'UPDATE';

-- Test query to see what the current user's role is
SELECT id, id_auto, role
FROM public.profiles
WHERE id = auth.uid();
