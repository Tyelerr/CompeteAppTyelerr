-- Diagnose Venue Creation Policy Issue
-- The policy exists but venue creation is still failing

-- Step 1: Check the current INSERT policy configuration
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'venues' 
AND cmd = 'INSERT';

-- Step 2: Check ALL policies on venues table
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'venues'
ORDER BY cmd, policyname;

-- Step 3: Check if the user's profile has the correct role
-- Replace 'YOUR_USER_EMAIL' with the actual bar owner's email
SELECT 
    id,
    id_auto,
    email,
    role,
    user_name
FROM profiles 
WHERE role = 'BarOwner'
LIMIT 10;

-- Step 4: Test if the policy condition would pass
-- This checks if the EXISTS clause in the policy would return true
-- Replace YOUR_BAR_OWNER_ID_AUTO with the actual id_auto value
SELECT 
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarOwner'
        AND profiles.id_auto = 1  -- Replace with actual barowner_id being used
    ) as policy_would_pass;

-- Step 5: Check table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'venues'
ORDER BY ordinal_position;

-- Step 6: Check foreign key constraints on barowner_id
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'venues' 
AND kcu.column_name = 'barowner_id'
AND tc.constraint_type = 'FOREIGN KEY';
