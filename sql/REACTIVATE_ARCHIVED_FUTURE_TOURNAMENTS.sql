-- Reactivate Archived Future Tournaments
-- If tournaments were archived but their date is still in the future, reactivate them

-- Step 1: Check which archived tournaments are in the future
SELECT 
    id_unique_number,
    tournament_name,
    recurring_series_id,
    start_date,
    status,
    CURRENT_DATE as today,
    CASE 
        WHEN start_date >= CURRENT_DATE THEN '⚠️ Should be ACTIVE (future tournament)'
        ELSE 'OK (past tournament)'
    END as recommendation
FROM tournaments
WHERE status = 'archived'
AND start_date >= CURRENT_DATE
ORDER BY start_date;

-- Step 2: Reactivate future tournaments that were incorrectly archived
UPDATE tournaments
SET status = 'active'
WHERE status = 'archived'
AND start_date >= CURRENT_DATE;

-- Step 3: Verify the fix
SELECT 
    COUNT(*) as total_tournaments,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_count,
    COUNT(CASE WHEN status = 'active' AND start_date >= CURRENT_DATE THEN 1 END) as active_future,
    COUNT(CASE WHEN status = 'archived' AND start_date < CURRENT_DATE THEN 1 END) as archived_past
FROM tournaments;

-- Step 4: Show the series breakdown after reactivation
SELECT 
    recurring_series_id,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
    COUNT(CASE WHEN status = 'active' AND start_date >= CURRENT_DATE THEN 1 END) as active_future,
    MAX(CASE WHEN status = 'active' THEN start_date END) as latest_active_date,
    MAX(CASE WHEN is_recurring_master = true THEN recurring_template_status END) as template_status
FROM tournaments
WHERE is_recurring = true
GROUP BY recurring_series_id
ORDER BY recurring_series_id;
