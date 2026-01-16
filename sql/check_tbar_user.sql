-- Check if user "Tbar" exists in the database
SELECT 
  id,
  user_name,
  email,
  role,
  status,
  created_at
FROM profiles
WHERE LOWER(user_name) = LOWER('Tbar')
   OR LOWER(user_name) LIKE '%tbar%';

-- Also check all usernames that start with 'T'
SELECT 
  user_name,
  email,
  role,
  status
FROM profiles
WHERE LOWER(user_name) LIKE 't%'
ORDER BY user_name;

-- Check if the email exists in auth.users (Supabase Auth)
-- Note: You may need to run this in the Supabase dashboard with proper permissions
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email ILIKE '%tbar%'
   OR email ILIKE '%test%'
LIMIT 10;
