-- ============================================================================
-- DIAGNOSE AND FIX: User Role Change When Assigning Venue
-- ============================================================================
-- This script investigates why user roles are being changed when venues are assigned
-- and provides fixes to prevent this from happening.

-- ============================================================================
-- STEP 1: CHECK FOR DATABASE TRIGGERS
-- ============================================================================

-- Check for triggers on venues table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'venues'
ORDER BY trigger_name;

-- Check for triggers on profiles table that might be related to venues
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
AND (action_statement LIKE '%venue%' OR action_statement LIKE '%barowner%')
ORDER BY trigger_name;

-- ============================================================================
-- STEP 2: CHECK RLS POLICIES ON PROFILES TABLE
-- ============================================================================

-- Check all RLS policies on profiles table
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
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- STEP 3: CHECK FOR FUNCTIONS THAT MODIFY USER ROLES
-- ============================================================================

-- Search for functions that update profiles.role
SELECT 
    routine_schema,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_definition LIKE '%UPDATE%profiles%role%'
ORDER BY routine_name;

-- ============================================================================
-- STEP 4: CHECK CURRENT STATE OF AFFECTED USER
-- ============================================================================

-- Check the current role of the affected user
SELECT 
    id,
    id_auto,
    email,
    user_name,
    role,
    created_at
FROM profiles
WHERE user_name = 'metrosportzbar' 
   OR user_name ILIKE '%metrosportz%'
   OR email ILIKE '%metrosportz%';

-- Check venues assigned to this user
SELECT 
    v.id,
    v.venue,
    v.address,
    v.barowner_id,
    p.user_name as owner_username,
    p.role as owner_role
FROM venues v
LEFT JOIN profiles p ON v.barowner_id = p.id_auto
WHERE v.barowner_id IN (
    SELECT id_auto FROM profiles 
    WHERE user_name = 'metrosportzbar' 
       OR user_name ILIKE '%metrosportz%'
       OR email ILIKE '%metrosportz%'
);

-- ============================================================================
-- STEP 5: RESTORE USER'S CORRECT ROLE
-- ============================================================================

-- Restore the user's role to BarAdmin
UPDATE profiles
SET role = 'BarAdmin'
WHERE (user_name = 'metrosportzbar' 
   OR user_name ILIKE '%metrosportz%'
   OR email ILIKE '%metrosportz%')
AND role != 'BarAdmin';

-- Verify the change
SELECT 
    id_auto,
    email,
    user_name,
    role,
    created_at
FROM profiles
WHERE user_name = 'metrosportzbar' 
   OR user_name ILIKE '%metrosportz%'
   OR email ILIKE '%metrosportz%';

-- ============================================================================
-- STEP 6: CREATE SAFEGUARD TO PREVENT FUTURE ROLE DOWNGRADES
-- ============================================================================

-- Create a function to prevent unauthorized role downgrades
CREATE OR REPLACE FUNCTION prevent_unauthorized_role_downgrade()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the role change attempt
    RAISE NOTICE 'Role change detected: User % (id_auto: %) from % to %', 
        OLD.user_name, OLD.id_auto, OLD.role, NEW.role;
    
    -- If role is being changed from a privileged role to BasicUser
    IF OLD.role IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin', 'TournamentDirector') 
       AND NEW.role = 'BasicUser' THEN
        
        -- Check if this is an authorized change (you can add more conditions here)
        -- For now, we'll just log it and allow it, but you can add restrictions
        RAISE WARNING 'Potential unauthorized role downgrade detected: User % (%) from % to %', 
            OLD.user_name, OLD.id_auto, OLD.role, NEW.role;
        
        -- Uncomment the line below to PREVENT the downgrade
        -- RAISE EXCEPTION 'Cannot downgrade role from % to % without explicit authorization', OLD.role, NEW.role;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to monitor role changes
DROP TRIGGER IF EXISTS trigger_monitor_role_changes ON profiles;
CREATE TRIGGER trigger_monitor_role_changes
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION prevent_unauthorized_role_downgrade();

-- ============================================================================
-- STEP 7: VERIFY NO TRIGGERS ARE MODIFYING PROFILES DURING VENUE OPERATIONS
-- ============================================================================

-- Check if there are any functions that are called during venue INSERT/UPDATE
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) LIKE '%profiles%'
AND pg_get_functiondef(p.oid) LIKE '%role%'
ORDER BY p.proname;

-- ============================================================================
-- STEP 8: TEST THE FIX
-- ============================================================================

-- After running this script, test by:
-- 1. Verifying the user's role is restored to BarAdmin
-- 2. Assigning a venue to the user
-- 3. Checking that the role hasn't changed

-- Test query to run after venue assignment:
-- SELECT id_auto, user_name, role FROM profiles WHERE user_name = 'metrosportzbar';

-- ============================================================================
-- NOTES
-- ============================================================================

/*
IMPORTANT FINDINGS TO LOOK FOR:

1. **Triggers**: Any trigger that fires on venues INSERT/UPDATE and modifies profiles
2. **RLS Policies**: Policies that might have WITH CHECK clauses that modify data
3. **Functions**: Any function that updates profiles.role when venues are modified
4. **Cascading Updates**: Foreign key constraints with ON UPDATE CASCADE that might affect roles

COMMON CAUSES:
- A trigger on venues table that incorrectly updates the user's role
- An RLS policy with a WITH CHECK clause that modifies the role
- A database function that's called during venue operations
- Application code that's making an additional UPDATE call (already ruled out)

SOLUTION:
- Remove or fix any triggers/functions that modify user roles during venue operations
- Add the safeguard trigger to prevent future unauthorized role changes
- Restore the user's role to BarAdmin
*/
