-- Archive the Remaining Past Tournament (2026-01-06)
-- Since today is 2026-01-08, this tournament should be archived

-- First, verify it exists and should be archived
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status,
    is_recurring_master,
    recurring_template_status,
    CURRENT_DATE as today,
    CASE 
        WHEN start_date < CURRENT_DATE THEN '✅ Should be archived'
        ELSE '❌ Future tournament'
    END as should_archive
FROM tournaments
WHERE start_date = '2026-01-06';

-- Run the archive function again to catch this tournament
SELECT * FROM archive_expired_tournaments();

-- Verify it was archived
SELECT 
    COUNT(*) as remaining_active_tournaments
FROM tournaments
WHERE status = 'active';

-- Check if it's now in the archive
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    is_recurring_master,
    recurring_template_status,
    removal_date
FROM tournaments_archive
WHERE start_date = '2026-01-06';
