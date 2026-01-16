-- Check what users actually exist in the database
-- This will help us understand why username login isn't working

-- 1. Check all profiles in the database
SELECT 
    'All profiles:' as info,
    user_name,
    email,
    status,
    role,
    created_at
FROM profiles 
WHERE status IS NULL OR status != 'deleted'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check specifically for usernames that might be similar to what you're testing
SELECT 
    'Similar usernames:' as info,
    user_name,
    email,
    status
FROM profiles 
WHERE user_name ILIKE '%user%' 
   OR user_name ILIKE '%test%'
   OR user_name ILIKE '%demo%'
   OR user_name ILIKE '%admin%'
   OR user_name ILIKE '%tmoneyhill%'
ORDER BY user_name;

-- 3. Check if there are any users with NULL usernames
SELECT 
    'Users with NULL usernames:' as info,
    COUNT(*) as count,
    email
FROM profiles 
WHERE user_name IS NULL 
   AND (status IS NULL OR status != 'deleted')
GROUP BY email
LIMIT 5;

-- 4. Check total count of active users
SELECT 
    'Total active users:' as info,
    COUNT(*) as total_count
FROM profiles 
WHERE status IS NULL OR status != 'deleted';

-- 5. Check if RLS is blocking our queries
SELECT 
    'RLS status:' as info,
    schemaname, 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 6. Check existing policies
SELECT 
    'Current policies:' as info,
    policyname, 
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles';
