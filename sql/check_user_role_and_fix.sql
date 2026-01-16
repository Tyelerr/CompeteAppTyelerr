-- Step 1: Check your current user and role
-- Replace 'your-email@example.com' with your actual email
SELECT 
    id,
    id_auto,
    email,
    role,
    user_name,
    created_at
FROM profiles 
WHERE email = 'your-email@example.com';

-- Step 2: If role is NULL or not 'BarOwner', update it
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET role = 'BarOwner' 
WHERE email = 'your-email@example.com';

-- Step 3: Verify the update worked
SELECT 
    id,
    id_auto,
    email,
    role,
    user_name
FROM profiles 
WHERE email = 'your-email@example.com';

-- Step 4: Check if there are any other policies blocking the insert
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'venues'
ORDER BY policyname;
