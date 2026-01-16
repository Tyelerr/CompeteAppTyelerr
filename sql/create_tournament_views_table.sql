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

-- Add unique constraint to prevent duplicate views within a week
-- This will be handled in application logic instead of DB constraint for flexibility
-- CREATE UNIQUE INDEX idx_tournament_views_weekly_unique ON tournament_views(user_id, tournament_id, date_trunc('week', viewed_at));

-- Add view_count column to tournaments table for quick access
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create function to update tournament view count
CREATE OR REPLACE FUNCTION update_tournament_view_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the view count in tournaments table
    UPDATE tournaments 
    SET view_count = (
        SELECT COUNT(*) 
        FROM tournament_views 
        WHERE tournament_id = NEW.tournament_id
    )
    WHERE id = NEW.tournament_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update view count when new view is added
DROP TRIGGER IF EXISTS trigger_update_tournament_view_count ON tournament_views;
CREATE TRIGGER trigger_update_tournament_view_count
    AFTER INSERT ON tournament_views
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_view_count();

-- Add comments for documentation
COMMENT ON TABLE tournament_views IS 'Tracks when users view tournament details - used for analytics and rate limiting';
COMMENT ON COLUMN tournament_views.tournament_id IS 'Reference to the tournament being viewed';
COMMENT ON COLUMN tournament_views.user_id IS 'User who viewed the tournament (null for anonymous users)';
COMMENT ON COLUMN tournament_views.viewed_at IS 'Timestamp when the tournament was viewed';
COMMENT ON COLUMN tournament_views.ip_address IS 'IP address for anonymous user tracking and spam prevention';
COMMENT ON COLUMN tournament_views.user_agent IS 'Browser/device information for analytics';
COMMENT ON COLUMN tournaments.view_count IS 'Cached count of total views for this tournament';

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

-- Display the result
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('tournament_views', 'tournaments') 
    AND (column_name LIKE '%view%' OR table_name = 'tournament_views')
ORDER BY table_name, ordinal_position;
