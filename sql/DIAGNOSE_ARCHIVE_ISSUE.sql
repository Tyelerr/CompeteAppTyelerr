-- Diagnose Why Only 1 Tournament Was Archived

-- Step 1: Check what's currently in the main tournaments table
SELECT 
    COUNT(*) as total_active_tournaments,
    COUNT(CASE WHEN start_date < CURRENT_DATE THEN 1 END) as past_tournaments_still_active,
    COUNT(CASE WHEN start_date >= CURRENT_DATE THEN 1 END) as future_tournaments,
    CURRENT_DATE as today
FROM tournaments
WHERE status = 'active';

-- Step 2: List all past tournaments that should be archived
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status,
    is_recurring_master,
    recurring_template_status,
    CURRENT_DATE as today,
    (CURRENT_DATE - start_date) as days_past
FROM tournaments
WHERE start_date < CURRENT_DATE
AND status = 'active'
ORDER BY start_date;

-- Step 3: Check what's in the archive
SELECT 
    COUNT(*) as total_in_archive,
    MIN(start_date) as oldest_archived,
    MAX(start_date) as newest_archived
FROM tournaments_archive;

-- Step 4: Check if there are tournaments with different dates
SELECT 
    start_date,
    COUNT(*) as count,
    COUNT(CASE WHEN is_recurring_master = true THEN 1 END) as masters
FROM tournaments
WHERE status = 'active'
GROUP BY start_date
ORDER BY start_date;
