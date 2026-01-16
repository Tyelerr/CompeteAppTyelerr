-- Fix RLS policies to allow users to update their own home_state, favorite_player, and favorite_game

-- First, check current UPDATE policy
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

-- Drop existing update policy if it's too restrictive
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a comprehensive update policy that allows users to update their own profiles
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

-- Also ensure the columns exist and are the correct type
DO $$
BEGIN
    -- Add home_state column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'home_state'
    ) THEN
        ALTER TABLE profiles ADD COLUMN home_state TEXT;
    END IF;

    -- Add favorite_player column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'favorite_player'
    ) THEN
        ALTER TABLE profiles ADD COLUMN favorite_player TEXT;
    END IF;

    -- Add favorite_game column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'favorite_game'
    ) THEN
        ALTER TABLE profiles ADD COLUMN favorite_game TEXT;
    END IF;
END $$;

-- Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('home_state', 'favorite_player', 'favorite_game')
ORDER BY column_name;
