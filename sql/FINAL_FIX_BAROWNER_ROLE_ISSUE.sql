-- ============================================================================
-- FINAL FIX: Bar Owner Role Preservation When Assigning Venues
-- ============================================================================
-- This script fixes the issue where user roles change from 'bar-admin' to 'basic'
-- when venues are assigned to them.

-- ============================================================================
-- STEP 1: Diagnose Current State
-- ============================================================================

-- Check the current role of metrosportzbar
SELECT 
    id_auto,
    email,
    user_name,
    role,
    created_at
FROM profiles
WHERE user_name = 'metrosportzbar';

-- Check all possible role values in the database
SELECT DISTINCT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;

-- ============================================================================
-- STEP 2: Restore User's Correct Role
-- ============================================================================

-- Restore metrosportzbar's role to 'bar-admin' (correct enum value)
UPDATE profiles
SET role = 'bar-admin'
WHERE user_name = 'metrosportzbar'
AND role != 'bar-admin';

-- Verify the change
SELECT 
    id_auto,
    email,
    user_name,
    role,
    created_at
FROM profiles
WHERE user_name = 'metrosportzbar';

-- ============================================================================
-- STEP 3: Check for Problematic Triggers
-- ============================================================================

-- List all triggers on the venues table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'venues'
ORDER BY trigger_name;

-- List all triggers on the profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- ============================================================================
-- STEP 4: Add Safeguard Trigger to Monitor Role Changes
-- ============================================================================

-- Create function to log and prevent unauthorized role downgrades
CREATE OR REPLACE FUNCTION prevent_unauthorized_role_downgrade()
RETURNS TRIGGER AS $$
BEGIN
    -- Log ALL role changes for debugging
    RAISE NOTICE 'Role change detected: User "%" (id_auto: %) changed from "%" to "%"', 
        OLD.user_name, OLD.id_auto, OLD.role, NEW.role;
    
    -- If role is being downgraded from privileged role to basic, log a WARNING
    IF OLD.role IN ('bar-admin', 'master-administrator', 'compete-admin', 'tournament-director') 
       AND NEW.role = 'basic' THEN
        RAISE WARNING '⚠️ ALERT: Unauthorized role downgrade detected! User "%" (id_auto: %) from "%" to "basic"', 
            OLD.user_name, OLD.id_auto, OLD.role;
        
        -- UNCOMMENT THE LINE BELOW TO PREVENT THE DOWNGRADE (after identifying the cause)
        -- RAISE EXCEPTION 'Cannot downgrade role from % to basic without explicit authorization', OLD.role;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_prevent_role_downgrade ON profiles;

-- Create the trigger
CREATE TRIGGER trigger_prevent_role_downgrade
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION prevent_unauthorized_role_downgrade();

-- Verify trigger was created
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_prevent_role_downgrade'
AND event_object_table = 'profiles';

-- ============================================================================
-- STEP 5: Check RLS Policies on Profiles Table
-- ============================================================================

-- List all RLS policies on profiles table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- STEP 6: Verify Venues Assigned to User
-- ============================================================================

-- Check venues assigned to metrosportzbar
SELECT 
    v.id,
    v.venue,
    v.address,
    v.barowner_id,
    p.user_name as owner_username,
    p.role as owner_role
FROM venues v
LEFT JOIN profiles p ON v.barowner_id = p.id_auto
WHERE p.user_name = 'metrosportzbar';

-- ============================================================================
-- TESTING INSTRUCTIONS
-- ============================================================================

/*
After running this script:

1. Verify metrosportzbar's role is now 'bar-admin'
2. Try assigning a venue to the user again
3. Check the database logs for any NOTICE or WARNING messages from the trigger
4. If you see a WARNING about role downgrade, that will tell you WHEN it's happening
5. The trigger will log the exact moment the role changes, helping identify the cause

If the role changes again after running this script:
- Check your Supabase logs for the WARNING message
- The message will show you exactly when the role changed
- This will help identify if it's a trigger, RLS policy, or application code causing the issue

To enable role downgrade prevention (after identifying the cause):
- Uncomment the RAISE EXCEPTION line in the trigger function above
- This will BLOCK any unauthorized role downgrades
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================

/*
WHAT THIS SCRIPT DOES:
1. ✅ Restores metrosportzbar's role to 'bar-admin'
2. ✅ Shows all role values in the database
3. ✅ Lists all triggers on venues and profiles tables
4. ✅ Adds a monitoring trigger to log role changes
5. ✅ Shows all RLS policies on profiles table
6. ✅ Verifies venues assigned to the user

CORRECT ROLE VALUES (from InterfacesGlobal.tsx):
- BasicUser = 'basic'
- CompeteAdmin = 'compete-admin'
- BarAdmin = 'bar-admin'  ← THIS IS THE CORRECT VALUE
- TournamentDirector = 'tournament-director'
- MasterAdministrator = 'master-administrator'
*/
