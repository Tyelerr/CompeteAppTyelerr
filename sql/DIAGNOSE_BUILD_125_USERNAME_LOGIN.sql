-- Diagnostic queries for Build 125 username login issue
-- Run these in Supabase SQL Editor to find the problem

-- Query 1: Check all users and their auth status
SELECT 
  p.user_name,
  p.email,
  p.status,
  p.id as profile_id,
  au.id as auth_id,
  au.email_confirmed_at,
  CASE 
    WHEN au.id IS NULL THEN '❌ NO AUTH USER - Cannot login'
    WHEN p.id != au.id THEN '⚠️ ID MISMATCH - May cause issues'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ EMAIL NOT CONFIRMED'
    WHEN p.status = 'deleted' THEN '❌ DELETED'
    WHEN p.status = 'active' OR p.status IS NULL THEN '✅ Should work in Build 125'
    ELSE '⚠️ Unknown status: ' || COALESCE(p.status, 'NULL')
  END as login_status
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.user_name;

-- Query 2: Test the exact query Build 125 uses for username lookup
-- This simulates what happens when you try to login with username "tbar"
SELECT 
  user_name,
  email,
  status,
  'Found by Build 125 query' as note
FROM public.profiles
WHERE 
  user_name ILIKE 'tbar'
  AND (status IS NULL OR status != 'deleted')
LIMIT 1;

-- Query 3: Check if the issue is with the OR syntax
-- Some Supabase versions might not support the .or() syntax correctly
SELECT 
  user_name,
  email,
  status,
  CASE 
    WHEN status IS NULL THEN 'NULL - should match'
    WHEN status != 'deleted' THEN 'Not deleted - should match'
    WHEN status = 'deleted' THEN 'Deleted - should NOT match'
  END as should_match_build_125_query
FROM public.profiles
WHERE user_name IN ('tmoneyhill', 'tbar', 'MetroSportzBar', 'Dozers')
ORDER BY user_name;

-- Query 4: Check RLS policies on profiles table
-- RLS might be blocking anonymous users from reading profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Query 5: Test if anonymous users can read profiles
-- This is critical for username lookup during login
SET ROLE anon;
SELECT user_name, email, status 
FROM public.profiles 
WHERE user_name ILIKE 'tbar'
LIMIT 1;
RESET ROLE;
