-- Find if "Tbar" username exists and what email it's linked to
SELECT 
  user_name,
  email,
  role,
  status,
  created_at
FROM profiles
WHERE LOWER(user_name) = LOWER('Tbar')
  AND (status IS NULL OR status != 'deleted');

-- Also check for similar usernames
SELECT 
  user_name,
  email,
  role,
  status,
  created_at
FROM profiles
WHERE LOWER(user_name) LIKE '%tbar%'
  AND (status IS NULL OR status != 'deleted');

-- Check if tyelerr95@gmail.com has a username
SELECT 
  user_name,
  email,
  role,
  status,
  created_at
FROM profiles
WHERE email = 'tyelerr95@gmail.com';

-- List ALL usernames to see what exists
SELECT 
  user_name,
  email,
  role,
  created_at
FROM profiles
WHERE status IS NULL OR status != 'deleted'
ORDER BY created_at DESC
LIMIT 20;
