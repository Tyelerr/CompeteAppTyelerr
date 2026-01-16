-- Find the ACTUAL latest active date for each series

SELECT 
    recurring_series_id,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
    MAX(start_date) FILTER (WHERE status = 'active') as latest_active_date,
    MAX(start_date) FILTER (WHERE status = 'archived') as latest_archived_date,
    MAX(start_date) as absolute_latest_date,
    CURRENT_DATE + INTERVAL '60 days' as horizon_target,
    CASE 
        WHEN MAX(start_date) FILTER (WHERE status = 'active') >= CURRENT_DATE + INTERVAL '60 days'
        THEN '✅ Horizon satisfied'
        ELSE '❌ Needs more tournaments'
    END as status
FROM tournaments
WHERE is_recurring = true
AND is_recurring_master = false
GROUP BY recurring_series_id
ORDER BY recurring_series_id;
