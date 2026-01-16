-- Delete all mock tournaments
DELETE FROM tournaments WHERE id_unique_number IN (
  SELECT id_unique_number FROM tournaments WHERE tournament_name LIKE '%mock%'
);

-- Delete from related tables first to avoid foreign key constraints
DELETE FROM likes WHERE user_id IN (
  SELECT id FROM profiles WHERE email <> 'Tyelerr95@gmail.com'
);

DELETE FROM permissions WHERE id_user_need_permission IN (
  SELECT id_auto FROM profiles WHERE email <> 'Tyelerr95@gmail.com'
);

DELETE FROM enter_activities WHERE user_id IN (
  SELECT id_auto FROM profiles WHERE email <> 'Tyelerr95@gmail.com'
);

-- Delete all users except the one with email 'Tyelerr95@gmail.com'
-- Adjusted table name to 'profiles' as per Supabase default auth schema
DELETE FROM profiles WHERE email <> 'Tyelerr95@gmail.com';

-- Optional: Add any additional cleanup if needed
