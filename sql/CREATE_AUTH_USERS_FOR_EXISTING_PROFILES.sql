-- ⚠️ IMPORTANT: This creates auth users for profiles that don't have them
-- This requires ADMIN access and should be run carefully

-- Step 1: First, let's see which profiles are missing auth users
SELECT 
  p.id,
  p.user_name,
  p.email,
  p.status,
  CASE 
    WHEN au.id IS NULL THEN '❌ Missing auth user'
    ELSE '✅ Has auth user'
  END as auth_status
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at;

-- Step 2: For profiles missing auth users, you need to:
-- OPTION A: Use Supabase Dashboard (RECOMMENDED)
-- 1. Go to Authentication > Users
-- 2. Click "Invite user" or "Add user"
-- 3. Enter the email from the profile
-- 4. Set a temporary password
-- 5. The user can then login and change their password

-- OPTION B: Use Supabase Admin API (requires service role key)
-- This CANNOT be done from SQL directly for security reasons
-- You would need to use the Supabase Admin SDK or Dashboard

-- Step 3: After creating auth users, update the profile IDs to match
-- This SQL will help you verify the sync:
SELECT 
  p.user_name,
  p.email as profile_email,
  p.id as profile_id,
  au.id as auth_id,
  au.email as auth_email,
  CASE 
    WHEN p.id = au.id THEN '✅ IDs match'
    WHEN p.id != au.id THEN '⚠️ IDs mismatch - need to update profile'
    WHEN au.id IS NULL THEN '❌ No auth user'
  END as sync_status
FROM public.profiles p
LEFT JOIN auth.users au ON p.email = au.email
ORDER BY p.user_name;

-- Step 4: If IDs don't match, update the profile ID to match auth ID
-- ⚠️ BE VERY CAREFUL WITH THIS - it changes primary keys!
-- Only run this if you're sure the emails match correctly

-- Example for a single user (replace with actual IDs):
-- UPDATE public.profiles 
-- SET id = 'auth-user-uuid-here'
-- WHERE email = 'dozers@test.com';
