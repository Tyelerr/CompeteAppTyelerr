-- Add home_city and home_state columns to profiles table
-- These fields will store the user's home location for default filtering

-- Add home_city column
ALTER TABLE profiles 
ADD COLUMN home_city TEXT;

-- Add home_state column  
ALTER TABLE profiles 
ADD COLUMN home_state TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.home_city IS 'User home city for location-based filtering and tournament recommendations';
COMMENT ON COLUMN profiles.home_state IS 'User home state for location-based filtering and tournament recommendations';

-- Optional: Create index on home_state for faster filtering queries
CREATE INDEX IF NOT EXISTS idx_profiles_home_state ON profiles(home_state);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('home_city', 'home_state');
