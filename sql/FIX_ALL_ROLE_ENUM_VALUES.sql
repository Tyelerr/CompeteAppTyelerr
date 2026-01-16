-- ============================================================================
-- FIX: Convert ALL incorrect PascalCase role values to correct kebab-case
-- ============================================================================
-- This fixes the systemic issue where PascalCase role values were written
-- instead of the correct kebab-case enum values

-- STEP 1: Check current state - see all role values
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;

-- STEP 2: Fix ALL incorrect role values to correct enum format
-- BasicUser -> basic
UPDATE profiles
SET role = 'basic'
WHERE role = 'BasicUser';

-- CompeteAdmin -> compete-admin  
UPDATE profiles
SET role = 'compete-admin'
WHERE role = 'CompeteAdmin';

-- BarAdmin -> bar-admin
UPDATE profiles
SET role = 'bar-admin'
WHERE role = 'BarAdmin';

-- TournamentDirector -> tournament-director
UPDATE profiles
SET role = 'tournament-director'
WHERE role = 'TournamentDirector';

-- MasterAdministrator -> master-administrator
UPDATE profiles
SET role = 'master-administrator'
WHERE role = 'MasterAdministrator';

-- STEP 3: Verify all fixes
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;

-- STEP 4: Check specific users
SELECT id_auto, user_name, email, role
FROM profiles
WHERE user_name IN ('metrosportzbar', 'TD1')
ORDER BY user_name;

-- ============================================================================
-- CORRECT ENUM VALUES (from InterfacesGlobal.tsx)
-- ============================================================================
/*
export enum EUserRole {
  BasicUser = 'basic',
  CompeteAdmin = 'compete-admin',
  BarAdmin = 'bar-admin',
  TournamentDirector = 'tournament-director',
  MasterAdministrator = 'master-administrator',
}
*/

-- ============================================================================
-- DONE!
-- ============================================================================
-- All incorrect PascalCase role values have been converted to correct kebab-case
-- Users' roles should now persist correctly when venues or TDs are assigned
