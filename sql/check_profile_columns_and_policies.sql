-- Check if the columns exist in the profiles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('home_state', 'favorite_player', 'favorite_game')
ORDER BY column_name;

-- Check RLS policies on profiles table
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
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check if RLS is enabled on profiles table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Test query to see current profile data for a user
-- Replace 'YOUR_USER_ID' with actual user ID when running
SELECT 
    id,
    email,
    user_name,
    home_state,
    favorite_player,
    favorite_game,
    created_at,
    updated_at
FROM profiles
WHERE email = 'YOUR_EMAIL_HERE'
LIMIT 1;
