-- Fix: Set User Role to BarOwner
-- The issue is that there are NO users with role 'BarOwner' in the database

-- Step 1: Check current user's profile (replace with your email)
SELECT 
    id,
    id_auto,
    email,
    role,
    user_name
FROM profiles 
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with the bar owner's email

-- Step 2: Update the user's role to BarOwner
-- Replace 'YOUR_EMAIL_HERE' with the actual email of the user who should be a bar owner
UPDATE profiles 
SET role = 'BarOwner'
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with the bar owner's email

-- Step 3: Verify the update
SELECT 
    id,
    id_auto,
    email,
    role,
    user_name
FROM profiles 
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with the bar owner's email

-- Step 4: Now try creating a venue again!
