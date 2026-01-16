-- Check for duplicate emails in auth.users
SELECT email, COUNT(*) as count
FROM auth.users
WHERE email = 'tyelerr@yahoo.com'
GROUP BY email;

-- Check for duplicate emails in profiles
SELECT email, COUNT(*) as count
FROM profiles
WHERE email = 'tyelerr@yahoo.com'
GROUP BY email;

-- If you need to delete the duplicate email from profiles:
-- DELETE FROM profiles WHERE email = 'tyelerr@yahoo.com' AND id != '03be7621-c7ad-49d0-88bb-5023d19236d8';

-- If you need to delete the duplicate email from auth.users:
-- This should be done via Supabase Dashboard -> Authentication -> Users
