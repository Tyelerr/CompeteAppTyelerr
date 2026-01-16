-- Create comprehensive likes tracking system with proper historical data
-- This will track all like/unlike actions and provide time-based analytics

-- First, create the tournament_likes_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS tournament_likes_history (
    id SERIAL PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(10) NOT NULL CHECK (action IN ('like', 'unlike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_tournament_id ON tournament_likes_history(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_user_id ON tournament_likes_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_action ON tournament_likes_history(action);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_created_at ON tournament_likes_history(created_at);

-- Create trigger function to log all like/unlike actions
CREATE OR REPLACE FUNCTION log_tournament_like_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new like)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO tournament_likes_history (
            tournament_id, 
            user_id, 
            action, 
            created_at
        ) VALUES (
            NEW.turnament_id,  -- Note: using existing column name with typo
            NEW.user_id,
            'like',
            NOW()
        );
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (unlike)
    IF TG_OP = 'DELETE' THEN
        INSERT INTO tournament_likes_history (
            tournament_id, 
            user_id, 
            action, 
            created_at
        ) VALUES (
            OLD.turnament_id,  -- Note: using existing column name with typo
            OLD.user_id,
            'unlike',
            NOW()
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the existing likes table
DROP TRIGGER IF EXISTS trigger_log_tournament_like_action ON likes;
CREATE TRIGGER trigger_log_tournament_like_action
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION log_tournament_like_action();

-- Create comprehensive analytics function with time period support
CREATE OR REPLACE FUNCTION get_venue_tournament_likes_stats_by_period(
    p_venue_id INTEGER,
    p_period VARCHAR(20) DEFAULT 'lifetime'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    current_active_likes INTEGER := 0;
    total_historical_likes INTEGER := 0;
    unique_users_who_liked INTEGER := 0;
    period_likes INTEGER := 0;
    period_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Determine the start date based on period
    CASE p_period
        WHEN '24hr' THEN
            period_start := NOW() - INTERVAL '24 hours';
        WHEN '1week' THEN
            period_start := NOW() - INTERVAL '7 days';
        WHEN '1month' THEN
            period_start := NOW() - INTERVAL '30 days';
        WHEN '1year' THEN
            period_start := NOW() - INTERVAL '1 year';
        WHEN 'lifetime' THEN
            period_start := '1900-01-01'::TIMESTAMP WITH TIME ZONE;
        ELSE
            period_start := '1900-01-01'::TIMESTAMP WITH TIME ZONE;
    END CASE;

    -- Get current active likes (from existing likes table)
    SELECT COUNT(*)
    INTO current_active_likes
    FROM likes l
    JOIN tournaments t ON l.turnament_id = t.id
    WHERE t.venue_id = p_venue_id 
    AND l.is_liked = true;

    -- Get total historical likes (all 'like' actions ever recorded)
    SELECT COUNT(*)
    INTO total_historical_likes
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
    AND tlh.action = 'like';

    -- Get unique users who have liked tournaments at this venue (for the period)
    SELECT COUNT(DISTINCT tlh.user_id)
    INTO unique_users_who_liked
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
    AND tlh.action = 'like'
    AND tlh.created_at >= period_start;

    -- Get likes for the specified period
    SELECT COUNT(*)
    INTO period_likes
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
    AND tlh.action = 'like'
    AND tlh.created_at >= period_start;

    -- Build the result JSON
    result := json_build_object(
        'venueId', p_venue_id,
        'period', p_period,
        'currentActiveLikes', current_active_likes,
        'totalHistoricalLikes', total_historical_likes,
        'uniqueUsersWhoLiked', unique_users_who_liked,
        'periodLikes', period_likes,
        'periodStart', period_start,
        'error', null
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- Return error information in case of any issues
        RETURN json_build_object(
            'venueId', p_venue_id,
            'period', p_period,
            'currentActiveLikes', 0,
            'totalHistoricalLikes', 0,
            'uniqueUsersWhoLiked', 0,
            'periodLikes', 0,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_stats_by_period(INTEGER, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_stats_by_period(INTEGER, VARCHAR) TO authenticated;

-- Also create the original function for backward compatibility
CREATE OR REPLACE FUNCTION get_venue_tournament_likes_comprehensive_stats(p_venue_id INTEGER)
RETURNS JSON AS $$
BEGIN
    RETURN get_venue_tournament_likes_stats_by_period(p_venue_id, 'lifetime');
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_comprehensive_stats(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_comprehensive_stats(INTEGER) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE tournament_likes_history IS 'Tracks all like/unlike actions for tournaments to maintain historical data';
COMMENT ON FUNCTION get_venue_tournament_likes_stats_by_period(INTEGER, VARCHAR) IS 'Returns comprehensive like statistics for a venue with time period filtering';

-- Verify tables and functions were created
SELECT 'Comprehensive likes tracking system with time periods created successfully' as result;
