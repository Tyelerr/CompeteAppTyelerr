-- Check if Tbar user exists in both profiles AND auth.users
-- This will help us understand if the issue is:
-- 1. User doesn't exist in profiles table
-- 2. User doesn't exist in auth.users table
-- 3. Email mismatch between the two tables

-- Check profiles table
SELECT 
  'PROFILES TABLE' as source,
  id,
  user_name,
  email,
  role,
  status
FROM profiles
WHERE LOWER(user_name) = 'tbar'
   OR LOWER(email) LIKE '%tbar%';

-- Check auth.users table (requires elevated permissions)
SELECT 
  'AUTH.USERS TABLE' as source,
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE LOWER(email) LIKE '%tbar%'
LIMIT 10;

-- Check for any mismatches between profiles and auth.users
SELECT 
  p.user_name,
  p.email as profile_email,
  au.email as auth_email,
  au.email_confirmed_at,
  CASE 
    WHEN p.email = au.email THEN 'MATCH'
    ELSE 'MISMATCH'
  END as email_status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE LOWER(p.user_name) = 'tbar'
   OR LOWER(p.email) LIKE '%tbar%';
