-- ============================================
-- CREATE PUSH_TOKENS TABLE
-- ============================================
-- Stores Expo push notification tokens for users
-- Each user can have multiple devices/tokens
-- ============================================

CREATE TABLE IF NOT EXISTS public.push_tokens (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Token information
    expo_push_token TEXT NOT NULL UNIQUE,
    
    -- Device information
    device_os TEXT,          -- 'ios' or 'android'
    device_name TEXT,        -- User-friendly device name
    
    -- Status tracking
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disabled_at TIMESTAMPTZ, -- Set when token becomes invalid
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Index on user_id for fast user token lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id 
ON public.push_tokens(user_id);

-- Index on expo_push_token for uniqueness checks
CREATE INDEX IF NOT EXISTS idx_push_tokens_expo_token 
ON public.push_tokens(expo_push_token);

-- Index for finding active tokens (not disabled)
CREATE INDEX IF NOT EXISTS idx_push_tokens_active 
ON public.push_tokens(user_id) WHERE disabled_at IS NULL;

-- ============================================
-- CREATE TRIGGER FOR AUTO-UPDATING updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trigger_update_push_tokens_updated_at
    BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_push_tokens_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

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

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.push_tokens IS 
'Stores Expo push notification tokens for users. Each user can have multiple devices/tokens.';

COMMENT ON COLUMN public.push_tokens.id IS 
'Primary key, auto-generated UUID';

COMMENT ON COLUMN public.push_tokens.user_id IS 
'Foreign key to auth.users.id - the user who owns this token';

COMMENT ON COLUMN public.push_tokens.expo_push_token IS 
'Expo push notification token (unique across all users)';

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

COMMENT ON COLUMN public.push_tokens.updated_at IS 
'Timestamp when token was last updated (auto-updated by trigger)';
