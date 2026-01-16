-- Manual Script to Archive Past Tournaments
-- This directly updates the status without using a function

-- Step 1: Check what will be archived
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status,
    is_recurring_master,
    recurring_template_status,
    CURRENT_DATE as today,
    CASE 
        WHEN start_date < CURRENT_DATE THEN '✅ Will be archived'
        ELSE '❌ Future (stays active)'
    END as action
FROM tournaments
WHERE status = 'active'
ORDER BY start_date;

-- Step 2: Manually update status to 'archived' for past tournaments
-- This preserves recurring_template_status
UPDATE tournaments
SET status = 'archived'
WHERE start_date < CURRENT_DATE
AND status = 'active';

-- Step 3: Verify the results
SELECT 
    COUNT(*) as total_tournaments,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_count,
    COUNT(CASE WHEN status = 'archived' AND recurring_template_status = 'active' THEN 1 END) as archived_masters_with_active_template
FROM tournaments;

-- Step 4: Show the archived tournaments
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status,
    is_recurring_master,
    recurring_template_status
FROM tournaments
WHERE status = 'archived'
ORDER BY start_date DESC
LIMIT 10;
