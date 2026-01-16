-- =====================================================
-- FIX: Disable Email Confirmation OR Manually Confirm
-- =====================================================
-- If you've never confirmed emails, Supabase might be blocking login
-- This script provides two options
-- =====================================================

-- OPTION 1: Manually confirm your email in auth.users
-- Replace 'your-email@example.com' with your actual email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL

-- Verify it worked
SELECT 
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL


-- OPTION 2: Confirm ALL unconfirmed emails (if you have multiple test accounts)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Verify all emails are now confirmed
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;


-- OPTION 3: Find your email first, then confirm it
-- Step 1: Find all unconfirmed emails
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Step 2: Once you find your email, run Option 1 with your specific email
