-- ============================================================================
-- TRACE VENUE ASSIGNMENT ISSUE
-- ============================================================================
-- This script helps identify what's changing the user's role during venue assignment

-- STEP 1: First, restore the user's role
UPDATE profiles
SET role = 'bar-admin'
WHERE user_name = 'metrosportzbar';

-- STEP 2: Verify the role is correct
SELECT id_auto, user_name, role FROM profiles WHERE user_name = 'metrosportzbar';

-- STEP 3: Enable detailed logging for this user
-- Create a comprehensive logging trigger
CREATE OR REPLACE FUNCTION trace_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log EVERY update to this specific user
    IF NEW.user_name = 'metrosportzbar' OR OLD.user_name = 'metrosportzbar' THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE 'PROFILE UPDATE DETECTED for metrosportzbar';
        RAISE NOTICE 'Timestamp: %', NOW();
        RAISE NOTICE 'Old role: %', OLD.role;
        RAISE NOTICE 'New role: %', NEW.role;
        RAISE NOTICE 'Old id_auto: %', OLD.id_auto;
        RAISE NOTICE 'New id_auto: %', NEW.id_auto;
        
        -- Log the current transaction info
        RAISE NOTICE 'Current user: %', current_user;
        RAISE NOTICE 'Session user: %', session_user;
        
        -- If role changed, log a WARNING
        IF OLD.role != NEW.role THEN
            RAISE WARNING '⚠️⚠️⚠️ ROLE CHANGED from "%" to "%" ⚠️⚠️⚠️', OLD.role, NEW.role;
        END IF;
        
        RAISE NOTICE '========================================';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_trace_profile_changes ON profiles;
CREATE TRIGGER trigger_trace_profile_changes
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION trace_profile_changes();

-- STEP 4: Verify trigger is active
SELECT trigger_name, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_trace_profile_changes';

-- ============================================================================
-- NOW: Try assigning a venue to metrosportzbar in your app
-- ============================================================================
-- After you assign the venue, check your Supabase logs (Logs > Postgres Logs)
-- You should see detailed NOTICE messages showing exactly what changed
-- The WARNING message will highlight if/when the role changes

-- ============================================================================
-- STEP 5: After testing, check the user's role again
-- ============================================================================
-- Run this query after assigning the venue:
-- SELECT id_auto, user_name, role FROM profiles WHERE user_name = 'metrosportzbar';

-- ============================================================================
-- CLEANUP (run this after you've identified the issue)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trigger_trace_profile_changes ON profiles;
-- DROP FUNCTION IF EXISTS trace_profile_changes();
