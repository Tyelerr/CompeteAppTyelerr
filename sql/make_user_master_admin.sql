-- SQL script to make a user a Master Administrator
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID

UPDATE profiles
SET role = 'master-administrator'
WHERE id = 'YOUR_USER_ID_HERE';

-- To find your user ID, you can run:
-- SELECT id, user_name, email FROM profiles WHERE user_name = 'your_username';
