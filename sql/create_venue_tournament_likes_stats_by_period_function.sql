-- Create function to get venue tournament likes statistics by time period
-- This function provides likes data filtered by specific time periods (24hr, 1week, 1month, 1year, lifetime)

CREATE OR REPLACE FUNCTION get_venue_tournament_likes_stats_by_period(
    p_venue_id INTEGER,
    p_period TEXT DEFAULT 'lifetime'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    period_start TIMESTAMP;
    current_active_likes INTEGER := 0;
    total_historical_likes INTEGER := 0;
    period_likes INTEGER := 0;
    unique_users_count INTEGER := 0;
BEGIN
    -- Calculate period start time based on the period parameter
    CASE p_period
        WHEN '24hr' THEN
            period_start := NOW() - INTERVAL '24 hours';
        WHEN '1week' THEN
            period_start := NOW() - INTERVAL '1 week';
        WHEN '1month' THEN
            period_start := NOW() - INTERVAL '1 month';
        WHEN '1year' THEN
            period_start := NOW() - INTERVAL '1 year';
        WHEN 'lifetime' THEN
            period_start := '1900-01-01'::TIMESTAMP; -- Very old date to include all records
        ELSE
            period_start := '1900-01-01'::TIMESTAMP; -- Default to lifetime
    END CASE;

    -- Get current active likes (tournaments that are currently liked)
    SELECT COALESCE(COUNT(*), 0)
    INTO current_active_likes
    FROM tournament_likes tl
    INNER JOIN tournaments t ON tl.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
      AND tl.is_active = true;

    -- Get total historical likes (all likes ever, including inactive ones)
    SELECT COALESCE(COUNT(*), 0)
    INTO total_historical_likes
    FROM tournament_likes_history tlh
    INNER JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id;

    -- Get likes for the specific period from history table
    SELECT COALESCE(COUNT(*), 0)
    INTO period_likes
    FROM tournament_likes_history tlh
    INNER JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
      AND tlh.liked_at >= period_start;

    -- Get unique users who liked tournaments in this venue (from history)
    SELECT COALESCE(COUNT(DISTINCT tlh.user_id), 0)
    INTO unique_users_count
    FROM tournament_likes_history tlh
    INNER JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id;

    -- Build the result JSON
    result := json_build_object(
        'currentActiveLikes', current_active_likes,
        'totalHistoricalLikes', total_historical_likes,
        'periodLikes', period_likes,
        'uniqueUsersWhoLiked', unique_users_count,
        'period', p_period,
        'venueId', p_venue_id
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- Return error information in case of failure
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'currentActiveLikes', 0,
            'totalHistoricalLikes', 0,
            'periodLikes', 0,
            'uniqueUsersWhoLiked', 0,
            'period', p_period,
            'venueId', p_venue_id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_stats_by_period(INTEGER, TEXT) TO authenticated;

-- Test the function (optional - you can remove these lines after testing)
-- SELECT get_venue_tournament_likes_stats_by_period(1, '1week');
-- SELECT get_venue_tournament_likes_stats_by_period(1, 'lifetime');
