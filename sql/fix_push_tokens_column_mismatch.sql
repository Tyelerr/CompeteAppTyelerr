-- Fix the column name mismatch in push_tokens table
-- The code in CrudPushTokens.tsx uses 'token' but the schema uses 'expo_push_token'

-- First check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'push_tokens') THEN
    -- If the table exists, check if we need to rename the column
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'push_tokens' AND column_name = 'expo_push_token') THEN
      -- Rename the column to match what the code expects
      ALTER TABLE public.push_tokens RENAME COLUMN expo_push_token TO token;
      
      -- Update any indexes that might reference the old column name
      IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_push_tokens_expo_token') THEN
        DROP INDEX IF EXISTS idx_push_tokens_expo_token;
        CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);
      END IF;
    END IF;
  ELSE
    -- If the table doesn't exist, create it with the correct column name
    CREATE TABLE IF NOT EXISTS public.push_tokens (
      -- Identity
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Token information (using 'token' as the column name to match the code)
      token TEXT NOT NULL,
      
      -- Device information
      device_os TEXT,          -- 'ios' or 'android'
      device_name TEXT,        -- User-friendly device name
      
      -- Status tracking
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      disabled_at TIMESTAMPTZ, -- Set when token becomes invalid
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      
      -- Add unique constraint on user_id and token
      CONSTRAINT unique_user_token UNIQUE (user_id, token)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_tokens(user_id) WHERE disabled_at IS NULL;

    -- Set up RLS policies
    ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view their own tokens ONLY
    CREATE POLICY "Users can view their own push tokens"
    ON public.push_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

    -- Policy: Users can insert their own tokens ONLY
    CREATE POLICY "Users can create their own push tokens"
    ON public.push_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    -- Policy: Users can update their own tokens ONLY
    CREATE POLICY "Users can update their own push tokens"
    ON public.push_tokens
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

    -- Policy: Users can delete their own tokens ONLY
    CREATE POLICY "Users can delete their own push tokens"
    ON public.push_tokens
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add notifications_enabled to profiles table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'notifications_enabled'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
