-- Create test users to verify username login functionality
-- This will help us test if the login system works with actual usernames

-- First, let's see what users currently exist
SELECT 
    'Current users before creating test users:' as info,
    user_name,
    email,
    status,
    role
FROM profiles 
WHERE status IS NULL OR status != 'deleted'
ORDER BY user_name;

-- Create test users in the profiles table
-- Note: These users won't have authentication records, so they're just for testing username lookup

INSERT INTO profiles (
    id,
    email,
    user_name,
    name,
    role,
    status,
    preferred_game,
    skill_level,
    zip_code,
    home_city,
    home_state,
    favorite_player,
    favorite_game,
    profile_image_url
) VALUES 
-- Test User 1
(
    gen_random_uuid(),
    'testuser1@example.com',
    'testuser1',
    'Test User One',
    'BasicUser',
    NULL,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
),
-- Test User 2
(
    gen_random_uuid(),
    'user5@example.com',
    'user5',
    'User Five',
    'BasicUser',
    NULL,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
),
-- Test User 3
(
    gen_random_uuid(),
    'demouser@example.com',
    'demouser',
    'Demo User',
    'BasicUser',
    NULL,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
)
ON CONFLICT (email) DO NOTHING;

-- Verify the test users were created
SELECT 
    'Test users created:' as info,
    user_name,
    email,
    status,
    role
FROM profiles 
WHERE user_name IN ('testuser1', 'user5', 'demouser')
ORDER BY user_name;

-- Test the username lookup that the login system uses
SELECT 
    'Testing username lookup for user5:' as test,
    user_name,
    email,
    status
FROM profiles 
WHERE user_name ILIKE 'user5'
AND (status IS NULL OR status != 'deleted');

-- Test case-insensitive lookup
SELECT 
    'Testing case-insensitive lookup for USER5:' as test,
    user_name,
    email,
    status
FROM profiles 
WHERE user_name ILIKE 'USER5'
AND (status IS NULL OR status != 'deleted');

-- Show all active users now
SELECT 
    'All active users after creating test users:' as info,
    COUNT(*) as total_count
FROM profiles 
WHERE status IS NULL OR status != 'deleted';

-- Important note about authentication
SELECT 'IMPORTANT: These test users only exist in profiles table.' as note;
SELECT 'They do not have Supabase auth records, so login will fail at authentication step.' as note2;
SELECT 'To test actual login, you need to create users through the registration process.' as note3;
SELECT 'But this confirms that username lookup is working correctly.' as note4;
