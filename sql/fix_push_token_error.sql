-- ============================================
-- FIX PUSH TOKENS TABLE ISSUES
-- ============================================
-- This script:
-- 1. Creates the push_tokens table if it doesn't exist
-- 2. Ensures column names match what the app expects
-- 3. Adds proper RLS policies
-- 4. Adds a unique constraint on (user_id, token)
-- ============================================

-- First check if the table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'push_tokens') THEN
        CREATE TABLE public.push_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            token TEXT NOT NULL,
            device_os TEXT,
            device_name TEXT,
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            disabled_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);
        CREATE INDEX idx_push_tokens_token ON public.push_tokens(token);
        CREATE INDEX idx_push_tokens_active ON public.push_tokens(user_id) WHERE disabled_at IS NULL;
        
        RAISE NOTICE 'Created push_tokens table with proper schema';
    ELSE
        RAISE NOTICE 'push_tokens table already exists';
    END IF;
END
$$;

-- Check if the column is named 'expo_push_token' and rename it to 'token' if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'push_tokens' 
        AND column_name = 'expo_push_token'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'push_tokens' 
        AND column_name = 'token'
    ) THEN
        ALTER TABLE public.push_tokens RENAME COLUMN expo_push_token TO token;
        RAISE NOTICE 'Renamed column expo_push_token to token';
    END IF;
END
$$;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add device_os if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'push_tokens' 
        AND column_name = 'device_os'
    ) THEN
        ALTER TABLE public.push_tokens ADD COLUMN device_os TEXT;
        RAISE NOTICE 'Added device_os column';
    END IF;
    
    -- Add device_name if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'push_tokens' 
        AND column_name = 'device_name'
    ) THEN
        ALTER TABLE public.push_tokens ADD COLUMN device_name TEXT;
        RAISE NOTICE 'Added device_name column';
    END IF;
    
    -- Add last_seen_at if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'push_tokens' 
        AND column_name = 'last_seen_at'
    ) THEN
        ALTER TABLE public.push_tokens ADD COLUMN last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added last_seen_at column';
    END IF;
    
    -- Add disabled_at if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'push_tokens' 
        AND column_name = 'disabled_at'
    ) THEN
        ALTER TABLE public.push_tokens ADD COLUMN disabled_at TIMESTAMPTZ;
        RAISE NOTICE 'Added disabled_at column';
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'push_tokens' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.push_tokens ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END
$$;

-- Create or replace the updated_at trigger
CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_update_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trigger_update_push_tokens_updated_at
    BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_push_tokens_updated_at();

-- Add unique constraint on (user_id, token) if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'push_tokens_user_id_token_key' 
        AND conrelid = 'public.push_tokens'::regclass
    ) THEN
        ALTER TABLE public.push_tokens 
        ADD CONSTRAINT push_tokens_user_id_token_key UNIQUE (user_id, token);
        RAISE NOTICE 'Added unique constraint on (user_id, token)';
    END IF;
END
$$;

-- Enable RLS on the table
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can create their own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON public.push_tokens;

-- Create RLS policies
CREATE POLICY "Users can view their own push tokens"
ON public.push_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own push tokens"
ON public.push_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
ON public.push_tokens
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
ON public.push_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Add notifications_enabled column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'notifications_enabled'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added notifications_enabled column to profiles table';
    END IF;
END
$$;

-- Ensure profiles table has RLS policy for updating notifications_enabled
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.profiles;
CREATE POLICY "Users can update their own notification preferences"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
