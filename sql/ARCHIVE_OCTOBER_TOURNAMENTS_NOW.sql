-- IMMEDIATE FIX: Archive the 2 outdated October 2025 tournaments
-- Copy and paste this entire script into Supabase SQL Editor and click "Run"

-- Step 1: Show which tournaments will be archived
SELECT 
    id,
    id_unique_number,
    tournament_name,
    start_date,
    status,
    'WILL BE ARCHIVED' as action
FROM tournaments
WHERE start_date < CURRENT_DATE
AND status = 'active'
ORDER BY start_date;

-- Step 2: Archive all past tournaments by calling the function
SELECT * FROM archive_expired_tournaments();

-- Step 3: Verify the archival worked - should return 0
SELECT 
    COUNT(*) as remaining_past_tournaments,
    'Should be 0' as expected
FROM tournaments
WHERE start_date < CURRENT_DATE
AND status = 'active';

-- Step 4: Show what's left in active tournaments (should only be future tournaments)
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status,
    'ACTIVE TOURNAMENT' as status_label
FROM tournaments
WHERE status = 'active'
ORDER BY start_date;

-- Step 5: Show the newly archived tournaments
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    archived_reason,
    archived_at,
    'NEWLY ARCHIVED' as status_label
FROM tournaments_history
WHERE archived_at >= CURRENT_DATE
ORDER BY archived_at DESC;
