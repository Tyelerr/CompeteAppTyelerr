-- ⚠️ WARNING: This will delete ALL users from your database
-- This is useful for development/testing but should NEVER be run in production
-- Make sure you have a backup if needed!

-- Step 1: Delete all profiles (this is in the public schema)
DELETE FROM public.profiles;

-- Step 2: Delete all auth users (requires admin privileges)
-- Note: You need to run this in Supabase Dashboard > Authentication > Users
-- Or use the Supabase Dashboard UI to delete users one by one

-- Alternative: Use Supabase Dashboard
-- 1. Go to Authentication > Users
-- 2. Select all users
-- 3. Click "Delete users"

-- Step 3: Clean up related data (optional but recommended)
DELETE FROM public.permissions;
DELETE FROM public.likes;
DELETE FROM public.giveaway_entries;
-- Add other user-related tables as needed

-- Step 4: Reset auto-increment counters (optional)
-- This makes the next user get id_auto = 1
ALTER SEQUENCE profiles_id_auto_seq RESTART WITH 1;

-- Verification queries:
-- Run these after deletion to confirm everything is clean

-- Check profiles table (should return 0)
SELECT COUNT(*) as profiles_count FROM public.profiles;

-- Check if any permissions remain (should return 0)
SELECT COUNT(*) as permissions_count FROM public.permissions;

-- Check if any likes remain (should return 0)  
SELECT COUNT(*) as likes_count FROM public.likes;
