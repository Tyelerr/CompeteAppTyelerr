-- Test script to verify venue performance data and time period filtering
-- Run this after inserting the mock data to see expected results

-- 1. Check venues and their tournaments
SELECT 
    v.id as venue_id,
    v.venue as venue_name,
    COUNT(t.id) as tournament_count
FROM venues v
LEFT JOIN tournaments t ON v.id = t.venue_id
WHERE v.venue IN ('The Pool Hall', 'Billiards Central', 'Corner Pocket Bar')
GROUP BY v.id, v.venue
ORDER BY v.venue;

-- 2. Check tournament likes by time period
WITH time_periods AS (
    SELECT 
        t.id as tournament_id,
        t.tournament_name,
        t.venue,
        t.created_at as tournament_created,
        COUNT(CASE WHEN l.created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as likes_24hr,
        COUNT(CASE WHEN l.created_at >= NOW() - INTERVAL '1 week' THEN 1 END) as likes_1week,
        COUNT(CASE WHEN l.created_at >= NOW() - INTERVAL '1 month' THEN 1 END) as likes_1month,
        COUNT(l.id) as likes_lifetime
    FROM tournaments t
    LEFT JOIN likes l ON t.id = l.turnament_id AND l.is_liked = true
    WHERE t.id_unique_number BETWEEN 1001 AND 1006
    GROUP BY t.id, t.tournament_name, t.venue, t.created_at
    ORDER BY t.id_unique_number
)
SELECT * FROM time_periods;

-- 3. Test the venue performance function for each time period
SELECT 
    'Last 24 Hours' as period,
    venue_id,
    venue_name,
    current_likes,
    historical_likes,
    period_likes,
    unique_users
FROM (
    SELECT 
        v.id as venue_id,
        v.venue as venue_name,
        COALESCE(SUM(
            CASE WHEN l.created_at >= NOW() - INTERVAL '1 day' 
            THEN 1 ELSE 0 END
        ), 0) as current_likes,
        COUNT(l.id) as historical_likes,
        COALESCE(SUM(
            CASE WHEN l.created_at >= NOW() - INTERVAL '1 day' 
            THEN 1 ELSE 0 END
        ), 0) as period_likes,
        COUNT(DISTINCT l.user_id) as unique_users
    FROM venues v
    LEFT JOIN tournaments t ON v.id = t.venue_id
    LEFT JOIN likes l ON t.id = l.turnament_id AND l.is_liked = true
    WHERE v.venue IN ('The Pool Hall', 'Billiards Central', 'Corner Pocket Bar')
    GROUP BY v.id, v.venue
) results

UNION ALL

SELECT 
    'Last Week' as period,
    venue_id,
    venue_name,
    current_likes,
    historical_likes,
    period_likes,
    unique_users
FROM (
    SELECT 
        v.id as venue_id,
        v.venue as venue_name,
        COALESCE(SUM(
            CASE WHEN l.created_at >= NOW() - INTERVAL '1 week' 
            THEN 1 ELSE 0 END
        ), 0) as current_likes,
        COUNT(l.id) as historical_likes,
        COALESCE(SUM(
            CASE WHEN l.created_at >= NOW() - INTERVAL '1 week' 
            THEN 1 ELSE 0 END
        ), 0) as period_likes,
        COUNT(DISTINCT l.user_id) as unique_users
    FROM venues v
    LEFT JOIN tournaments t ON v.id = t.venue_id
    LEFT JOIN likes l ON t.id = l.turnament_id AND l.is_liked = true
    WHERE v.venue IN ('The Pool Hall', 'Billiards Central', 'Corner Pocket Bar')
    GROUP BY v.id, v.venue
) results

UNION ALL

SELECT 
    'Last Month' as period,
    venue_id,
    venue_name,
    current_likes,
    historical_likes,
    period_likes,
    unique_users
FROM (
    SELECT 
        v.id as venue_id,
        v.venue as venue_name,
        COALESCE(SUM(
            CASE WHEN l.created_at >= NOW() - INTERVAL '1 month' 
            THEN 1 ELSE 0 END
        ), 0) as current_likes,
        COUNT(l.id) as historical_likes,
        COALESCE(SUM(
            CASE WHEN l.created_at >= NOW() - INTERVAL '1 month' 
            THEN 1 ELSE 0 END
        ), 0) as period_likes,
        COUNT(DISTINCT l.user_id) as unique_users
    FROM venues v
    LEFT JOIN tournaments t ON v.id = t.venue_id
    LEFT JOIN likes l ON t.id = l.turnament_id AND l.is_liked = true
    WHERE v.venue IN ('The Pool Hall', 'Billiards Central', 'Corner Pocket Bar')
    GROUP BY v.id, v.venue
) results

ORDER BY period, venue_name;

-- 4. Summary of expected results
SELECT 
    'EXPECTED RESULTS SUMMARY' as info,
    '========================' as separator;

SELECT 
    'Time Period' as period,
    'Expected Total Likes' as expected_likes,
    'Description' as description
UNION ALL
SELECT '24 Hours', '5', 'Only tournament 1001 likes'
UNION ALL
SELECT '1 Week', '11', 'Tournaments 1001, 1002, 1003 likes'
UNION ALL
SELECT '1 Month', '18', 'Tournaments 1001-1005 likes'
UNION ALL
SELECT 'Lifetime', '23', 'All tournaments 1001-1006 likes';
