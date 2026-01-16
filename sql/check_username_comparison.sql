-- Check how usernames are stored in the database
-- This will help us understand why only "tmoneyhill" works

-- 1. Find all users with similar usernames
SELECT 
  id,
  user_name,
  email,
  status,
  created_at,
  LENGTH(user_name) as username_length,
  -- Show any hidden characters
  encode(user_name::bytea, 'hex') as username_hex
FROM profiles
WHERE 
  LOWER(user_name) IN ('tmoneyhill', 'tbar', 'metrosportzbar')
  OR user_name ILIKE '%tbar%'
  OR user_name ILIKE '%metro%'
ORDER BY created_at DESC;

-- 2. Check for any whitespace or special characters
SELECT 
  user_name,
  email,
  CASE 
    WHEN user_name != TRIM(user_name) THEN 'HAS WHITESPACE'
    WHEN user_name LIKE '% %' THEN 'HAS SPACES'
    ELSE 'CLEAN'
  END as whitespace_check,
  LENGTH(user_name) as length,
  LENGTH(TRIM(user_name)) as trimmed_length
FROM profiles
WHERE 
  LOWER(user_name) IN ('tmoneyhill', 'tbar', 'metrosportzbar')
  OR user_name ILIKE '%tbar%'
  OR user_name ILIKE '%metro%';

-- 3. Show exact username values for comparison
SELECT 
  'Username: ' || user_name || ' | Email: ' || email || ' | Status: ' || COALESCE(status, 'active') as user_info
FROM profiles
WHERE 
  user_name ILIKE '%tbar%'
  OR user_name ILIKE '%metro%'
  OR user_name ILIKE '%tmoneyhill%'
ORDER BY created_at DESC
LIMIT 10;
