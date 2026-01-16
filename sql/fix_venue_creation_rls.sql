-- Fix Venue Creation RLS Policies for Bar Owners and Bar Admins
-- This script ensures bar owners and bar admins can create venues

-- First, let's check existing policies
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
WHERE tablename = 'venues';

-- Drop existing INSERT policies that might be blocking bar owners
DROP POLICY IF EXISTS "venues_insert_policy" ON venues CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON venues CASCADE;
DROP POLICY IF EXISTS "Bar owners can insert venues" ON venues CASCADE;
DROP POLICY IF EXISTS "bar_owners_can_insert_venues" ON venues CASCADE;

-- Create a new policy that allows bar owners AND bar admins to insert venues
CREATE POLICY "bar_owners_can_insert_venues" ON venues
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow if user is a bar owner and the barowner_id matches their id_auto
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarOwner'
        AND profiles.id_auto = venues.barowner_id
    )
    OR
    -- Allow if user is a BarAdmin (can create venues for anyone)
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarAdmin'
    )
);

-- Also ensure bar owners can SELECT their own venues
DROP POLICY IF EXISTS "bar_owners_can_select_venues" ON venues;

CREATE POLICY "bar_owners_can_select_venues" ON venues
FOR SELECT
TO authenticated
USING (
    -- Allow if user is a bar owner and the barowner_id matches their id_auto
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarOwner'
        AND profiles.id_auto = venues.barowner_id
    )
    OR
    -- Allow if user is an admin
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('BarAdmin', 'TournamentDirector')
    )
    OR
    -- Allow if user is a tournament director assigned to this venue
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.id_auto = venues.td_id
    )
    OR
    -- Allow public read access (for displaying venues in tournaments)
    TRUE
);

-- Ensure bar owners can UPDATE their own venues
DROP POLICY IF EXISTS "bar_owners_can_update_venues" ON venues;

CREATE POLICY "bar_owners_can_update_venues" ON venues
FOR UPDATE
TO authenticated
USING (
    -- Allow if user is a bar owner and the barowner_id matches their id_auto
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarOwner'
        AND profiles.id_auto = venues.barowner_id
    )
    OR
    -- Allow if user is an admin
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarAdmin'
    )
)
WITH CHECK (
    -- Same conditions for the updated row
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarOwner'
        AND profiles.id_auto = venues.barowner_id
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarAdmin'
    )
);

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'venues'
ORDER BY cmd, policyname;
