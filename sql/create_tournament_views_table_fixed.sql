-- Create tournament_views table to track when users view tournaments
-- This enables analytics for bar owners and prevents spam by limiting one view per user per week

CREATE TABLE IF NOT EXISTS tournament_views (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET, -- Track IP for anonymous users
    user_agent TEXT, -- Track browser/device info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tournament_views_tournament_id ON tournament_views(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_views_user_id ON tournament_views(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_views_viewed_at ON tournament_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_tournament_views_user_tournament ON tournament_views(user_id, tournament_id);

-- Create function to check if user can view tournament (rate limiting)
CREATE OR REPLACE FUNCTION can_user_view_tournament(
    p_user_id UUID,
    p_tournament_id INTEGER,
    p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    last_view_date TIMESTAMP WITH TIME ZONE;
    week_ago TIMESTAMP WITH TIME ZONE;
BEGIN
    week_ago := NOW() - INTERVAL '7 days';
    
    -- Check for registered users
    IF p_user_id IS NOT NULL THEN
        SELECT viewed_at INTO last_view_date
        FROM tournament_views
        WHERE user_id = p_user_id 
        AND tournament_id = p_tournament_id
        AND viewed_at > week_ago
        ORDER BY viewed_at DESC
        LIMIT 1;
    ELSE
        -- Check for anonymous users by IP
        SELECT viewed_at INTO last_view_date
        FROM tournament_views
        WHERE ip_address = p_ip_address 
        AND tournament_id = p_tournament_id
        AND viewed_at > week_ago
        AND user_id IS NULL
        ORDER BY viewed_at DESC
        LIMIT 1;
    END IF;
    
    -- Return true if no recent view found (can view), false if viewed within a week
    RETURN last_view_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE tournament_views IS 'Tracks when users view tournament details - used for analytics and rate limiting';
COMMENT ON COLUMN tournament_views.tournament_id IS 'Reference to the tournament being viewed';
COMMENT ON COLUMN tournament_views.user_id IS 'User who viewed the tournament (null for anonymous users)';
COMMENT ON COLUMN tournament_views.viewed_at IS 'Timestamp when the tournament was viewed';
COMMENT ON COLUMN tournament_views.ip_address IS 'IP address for anonymous user tracking and spam prevention';
COMMENT ON COLUMN tournament_views.user_agent IS 'Browser/device information for analytics';

-- Display the result to confirm table creation
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tournament_views'
ORDER BY ordinal_position;
