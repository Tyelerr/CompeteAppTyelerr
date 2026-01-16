-- ============================================================================
-- IMMEDIATE FIX: Restore metrosportzbar's BarAdmin Role
-- ============================================================================
-- Simple script to restore the user's role without complex diagnostics

-- STEP 1: Check current state of the user
SELECT 
    id_auto,
    email,
    user_name,
    role,
    created_at
FROM profiles
WHERE user_name = 'metrosportzbar';

-- STEP 2: Restore the user's role to bar-admin (correct enum value)
UPDATE profiles
SET role = 'bar-admin'
WHERE user_name = 'metrosportzbar'
AND role != 'bar-admin';

-- STEP 3: Verify the change was applied
SELECT 
    id_auto,
    email,
    user_name,
    role,
    created_at
FROM profiles
WHERE user_name = 'metrosportzbar';

-- STEP 4: Check if user has any venues assigned
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
-- SAFEGUARD: Add trigger to monitor future role changes
-- ============================================================================

-- Create a function to log role changes
CREATE OR REPLACE FUNCTION log_role_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log any role change
    RAISE NOTICE 'Role change: User % (id_auto: %) changed from % to %', 
        OLD.user_name, OLD.id_auto, OLD.role, NEW.role;
    
    -- If role is being downgraded from bar-admin to basic, log a warning
    IF OLD.role IN ('bar-admin', 'master-administrator', 'compete-admin', 'tournament-director') 
       AND NEW.role = 'basic' THEN
        RAISE WARNING 'ALERT: Role downgrade detected for User % (id_auto: %) from % to basic', 
            OLD.user_name, OLD.id_auto, OLD.role;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log role changes
DROP TRIGGER IF EXISTS trigger_log_role_changes ON profiles;
CREATE TRIGGER trigger_log_role_changes
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION log_role_changes();

-- STEP 5: Verify trigger was created successfully
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_log_role_changes'
AND event_object_table = 'profiles';

-- ============================================================================
-- DONE!
-- ============================================================================
-- The user's role has been restored to BarAdmin
-- A monitoring trigger has been added to log future role changes
-- If the role changes again, check the database logs for the trigger's NOTICE/WARNING messages
