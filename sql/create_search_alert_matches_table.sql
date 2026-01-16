-- ============================================
-- CREATE SEARCH_ALERT_MATCHES TABLE
-- ============================================
-- Tracks which tournaments have been matched to which alerts
-- Used for deduplication - ensures we only send one push per match
-- ============================================

CREATE TABLE IF NOT EXISTS public.search_alert_matches (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    alert_id UUID NOT NULL REFERENCES public.search_alerts(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL,  -- References tournaments.uuid
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tracking
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    push_sent_at TIMESTAMPTZ,     -- Timestamp when push notification was sent
    push_status TEXT,              -- 'sent', 'failed', 'pending'
    
    -- Ensure we only match each alert-tournament pair once
    UNIQUE(alert_id, tournament_id)
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Index on alert_id for finding matches by alert
CREATE INDEX IF NOT EXISTS idx_search_alert_matches_alert_id 
ON public.search_alert_matches(alert_id);

-- Index on tournament_id for finding matches by tournament
CREATE INDEX IF NOT EXISTS idx_search_alert_matches_tournament_id 
ON public.search_alert_matches(tournament_id);

-- Index on user_id for finding user's matches
CREATE INDEX IF NOT EXISTS idx_search_alert_matches_user_id 
ON public.search_alert_matches(user_id);

-- Composite index for efficient deduplication checks
CREATE INDEX IF NOT EXISTS idx_search_alert_matches_alert_tournament 
ON public.search_alert_matches(alert_id, tournament_id);

-- Index for finding unsent pushes
CREATE INDEX IF NOT EXISTS idx_search_alert_matches_unsent 
ON public.search_alert_matches(matched_at) WHERE push_sent_at IS NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE public.search_alert_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own matches
CREATE POLICY "Users can view their own alert matches"
ON public.search_alert_matches
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can insert matches (no user restriction for server-side matching)
-- This allows the Edge Function to insert matches
CREATE POLICY "System can create alert matches"
ON public.search_alert_matches
FOR INSERT
WITH CHECK (true);  -- Allow inserts from server-side functions

-- Policy: System can update match status
CREATE POLICY "System can update alert matches"
ON public.search_alert_matches
FOR UPDATE
USING (true);  -- Allow updates from server-side functions

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.search_alert_matches IS 
'Tracks which tournaments have been matched to which alerts. Used for deduplication to ensure only one push notification per match.';

COMMENT ON COLUMN public.search_alert_matches.id IS 
'Primary key, auto-generated UUID';

COMMENT ON COLUMN public.search_alert_matches.alert_id IS 
'Foreign key to search_alerts.id - the alert that matched';

COMMENT ON COLUMN public.search_alert_matches.tournament_id IS 
'Foreign key to tournaments.uuid - the tournament that matched';

COMMENT ON COLUMN public.search_alert_matches.user_id IS 
'Foreign key to auth.users.id - the user who owns the alert (denormalized for performance)';

COMMENT ON COLUMN public.search_alert_matches.matched_at IS 
'Timestamp when the match was detected';

COMMENT ON COLUMN public.search_alert_matches.push_sent_at IS 
'Timestamp when push notification was sent. Null = not sent yet';

COMMENT ON COLUMN public.search_alert_matches.push_status IS 
'Status of push notification: sent, failed, or pending';

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify the table was created successfully:
-- SELECT 
--     column_name, 
--     data_type, 
--     is_nullable,
--     column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
-- AND table_name = 'search_alert_matches'
-- ORDER BY ordinal_position;
