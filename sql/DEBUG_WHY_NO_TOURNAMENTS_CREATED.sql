-- Debug: Why is the generator saying "No new tournaments needed"?

-- Step 1: What is today and the horizon target?
SELECT 
    CURRENT_DATE as today,
    CURRENT_DATE + INTERVAL '60 days' as horizon_target;

-- Step 2: For each series, what's the latest ACTIVE tournament date?
SELECT 
    recurring_series_id,
    MAX(CASE WHEN status = 'active' THEN start_date END) as latest_active_date,
    CURRENT_DATE + INTERVAL '60 days' as horizon_target,
    CASE 
        WHEN MAX(CASE WHEN status = 'active' THEN start_date END) >= CURRENT_DATE + INTERVAL '60 days' 
        THEN '✅ Horizon satisfied (has active beyond 60 days)'
        WHEN MAX(CASE WHEN status = 'active' THEN start_date END) < CURRENT_DATE + INTERVAL '60 days'
        THEN '❌ Needs more tournaments'
        ELSE 'No active tournaments'
    END as status,
    MAX(CASE WHEN status = 'active' THEN start_date END) - (CURRENT_DATE + INTERVAL '60 days') as days_beyond_horizon
FROM tournaments
WHERE is_recurring = true
AND is_recurring_master = false
GROUP BY recurring_series_id;

-- Step 3: Show ALL tournaments for each series (active and archived)
SELECT 
    recurring_series_id,
    start_date,
    status,
    CASE 
        WHEN start_date < CURRENT_DATE THEN 'Past'
        WHEN start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + INTERVAL '60 days' THEN 'Within horizon'
        ELSE 'Beyond horizon'
    END as date_category
FROM tournaments
WHERE is_recurring = true
ORDER BY recurring_series_id, start_date;

-- Step 4: Check if there are archived tournaments within the horizon that should be reactivated
SELECT 
    'Archived tournaments that should be active' as issue,
    recurring_series_id,
    start_date,
    status,
    CURRENT_DATE as today,
    CURRENT_DATE + INTERVAL '60 days' as horizon
FROM tournaments
WHERE is_recurring = true
AND status = 'archived'
AND start_date >= CURRENT_DATE
AND start_date < CURRENT_DATE + INTERVAL '60 days'
ORDER BY start_date;
