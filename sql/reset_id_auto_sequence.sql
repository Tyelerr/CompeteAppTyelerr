-- SQL script to reset the sequence for id_auto in profiles table
-- Adjust the sequence name if different in your database

-- Find the max current id_auto value
SELECT MAX(id_auto) FROM profiles;

-- Reset the sequence to max(id_auto) + 1
-- Replace 'profiles_id_auto_seq' with your actual sequence name if different
SELECT setval('profiles_id_auto_seq', (SELECT MAX(id_auto) FROM profiles) + 1);

-- After running this, the next inserted profile will get the next id_auto value
