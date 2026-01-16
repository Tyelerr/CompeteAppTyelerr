-- Diagnose Recurring Tournament Issue
-- Check if the persisting tournaments are part of a recurring series

-- Step 1: Check the 2 remaining tournaments and their recurring info
SELECT 
    id,
    id_unique_number,
    tournament_name,
    start_date,
    status,
    is_recurring,
    recurring_series_id,
    is_recurring_master,
    'CURRENT ACTIVE' as label
FROM tournaments
WHERE status = 'active'
ORDER BY start_date;

-- Step 2: Check if there are any recurring series
SELECT 
    recurring_series_id,
    COUNT(*) as tournament_count,
    MIN(start_date) as earliest_date,
    MAX(start_date) as latest_date,
    ARRAY_AGG(id_unique_number ORDER BY start_date) as tournament_ids
FROM tournaments
WHERE recurring_series_id IS NOT NULL
GROUP BY recurring_series_id;

-- Step 3: Check tournaments_history for this series
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    recurring_series_id,
    is_recurring_master,
    archived_reason,
    archived_at,
    'ARCHIVED' as label
FROM tournaments_history
WHERE tournament_name LIKE '%metro chip%'
ORDER BY start_date DESC
LIMIT 10;

-- Step 4: Check if archival function is regenerating tournaments
-- This shows what the generate_recurring_tournaments function would do
SELECT 
    recurring_series_id,
    COUNT(*) as current_future_count,
    CASE 
        WHEN COUNT(*) < 4 THEN 'WILL GENERATE NEW TOURNAMENTS'
        ELSE 'NO ACTION NEEDED'
    END as action
FROM tournaments 
WHERE recurring_series_id IS NOT NULL 
AND start_date >= CURRENT_DATE
AND status = 'active'
GROUP BY recurring_series_id;
