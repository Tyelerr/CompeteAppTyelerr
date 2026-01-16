-- ============================================================================
-- QUICK FIX: Restore metrosportzbar's BarAdmin Role
-- ============================================================================
-- This script immediately restores the user's role and adds a safeguard

-- STEP 1: Check current state
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

-- STEP 2: Restore the user's role to BarAdmin
UPDATE profiles
SET role = 'BarAdmin'
WHERE (user_name = 'metrosportzbar' 
   OR user_name ILIKE '%metrosportz%'
   OR email ILIKE '%metrosportz%')
AND role != 'BarAdmin';

-- STEP 3: Verify the change
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

-- STEP 4: Add safeguard trigger to monitor future role changes
CREATE OR REPLACE FUNCTION prevent_unauthorized_role_downgrade()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the role change attempt
    RAISE NOTICE 'Role change detected: User % (id_auto: %) from % to %', 
        OLD.user_name, OLD.id_auto, OLD.role, NEW.role;
    
    -- If role is being changed from a privileged role to BasicUser, log a warning
    IF OLD.role IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin', 'TournamentDirector') 
       AND NEW.role = 'BasicUser' THEN
        
        RAISE WARNING 'Potential unauthorized role downgrade detected: User % (%) from % to %', 
            OLD.user_name, OLD.id_auto, OLD.role, NEW.role;
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

-- STEP 5: Verify trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_monitor_role_changes';
