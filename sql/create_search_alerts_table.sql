-- ============================================
-- CREATE SEARCH_ALERTS TABLE
-- ============================================
-- This table stores saved tournament searches for push notifications.
-- Each row represents one user's alert with filter criteria.
-- Null values in filter columns mean "ignore this filter" (no restriction).
-- ============================================

-- Create the search_alerts table
CREATE TABLE IF NOT EXISTS public.search_alerts (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Alert identification
    alert_name TEXT,  -- User-friendly name for this alert
    
    -- Filter columns (nullable = user did not set it)
    -- These mirror fields from the tournaments table
    game_type TEXT,
    format TEXT,
    equipment TEXT,
    reports_to_fargo BOOLEAN,
    
    -- Entry fee filter
    max_entry_fee NUMERIC,   -- Maximum entry fee cap (match if tournaments.tournament_fee <= this value)
    
    -- Fargo rating filters (min and max range)
    min_fargo INTEGER,       -- Minimum Fargo (match if tournaments.max_fargo >= this value)
    max_fargo INTEGER,       -- Maximum Fargo cap (match if tournaments.max_fargo <= this value)
    required_fargo_games INTEGER,  -- Required Fargo games (match if tournaments.required_fargo_games >= this value)
    
    -- Other tournament filters
    table_size TEXT,
    is_open_tournament BOOLEAN,
    
    -- Location filters
    city TEXT,               -- Parsed city from tournament location
    state TEXT,              -- Parsed state from tournament location
    location_text TEXT,      -- Free-text location search (matches against tournaments.address OR tournaments.venue using ILIKE)
    
    -- Date range filters
    date_from DATE,          -- Start of date range (match if tournaments.start_date >= this)
    date_to DATE,            -- End of date range (match if tournaments.start_date <= this)
    
    -- Control
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index on user_id for fast user-specific queries
CREATE INDEX IF NOT EXISTS idx_search_alerts_user_id 
ON public.search_alerts(user_id);

-- Index on is_enabled for filtering active alerts
CREATE INDEX IF NOT EXISTS idx_search_alerts_is_enabled 
ON public.search_alerts(is_enabled);

-- Composite index for active alerts by user
CREATE INDEX IF NOT EXISTS idx_search_alerts_user_enabled 
ON public.search_alerts(user_id, is_enabled);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_search_alerts_created_at 
ON public.search_alerts(created_at DESC);

-- ============================================
-- CREATE TRIGGER FOR AUTO-UPDATING updated_at
-- ============================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.update_search_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_search_alerts_updated_at ON public.search_alerts;
CREATE TRIGGER trigger_update_search_alerts_updated_at
    BEFORE UPDATE ON public.search_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_search_alerts_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on the table
ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own alerts ONLY
CREATE POLICY "Users can view their own search alerts"
ON public.search_alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own alerts ONLY
CREATE POLICY "Users can create their own search alerts"
ON public.search_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own alerts ONLY
CREATE POLICY "Users can update their own search alerts"
ON public.search_alerts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own alerts ONLY
CREATE POLICY "Users can delete their own search alerts"
ON public.search_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.search_alerts IS 
'Stores saved tournament searches for push notifications. Each row represents one user''s alert. Null filter columns mean "ignore this filter". tournament_fee and max_fargo are interpreted as maximum values (caps).';

COMMENT ON COLUMN public.search_alerts.id IS 
'Primary key, auto-generated UUID';

COMMENT ON COLUMN public.search_alerts.user_id IS 
'Foreign key to auth.users.id - the user who created this alert';

COMMENT ON COLUMN public.search_alerts.alert_name IS 
'User-friendly name for this alert. Null = unnamed alert';

COMMENT ON COLUMN public.search_alerts.game_type IS 
'Filter by game type (e.g., "8-Ball", "9-Ball"). Null = no restriction';

COMMENT ON COLUMN public.search_alerts.format IS 
'Filter by tournament format (e.g., "Single Elimination"). Null = no restriction';

COMMENT ON COLUMN public.search_alerts.equipment IS 
'Filter by equipment type. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.reports_to_fargo IS 
'Filter by Fargo rating requirement. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.max_entry_fee IS 
'Maximum entry fee cap - matches tournaments where tournaments.tournament_fee <= this value. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.min_fargo IS 
'Minimum Fargo rating - matches tournaments where tournaments.max_fargo >= this value. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.max_fargo IS 
'Maximum Fargo rating - matches tournaments where tournaments.max_fargo <= this value. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.required_fargo_games IS 
'Required Fargo games - matches tournaments where tournaments.required_fargo_games >= this value. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.table_size IS 
'Filter by table size (e.g., "9ft"). Null = no restriction';

COMMENT ON COLUMN public.search_alerts.is_open_tournament IS 
'Filter by open tournament status. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.city IS 
'Filter by city (parsed from tournament location). Null = no restriction';

COMMENT ON COLUMN public.search_alerts.state IS 
'Filter by state (parsed from tournament location). Null = no restriction';

COMMENT ON COLUMN public.search_alerts.location_text IS 
'Free-text location search - matches against tournaments.address OR tournaments.venue using ILIKE. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.date_from IS 
'Start of date range filter - matches tournaments where tournaments.start_date >= this value. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.date_to IS 
'End of date range filter - matches tournaments where tournaments.start_date <= this value. Null = no restriction';

COMMENT ON COLUMN public.search_alerts.is_enabled IS 
'Whether this alert is active. Default true';

COMMENT ON COLUMN public.search_alerts.created_at IS 
'Timestamp when alert was created';

COMMENT ON COLUMN public.search_alerts.updated_at IS 
'Timestamp when alert was last updated (auto-updated by trigger)';

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
-- AND table_name = 'search_alerts'
-- ORDER BY ordinal_position;
