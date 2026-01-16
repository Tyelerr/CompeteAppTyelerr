-- Diagnose why username login fails for tbar and MetroSportzBar but works for tmoneyhill

-- 1. Check all three users and their status
SELECT 
  user_name,
  email,
  status,
  CASE 
    WHEN status IS NULL THEN 'NULL (active)'
    WHEN status = 'deleted' THEN 'DELETED'
    WHEN status = '' THEN 'EMPTY STRING'
    ELSE status
  END as status_display,
  created_at
FROM profiles
WHERE 
  LOWER(user_name) IN ('tmoneyhill', 'tbar', 'metrosportzbar', 'dozers')
ORDER BY created_at DESC;

-- 2. Test the exact query used in SignIn function
-- This simulates: .ilike('user_name', username).neq('status', 'deleted')
SELECT 
  user_name,
  email,
  status,
  'Found by username lookup' as note
FROM profiles
WHERE 
  user_name ILIKE 'tbar'
  AND (status IS DISTINCT FROM 'deleted')
LIMIT 1;

-- 3. Check if there's a difference in how the query handles NULL vs 'deleted'
SELECT 
  user_name,
  email,
  status,
  CASE 
    WHEN status IS NULL THEN 'Will match .neq(status, deleted)'
    WHEN status != 'deleted' THEN 'Will match .neq(status, deleted)'
    WHEN status = 'deleted' THEN 'Will NOT match'
    ELSE 'Unknown'
  END as will_match_query
FROM profiles
WHERE 
  LOWER(user_name) IN ('tmoneyhill', 'tbar', 'metrosportzbar', 'dozers');

-- 4. Check Dozers email issue
SELECT 
  user_name,
  email,
  status,
  'Dozers user' as note
FROM profiles
WHERE 
  email ILIKE 'dozers@test.com'
  OR email ILIKE '%dozers%';
