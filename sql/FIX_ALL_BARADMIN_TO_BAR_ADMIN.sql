-- ============================================================================
-- FIX: Convert all "BarAdmin" to "bar-admin" in database
-- ============================================================================
-- This fixes the root cause where PascalCase "BarAdmin" was written instead of
-- the correct kebab-case "bar-admin" enum value

-- STEP 1: Check current state - see all role values
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;

-- STEP 2: Fix all "BarAdmin" values to "bar-admin"
UPDATE profiles
SET role = 'bar-admin'
WHERE role = 'BarAdmin';

-- STEP 3: Verify the fix
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;

-- STEP 4: Check metrosportzbar specifically
SELECT id_auto, user_name, email, role
FROM profiles
WHERE user_name = 'metrosportzbar';

-- ============================================================================
-- DONE!
-- ============================================================================
-- All "BarAdmin" values have been converted to "bar-admin"
-- The user's role should now persist correctly when venues are assigned
