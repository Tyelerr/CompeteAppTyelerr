-- ============================================================================
-- COMPREHENSIVE VENUE CREATION DIAGNOSIS
-- Run this to see EVERYTHING about your user and the venue creation setup
-- ============================================================================

-- 1. Show ALL users (find yours in this list)
SELECT 
    id,
    id_auto,
    email,
    role,
    user_name,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Show the RLS policy on venues table
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    with_check
FROM pg_policies 
WHERE tablename = 'venues'
ORDER BY policyname;

-- 3. Show all existing venues
SELECT 
    id,
    venue,
    address,
    barowner_id,
    td_id,
    created_at
FROM venues
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- AFTER YOU FIND YOUR USER IN STEP 1, RUN THESE:
-- ============================================================================

-- 4. Update your role to BarOwner (replace YOUR_ID_AUTO with your actual id_auto number)
-- UPDATE profiles SET role = 'BarOwner' WHERE id_auto = YOUR_ID_AUTO;

-- 5. Verify the update worked
-- SELECT id, id_auto, email, role FROM profiles WHERE id_auto = YOUR_ID_AUTO;

-- 6. Test creating a venue manually (replace YOUR_ID_AUTO with your actual id_auto number)
-- INSERT INTO venues (venue, address, city, state, zip_code, barowner_id)
-- VALUES ('Test Venue', '123 Test St', 'Test City', 'TS', '12345', YOUR_ID_AUTO)
-- RETURNING *;

-- 7. If test worked, delete the test venue
-- DELETE FROM venues WHERE venue = 'Test Venue' AND address = '123 Test St';
