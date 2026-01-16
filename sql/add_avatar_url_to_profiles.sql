-- Add avatar_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image stored in Supabase Storage';
