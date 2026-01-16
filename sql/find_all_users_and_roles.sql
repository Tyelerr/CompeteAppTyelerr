-- Find ALL users in the database with their roles
SELECT 
    id,
    id_auto,
    email,
    role,
    user_name,
    created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 20;

-- After you find your email from the list above, run this to update your role:
-- UPDATE profiles SET role = 'BarOwner' WHERE id_auto = YOUR_ID_AUTO_NUMBER;

-- Then verify:
-- SELECT id, id_auto, email, role FROM profiles WHERE id_auto = YOUR_ID_AUTO_NUMBER;
