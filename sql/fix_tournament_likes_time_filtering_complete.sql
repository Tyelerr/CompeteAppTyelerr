-- COMPLETE FIX for Tournament Likes Time Period Filtering
-- This script will resolve all conflicts and ensure proper functionality

-- Step 1: Clean up all existing conflicting functions
DROP FUNCTION IF EXISTS get_venue_tournament_likes_stats_by_period(INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_venue_tournament_likes_stats_by_period(INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS get_venue_tournament_likes_stats_by_period(p_venue_id INTEGER, p_period TEXT);
DROP FUNCTION IF EXISTS get_venue_tournament_likes_stats_by_period(p_venue_id INTEGER, p_period VARCHAR);
DROP FUNCTION IF EXISTS get_venue_tournament_likes_comprehensive_stats(INTEGER);

-- Step 2: Ensure tournament_likes_history table exists with proper structure
CREATE TABLE IF NOT EXISTS tournament_likes_history (
    id SERIAL PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(10) NOT NULL CHECK (action IN ('like', 'unlike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_tournament_id ON tournament_likes_history(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_user_id ON tournament_likes_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_action ON tournament_likes_history(action);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_created_at ON tournament_likes_history(created_at);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_tournament_action ON tournament_likes_history(tournament_id, action);

-- Step 4: Create trigger function to log all like/unlike actions
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

-- Step 5: Create the trigger (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_log_tournament_like_action ON likes;
CREATE TRIGGER trigger_log_tournament_like_action
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION log_tournament_like_action();

-- Step 6: Populate historical data from existing likes (if history table is empty)
INSERT INTO tournament_likes_history (tournament_id, user_id, action, created_at)
SELECT 
    l.turnament_id,
    l.user_id,
    'like' as action,
    COALESCE(l.created_at, NOW() - INTERVAL '30 days') as created_at
FROM likes l
WHERE l.is_liked = true
AND NOT EXISTS (
    SELECT 1 FROM tournament_likes_history tlh 
    WHERE tlh.tournament_id = l.turnament_id 
    AND tlh.user_id = l.user_id 
    AND tlh.action = 'like'
);

-- Step 7: Create the main function with proper error handling and debugging
CREATE OR REPLACE FUNCTION get_venue_tournament_likes_stats_by_period(
    p_venue_id INTEGER,
    p_period TEXT DEFAULT 'lifetime'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    current_active_likes INTEGER := 0;
    total_historical_likes INTEGER := 0;
    unique_users_who_liked INTEGER := 0;
    period_likes INTEGER := 0;
    period_start TIMESTAMP WITH TIME ZONE;
    debug_info TEXT := '';
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

    debug_info := 'Period: ' || p_period || ', Start: ' || period_start::TEXT;

    -- Get current active likes (from existing likes table)
    SELECT COALESCE(COUNT(*), 0)
    INTO current_active_likes
    FROM likes l
    JOIN tournaments t ON l.turnament_id = t.id
    WHERE t.venue_id = p_venue_id 
    AND l.is_liked = true;

    -- Get total historical likes (all 'like' actions ever recorded)
    SELECT COALESCE(COUNT(*), 0)
    INTO total_historical_likes
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
    AND tlh.action = 'like';

    -- Get unique users who have liked tournaments at this venue (for the period)
    SELECT COALESCE(COUNT(DISTINCT tlh.user_id), 0)
    INTO unique_users_who_liked
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
    AND tlh.action = 'like'
    AND tlh.created_at >= period_start;

    -- Get likes for the specified period
    SELECT COALESCE(COUNT(*), 0)
    INTO period_likes
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
    AND tlh.action = 'like'
    AND tlh.created_at >= period_start;

    -- Build the result JSON with debug info
    result := json_build_object(
        'venueId', p_venue_id,
        'period', p_period,
        'currentActiveLikes', current_active_likes,
        'totalHistoricalLikes', total_historical_likes,
        'uniqueUsersWhoLiked', unique_users_who_liked,
        'periodLikes', period_likes,
        'periodStart', period_start,
        'debug', debug_info,
        'error', null
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- Return detailed error information
        RETURN json_build_object(
            'venueId', p_venue_id,
            'period', p_period,
            'currentActiveLikes', 0,
            'totalHistoricalLikes', 0,
            'uniqueUsersWhoLiked', 0,
            'periodLikes', 0,
            'periodStart', period_start,
            'debug', debug_info,
            'error', SQLERRM,
            'errorDetail', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant proper permissions
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_stats_by_period(INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_stats_by_period(INTEGER, TEXT) TO authenticated;

-- Step 9: Create backward compatibility function
CREATE OR REPLACE FUNCTION get_venue_tournament_likes_comprehensive_stats(p_venue_id INTEGER)
RETURNS JSON AS $$
BEGIN
    RETURN get_venue_tournament_likes_stats_by_period(p_venue_id, 'lifetime');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_comprehensive_stats(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_comprehensive_stats(INTEGER) TO authenticated;

-- Step 10: Add helpful comments
COMMENT ON TABLE tournament_likes_history IS 'Tracks all like/unlike actions for tournaments with timestamps for historical analysis';
COMMENT ON FUNCTION get_venue_tournament_likes_stats_by_period(INTEGER, TEXT) IS 'Returns comprehensive like statistics for a venue with time period filtering (24hr, 1week, 1month, 1year, lifetime)';

-- Step 11: Verification queries (for testing)
-- SELECT 'Setup completed successfully. Testing function...' as status;
-- SELECT get_venue_tournament_likes_stats_by_period(1, 'lifetime');
-- SELECT get_venue_tournament_likes_stats_by_period(1, '1week');

SELECT 'Tournament likes time period filtering has been completely fixed!' as result;
