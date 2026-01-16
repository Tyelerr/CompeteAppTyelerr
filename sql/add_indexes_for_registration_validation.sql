-- Add indexes to improve registration validation performance
-- Build 121 - Registration Validation Fix

-- Add index on user_name for faster username lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_user_name_lower 
ON profiles (LOWER(user_name))
WHERE status IS DISTINCT FROM 'deleted';

-- Add index on email for faster email lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower 
ON profiles (LOWER(email))
WHERE status IS DISTINCT FROM 'deleted';

-- Add composite index for status filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status 
ON profiles (status)
WHERE status IS NOT NULL;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
AND indexname LIKE 'idx_profiles_%'
ORDER BY indexname;
