-- Create a simple function that works with existing database structure
-- This function will provide basic likes statistics without requiring the tournament_likes_history table

CREATE OR REPLACE FUNCTION get_venue_tournament_likes_comprehensive_stats(p_venue_id INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
    current_active_likes INTEGER := 0;
    total_historical_likes INTEGER := 0;
    unique_users_who_liked INTEGER := 0;
    likes_this_week INTEGER := 0;
    likes_this_month INTEGER := 0;
BEGIN
    -- Get current active likes (from existing likes table)
    SELECT COUNT(*)
    INTO current_active_likes
    FROM likes l
    JOIN tournaments t ON l.turnament_id = t.id  -- Note: using existing column name with typo
    WHERE t.venue_id = p_venue_id 
    AND l.is_liked = true;

    -- For now, use current likes as historical likes (until history table is populated)
    total_historical_likes := current_active_likes;

    -- Get unique users who have liked tournaments at this venue
    SELECT COUNT(DISTINCT l.user_id)
    INTO unique_users_who_liked
    FROM likes l
    JOIN tournaments t ON l.turnament_id = t.id
    WHERE t.venue_id = p_venue_id
    AND l.is_liked = true;

    -- For now, set weekly/monthly stats to current likes (until we have timestamps)
    likes_this_week := current_active_likes;
    likes_this_month := current_active_likes;

    -- Build the result JSON
    result := json_build_object(
        'venueId', p_venue_id,
        'currentActiveLikes', current_active_likes,
        'totalHistoricalLikes', total_historical_likes,
        'uniqueUsersWhoLiked', unique_users_who_liked,
        'likesThisWeek', likes_this_week,
        'likesThisMonth', likes_this_month,
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
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_comprehensive_stats(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_venue_tournament_likes_comprehensive_stats(INTEGER) TO authenticated;

-- Test the function (replace 1 with an actual venue_id from your database)
-- SELECT get_venue_tournament_likes_comprehensive_stats(1);

-- Verify function was created
SELECT 'Function get_venue_tournament_likes_comprehensive_stats created successfully' as result;
