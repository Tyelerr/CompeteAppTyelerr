-- ============================================
-- CREATE PUSH_TOKENS TABLE
-- ============================================
-- Stores Expo push notification tokens for users
-- Each user can have multiple devices/tokens
-- ============================================

-- Check if table exists first to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'push_tokens') THEN
        -- Create the table
        CREATE TABLE public.push_tokens (
            -- Identity
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            
            -- Token information (using 'token' as column name to match code)
            token TEXT NOT NULL,
            
            -- Device information
            device_os TEXT,          -- 'ios' or 'android'
            device_name TEXT,        -- User-friendly device name
            
            -- Status tracking
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            disabled_at TIMESTAMPTZ, -- Set when token becomes invalid
            
            -- Timestamps
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Add unique constraint to prevent duplicate tokens per user
        ALTER TABLE public.push_tokens ADD CONSTRAINT push_tokens_user_id_token_key UNIQUE (user_id, token);

        -- Index on user_id for fast user token lookups
        CREATE INDEX idx_push_tokens_user_id 
        ON public.push_tokens(user_id);

        -- Index on token for uniqueness checks
        CREATE INDEX idx_push_tokens_token 
        ON public.push_tokens(token);

        -- Index for finding active tokens (not disabled)
        CREATE INDEX idx_push_tokens_active 
        ON public.push_tokens(user_id) WHERE disabled_at IS NULL;

        -- Enable RLS
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

        -- Add comments for documentation
        COMMENT ON TABLE public.push_tokens IS 
        'Stores Expo push notification tokens for users. Each user can have multiple devices/tokens.';

        COMMENT ON COLUMN public.push_tokens.id IS 
        'Primary key, auto-generated UUID';

        COMMENT ON COLUMN public.push_tokens.user_id IS 
        'Foreign key to auth.users.id - the user who owns this token';

        COMMENT ON COLUMN public.push_tokens.token IS 
        'Expo push notification token';

        COMMENT ON COLUMN public.push_tokens.device_os IS 
        'Device operating system (ios or android)';

        COMMENT ON COLUMN public.push_tokens.device_name IS 
        'User-friendly device name for identification';

        COMMENT ON COLUMN public.push_tokens.last_seen_at IS 
        'Last time this token was seen/updated (updated on each app login)';

        COMMENT ON COLUMN public.push_tokens.disabled_at IS 
        'Timestamp when token was disabled (set when Expo returns invalid token error). Null = active';

        COMMENT ON COLUMN public.push_tokens.created_at IS 
        'Timestamp when token was first registered';
    ELSE
        -- Table exists, check if it has the correct columns
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'push_tokens' 
                      AND column_name = 'token') THEN
            -- Add token column if it doesn't exist
            ALTER TABLE public.push_tokens ADD COLUMN token TEXT;
            
            -- Update existing rows if there's an expo_push_token column
            IF EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'push_tokens' 
                      AND column_name = 'expo_push_token') THEN
                UPDATE public.push_tokens SET token = expo_push_token WHERE token IS NULL;
            END IF;
        END IF;
        
        -- Ensure RLS policies exist
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'push_tokens' AND policyname = 'Users can view their own push tokens') THEN
            CREATE POLICY "Users can view their own push tokens"
            ON public.push_tokens
            FOR SELECT
            USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'push_tokens' AND policyname = 'Users can create their own push tokens') THEN
            CREATE POLICY "Users can create their own push tokens"
            ON public.push_tokens
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'push_tokens' AND policyname = 'Users can update their own push tokens') THEN
            CREATE POLICY "Users can update their own push tokens"
            ON public.push_tokens
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'push_tokens' AND policyname = 'Users can delete their own push tokens') THEN
            CREATE POLICY "Users can delete their own push tokens"
            ON public.push_tokens
            FOR DELETE
            USING (auth.uid() = user_id);
        END IF;
        
        -- Ensure unique constraint exists
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'push_tokens_user_id_token_key') THEN
            ALTER TABLE public.push_tokens ADD CONSTRAINT push_tokens_user_id_token_key UNIQUE (user_id, token);
        END IF;
    END IF;
END
$$;
