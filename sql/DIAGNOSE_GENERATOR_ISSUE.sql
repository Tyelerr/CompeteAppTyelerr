-- Diagnostic Script: Why Generator Isn't Creating New Tournaments
-- Run this to understand what's blocking generation

-- Step 1: Check masters being detected
SELECT 
    'Masters detected by generator' as check_name,
    id_unique_number,
    tournament_name,
    recurring_series_id,
    status as instance_status,
    recurring_template_status as template_status,
    start_date
FROM tournaments
WHERE is_recurring_master = true
AND is_recurring = true
AND recurring_template_status = 'active';

-- Step 2: For each series, what's the latest ACTIVE child?
SELECT 
    'Latest ACTIVE child per series' as check_name,
    recurring_series_id,
    MAX(start_date) as latest_active_child_date,
    CURRENT_DATE as today,
    CURRENT_DATE + INTERVAL '60 days' as horizon_target,
    CASE 
        WHEN MAX(start_date) >= CURRENT_DATE + INTERVAL '60 days' THEN '✅ Horizon satisfied (has active beyond 60 days)'
        ELSE '❌ Needs more tournaments'
    END as status
FROM tournaments
WHERE is_recurring = true
AND is_recurring_master = false
AND status = 'active'
GROUP BY recurring_series_id;

-- Step 3: Do we have ARCHIVED future tournaments blocking generation?
SELECT 
    'Archived FUTURE tournaments (should be active)' as check_name,
    id_unique_number,
    tournament_name,
    recurring_series_id,
    start_date,
    status,
    CASE 
        WHEN start_date >= CURRENT_DATE THEN '⚠️ This should be ACTIVE, not archived!'
        ELSE 'OK (past tournament)'
    END as issue
FROM tournaments
WHERE is_recurring = true
AND status = 'archived'
AND start_date >= CURRENT_DATE
ORDER BY start_date;

-- Step 4: Check for unique constraint
SELECT 
    'Unique constraint check' as check_name,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'tournaments'
AND indexname LIKE '%recurring%';

-- Step 5: Full series breakdown
SELECT 
    recurring_series_id,
    COUNT(*) as total,
    COUNT(CASE WHEN is_recurring_master = true THEN 1 END) as masters,
    COUNT(CASE WHEN is_recurring_master = false THEN 1 END) as children,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
    COUNT(CASE WHEN status = 'active' AND start_date >= CURRENT_DATE THEN 1 END) as active_future,
    COUNT(CASE WHEN status = 'archived' AND start_date >= CURRENT_DATE THEN 1 END) as archived_future,
    MAX(CASE WHEN status = 'active' THEN start_date END) as latest_active_date,
    MAX(CASE WHEN is_recurring_master = true THEN recurring_template_status END) as template_status
FROM tournaments
WHERE is_recurring = true
GROUP BY recurring_series_id
ORDER BY recurring_series_id;
