-- Add unique constraints to profiles table for email and username
-- This ensures data integrity at the database level

-- First, let's check if there are any duplicate emails or usernames
-- and handle them before adding constraints

-- Check for duplicate emails (case-insensitive)
SELECT email, COUNT(*) as count 
FROM profiles 
WHERE email IS NOT NULL AND email != ''
GROUP BY LOWER(email) 
HAVING COUNT(*) > 1;

-- Check for duplicate usernames (case-insensitive)
SELECT user_name, COUNT(*) as count 
FROM profiles 
WHERE user_name IS NOT NULL AND user_name != ''
GROUP BY LOWER(user_name) 
HAVING COUNT(*) > 1;

-- If there are duplicates, you may need to resolve them manually before running the constraints
-- For example, you could update duplicate usernames by appending a number:
-- UPDATE profiles SET user_name = user_name || '_' || id_auto WHERE id IN (duplicate_ids);

-- Add unique constraint for email (case-insensitive)
-- This will prevent duplicate emails regardless of case
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx 
ON profiles (LOWER(email)) 
WHERE email IS NOT NULL AND email != '';

-- Add unique constraint for username (case-insensitive)
-- This will prevent duplicate usernames regardless of case
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
ON profiles (LOWER(user_name)) 
WHERE user_name IS NOT NULL AND user_name != '';

-- Add a comment to document these constraints
COMMENT ON INDEX profiles_email_unique_idx IS 'Ensures email uniqueness (case-insensitive)';
COMMENT ON INDEX profiles_username_unique_idx IS 'Ensures username uniqueness (case-insensitive)';

-- Verify the constraints were created
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND (indexname = 'profiles_email_unique_idx' OR indexname = 'profiles_username_unique_idx');
