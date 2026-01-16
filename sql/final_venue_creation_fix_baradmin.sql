-- Final Fix for BarAdmin Venue Creation
-- Your role is 'BarAdmin' which should already be allowed by the policy

-- Step 1: Verify your BarAdmin profile
SELECT 
    id,
    id_auto,
    email,
    role,
    user_name
FROM profiles 
WHERE role = 'BarAdmin';

-- Step 2: The policy should allow BarAdmin, but let's recreate it to be sure
DROP POLICY IF EXISTS "bar_owners_can_insert_venues" ON venues CASCADE;

CREATE POLICY "bar_owners_can_insert_venues" ON venues
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow if user is a BarAdmin (can create venues for anyone - NO barowner_id check needed!)
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarAdmin'
    )
    OR
    -- Allow if user is a bar owner and the barowner_id matches their id_auto
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarOwner'
        AND profiles.id_auto = venues.barowner_id
    )
);

-- Step 3: Verify the policy
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'venues' AND policyname = 'bar_owners_can_insert_venues';

-- Step 4: Test if you can insert a venue manually
-- This will tell us if it's the policy or something else
INSERT INTO venues (venue, address, city, state, zip_code, barowner_id)
VALUES ('Test Venue', '123 Test St', 'Test City', 'TS', '12345', NULL)
RETURNING *;

-- Step 5: If the above worked, delete the test venue
DELETE FROM venues WHERE venue = 'Test Venue' AND address = '123 Test St';
