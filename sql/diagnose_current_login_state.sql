-- =====================================================
-- DIAGNOSE CURRENT LOGIN STATE
-- =====================================================
-- This will show us exactly what's blocking login
-- =====================================================

-- 1. Check all current RLS policies on profiles table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 2. Check if there are any INSERT/UPDATE/DELETE policies that might interfere
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
ORDER BY cmd;

-- 3. Test if anon users can read profiles (critical for login)
-- This should return rows if the fix is working
-- Run this in a NEW QUERY as anon user:
-- SET ROLE anon;
-- SELECT id, user_name, email FROM profiles LIMIT 5;
-- RESET ROLE;
