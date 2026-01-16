-- =====================================================
-- CLEANUP ARCHIVED/DELETED TOURNAMENT LIKES
-- =====================================================
-- This script removes user likes for tournaments that have been:
-- 1. Archived (moved to tournaments_archive table)
-- 2. Deleted (status = 'deleted')
-- 3. Passed (start_date is in the past)
-- =====================================================

-- Step 1: Check current state - how many likes exist for archived/deleted tournaments
SELECT 
    'Likes for archived tournaments' as category,
    COUNT(*) as count
FROM public.likes l
WHERE l.turnament_id IN (
    SELECT id FROM public.tournaments_archive
)

UNION ALL

SELECT 
    'Likes for deleted tournaments' as category,
    COUNT(*) as count
FROM public.likes l
WHERE l.turnament_id IN (
    SELECT id FROM public.tournaments WHERE status = 'deleted'
)

UNION ALL

SELECT 
    'Likes for past tournaments (>7 days old)' as category,
    COUNT(*) as count
FROM public.likes l
WHERE l.turnament_id IN (
    SELECT id 
    FROM public.tournaments 
    WHERE start_date < (CURRENT_DATE - INTERVAL '7 days')
);

-- Step 2: Delete likes for tournaments in the archive table
DELETE FROM public.likes
WHERE turnament_id IN (
    SELECT id FROM public.tournaments_archive
);

-- Step 3: Delete likes for tournaments with 'deleted' status
DELETE FROM public.likes
WHERE turnament_id IN (
    SELECT id FROM public.tournaments WHERE status = 'deleted'
);

-- Step 4: (OPTIONAL) Delete likes for tournaments that have passed (older than 7 days)
-- Uncomment the following if you want to remove likes for past tournaments
/*
DELETE FROM public.likes
WHERE turnament_id IN (
    SELECT id 
    FROM public.tournaments 
    WHERE start_date < (CURRENT_DATE - INTERVAL '7 days')
);
*/

-- Step 5: Verify cleanup - check remaining likes
SELECT 
    COUNT(*) as total_remaining_likes
FROM public.likes;

-- Step 6: Show sample of remaining likes with tournament details
SELECT 
    l.id as like_id,
    l.user_id,
    l.turnament_id,
    t.tournament_name,
    t.start_date,
    t.status
FROM public.likes l
LEFT JOIN public.tournaments t ON l.turnament_id = t.id
ORDER BY t.start_date DESC
LIMIT 20;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check for any orphaned likes (likes where tournament doesn't exist)
SELECT 
    COUNT(*) as orphaned_likes_count
FROM public.likes l
WHERE NOT EXISTS (
    SELECT 1 FROM public.tournaments t WHERE t.id = l.turnament_id
)
AND NOT EXISTS (
    SELECT 1 FROM public.tournaments_archive ta WHERE ta.id = l.turnament_id
);

-- If orphaned likes exist, you can delete them with:
/*
DELETE FROM public.likes
WHERE NOT EXISTS (
    SELECT 1 FROM public.tournaments t WHERE t.id = turnament_id
)
AND NOT EXISTS (
    SELECT 1 FROM public.tournaments_archive ta WHERE ta.id = turnament_id
);
*/
