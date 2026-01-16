-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "venues_insert_policy" ON venues CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON venues CASCADE;
DROP POLICY IF EXISTS "Bar owners can insert venues" ON venues CASCADE;
DROP POLICY IF EXISTS "bar_owners_can_insert_venues" ON venues CASCADE;

-- Create the correct policy
CREATE POLICY "bar_owners_can_insert_venues" ON venues
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarAdmin'
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarOwner'
        AND profiles.id_auto = venues.barowner_id
    )
);

-- Verify it worked
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'venues' 
AND policyname = 'bar_owners_can_insert_venues';
