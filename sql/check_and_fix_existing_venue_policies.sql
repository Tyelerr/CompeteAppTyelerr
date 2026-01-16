-- Check and Fix Existing Venue RLS Policies
-- The policy already exists, so we need to check if it's configured correctly

-- Step 1: Check the current policy configuration
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'venues' AND policyname = 'bar_owners_can_insert_venues';

-- Step 2: Drop and recreate the policy with correct configuration
DROP POLICY IF EXISTS "bar_owners_can_insert_venues" ON venues CASCADE;

-- Step 3: Create the corrected policy
CREATE POLICY "bar_owners_can_insert_venues" ON venues
FOR INSERT
TO authenticated
WITH CHECK (
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

-- Step 4: Verify the policy was created correctly
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'venues' AND policyname = 'bar_owners_can_insert_venues';

-- Step 5: Also check SELECT and UPDATE policies
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'venues'
ORDER BY cmd, policyname;
