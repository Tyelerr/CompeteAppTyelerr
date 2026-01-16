-- Debug why user5 username lookup is failing
-- Based on the database screenshot, user5 should exist

-- 1. Direct query to see if user5 exists (should work if RLS allows it)
SELECT 
    'Direct user5 lookup:' as test,
    user_name,
    email,
    status,
    role
FROM profiles 
WHERE user_name = 'user5';

-- 2. Case-insensitive lookup (what the app uses)
SELECT 
    'Case-insensitive user5 lookup:' as test,
    user_name,
    email,
    status,
    role
FROM profiles 
WHERE user_name ILIKE 'user5';

-- 3. Check with status filter (exact query from SignIn function)
SELECT 
    'SignIn function query simulation:' as test,
    user_name,
    email,
    status,
    role
FROM profiles 
WHERE user_name ILIKE 'user5'
AND status != 'deleted';

-- 4. Check if user5 has a 'deleted' status
SELECT 
    'Check user5 status:' as test,
    user_name,
    email,
    status,
    CASE 
        WHEN status IS NULL THEN 'NULL (active)'
        WHEN status = 'deleted' THEN 'DELETED (filtered out)'
        ELSE status
    END as status_explanation
FROM profiles 
WHERE user_name ILIKE 'user5';

-- 5. Check RLS policies affecting this query
SELECT 
    'Current RLS policies:' as info,
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
AND cmd = 'SELECT';

-- 6. Test if we can see any profiles at all
SELECT 
    'Can we see any profiles:' as test,
    COUNT(*) as total_visible_profiles
FROM profiles;

-- 7. Test the exact query structure from CrudUser.tsx
-- This simulates: .ilike('user_name', username).neq('status', 'deleted').maybeSingle()
SELECT 
    'Exact CrudUser.tsx query simulation:' as test,
    *
FROM profiles 
WHERE user_name ILIKE 'user5'
AND (status IS NULL OR status != 'deleted')
LIMIT 1;

-- 8. Check if there are multiple user5 entries
SELECT 
    'Multiple user5 entries check:' as test,
    COUNT(*) as count,
    user_name,
    email
FROM profiles 
WHERE user_name ILIKE 'user5'
GROUP BY user_name, email;
