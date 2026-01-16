-- ============================================================================
-- FINAL FIX FOR BAR OWNER VENUE CREATION
-- ============================================================================
-- This script fixes the RLS policy that prevents bar owners from creating venues
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Step 1: Drop all existing conflicting policies
-- This ensures we start with a clean slate
DROP POLICY IF EXISTS "venues_insert_policy" ON venues CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON venues CASCADE;
DROP POLICY IF EXISTS "Bar owners can insert venues" ON venues CASCADE;
DROP POLICY IF EXISTS "bar_owners_can_insert_venues" ON venues CASCADE;

-- Step 2: Create the correct policy for venue insertion
-- This policy allows:
-- 1. BarAdmin users to create venues for anyone (no barowner_id check)
-- 2. BarOwner users to create venues only where barowner_id matches their id_auto
CREATE POLICY "bar_owners_can_insert_venues" ON venues
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow BarAdmin to insert venues for anyone (no barowner_id check needed)
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarAdmin'
    )
    OR
    -- Allow BarOwner to insert venues where barowner_id matches their id_auto
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarOwner'
        AND profiles.id_auto = venues.barowner_id
    )
);

-- Step 3: Verify the policy was created successfully
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
WHERE tablename = 'venues' 
AND policyname = 'bar_owners_can_insert_venues';

-- Step 4: Check existing policies on venues table
-- This helps identify any other policies that might interfere
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    with_check
FROM pg_policies 
WHERE tablename = 'venues'
ORDER BY policyname;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - Run these to verify the fix)
-- ============================================================================

-- Check your user's role and id_auto
-- Replace 'your-email@example.com' with your actual email
-- SELECT 
--     id,
--     id_auto,
--     email,
--     role,
--     user_name
-- FROM profiles 
-- WHERE email = 'your-email@example.com';

-- Test manual insert (replace YOUR_ID_AUTO with your actual id_auto value)
-- This will tell you if the policy is working correctly
-- INSERT INTO venues (venue, address, city, state, zip_code, barowner_id)
-- VALUES ('Test Venue', '123 Test St', 'Test City', 'TS', '12345', YOUR_ID_AUTO)
-- RETURNING *;

-- If the test insert worked, delete it
-- DELETE FROM venues WHERE venue = 'Test Venue' AND address = '123 Test St';

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If you still can't create venues after running this script:

-- 1. Verify your role is correct:
-- SELECT id, id_auto, email, role FROM profiles WHERE id = auth.uid();
-- Expected: role should be 'BarOwner' or 'BarAdmin'

-- 2. If role is wrong, update it:
-- UPDATE profiles SET role = 'BarOwner' WHERE email = 'your-email@example.com';

-- 3. Check if RLS is enabled on venues table:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'venues';
-- Expected: rowsecurity should be true

-- 4. List all policies on venues table:
-- SELECT * FROM pg_policies WHERE tablename = 'venues';

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================
-- After running this script, you should be able to:
-- ✓ Create new venues as a bar owner
-- ✓ See created venues in "My Venues" list
-- ✓ Edit your own venues
-- ✓ NOT see other bar owners' venues
-- ============================================================================
