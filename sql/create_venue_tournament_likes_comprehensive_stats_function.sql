-- Create comprehensive tournament likes statistics function for venues
-- This function provides detailed analytics about tournament likes for a specific venue

CREATE OR REPLACE FUNCTION get_venue_tournament_likes_comprehensive_stats(p_venue_id INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
    current_active_likes INTEGER := 0;
    total_historical_likes INTEGER := 0;
    unique_users_who_liked INTEGER := 0;
    likes_this_week INTEGER := 0;
    likes_this_month INTEGER := 0;
    avg_likes_per_tournament DECIMAL := 0;
    most_liked_tournament_id INTEGER;
    most_liked_tournament_name TEXT;
    most_liked_tournament_likes INTEGER := 0;
BEGIN
    -- Get current active likes (tournaments currently liked)
    SELECT COUNT(*)
    INTO current_active_likes
    FROM tournament_likes tl
    JOIN tournaments t ON tl.tournament_id = t.id
    WHERE t.venue_id = p_venue_id 
    AND tl.is_active = true;

    -- Get total historical likes (all likes ever, including removed ones)
    SELECT COUNT(*)
    INTO total_historical_likes
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id;

    -- Get unique users who have liked tournaments at this venue
    SELECT COUNT(DISTINCT tlh.user_id)
    INTO unique_users_who_liked
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id;

    -- Get likes from this week (last 7 days)
    SELECT COUNT(*)
    INTO likes_this_week
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
    AND tlh.liked_at >= NOW() - INTERVAL '7 days';

    -- Get likes from this month (last 30 days)
    SELECT COUNT(*)
    INTO likes_this_month
    FROM tournament_likes_history tlh
    JOIN tournaments t ON tlh.tournament_id = t.id
    WHERE t.venue_id = p_venue_id
    AND tlh.liked_at >= NOW() - INTERVAL '30 days';

    -- Calculate average likes per tournament
    SELECT COALESCE(AVG(tournament_likes), 0)
    INTO avg_likes_per_tournament
    FROM (
        SELECT COUNT(tlh.id) as tournament_likes
        FROM tournaments t
        LEFT JOIN tournament_likes_history tlh ON t.id = tlh.tournament_id
        WHERE t.venue_id = p_venue_id
        GROUP BY t.id
    ) as tournament_stats;

    -- Get most liked tournament info
    SELECT t.id, t.tournament_name, COUNT(tlh.id)
    INTO most_liked_tournament_id, most_liked_tournament_name, most_liked_tournament_likes
    FROM tournaments t
    LEFT JOIN tournament_likes_history tlh ON t.id = tlh.tournament_id
    WHERE t.venue_id = p_venue_id
    GROUP BY t.id, t.tournament_name
    ORDER BY COUNT(tlh.id) DESC
    LIMIT 1;

    -- Build the result JSON
    result := json_build_object(
        'venueId', p_venue_id,
        'currentActiveLikes', current_active_likes,
        'totalHistoricalLikes', total_historical_likes,
        'uniqueUsersWhoLiked', unique_users_who_liked,
        'likesThisWeek', likes_this_week,
        'likesThisMonth', likes_this_month,
        'averageLikesPerTournament', ROUND(avg_likes_per_tournament, 2),
        'mostLikedTournament', json_build_object(
            'id', COALESCE(most_liked_tournament_id, 0),
            'name', COALESCE(most_liked_tournament_name, 'No tournaments'),
            'totalLikes', most_liked_tournament_likes
        ),
        'error', null
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- Return error information in case of any issues
        RETURN json_build_object(
            'venueId', p_venue_id,
            'currentActiveLikes', 0,
            'totalHistoricalLikes', 0,
            'uniqueUsersWhoLiked', 0,
            'likesThisWeek', 0,
            'likesThisMonth', 0,
            'averageLikesPerTournament', 0,
            'mostLikedTournament', json_build_object(
                'id', 0,
                'name', 'Error loading data',
                'totalLikes', 0
            ),
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_comprehensive_stats(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_comprehensive_stats(INTEGER) TO authenticated;

-- Test the function with a sample call (replace 1 with an actual venue_id)
-- SELECT get_venue_tournament_likes_comprehensive_stats(1);
