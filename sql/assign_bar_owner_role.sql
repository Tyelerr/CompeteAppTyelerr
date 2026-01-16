-- SQL script to assign bar-admin role to a user for testing
-- Replace 'user@example.com' with the actual email of the user you want to test with

-- Check current role of the user
SELECT email, role, user_name, name 
FROM profiles 
WHERE email = 'user@example.com';

-- Assign bar-admin role to the user
UPDATE profiles 
SET role = 'bar-admin' 
WHERE email = 'user@example.com';

-- Verify the role was updated
SELECT email, role, user_name, name 
FROM profiles 
WHERE email = 'user@example.com';

-- Optional: Check all users with bar-admin role
SELECT email, role, user_name, name, created_at
FROM profiles 
WHERE role = 'bar-admin'
ORDER BY created_at DESC;
