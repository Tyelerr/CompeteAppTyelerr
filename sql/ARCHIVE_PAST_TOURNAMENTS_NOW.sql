-- Archive All Past Tournaments
-- This will run the archive function to move past tournaments to the archive

-- Step 1: First, let's see what will be archived
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status,
    is_recurring_master,
    recurring_template_status,
    CASE 
        WHEN is_recurring_master = true THEN '⚠️ MASTER (will preserve template status)'
        ELSE 'Regular tournament'
    END as tournament_type
FROM tournaments
WHERE start_date < CURRENT_DATE
AND status = 'active'
ORDER BY start_date DESC;

-- Step 2: Run the archive function
-- This will archive all past tournaments (including masters)
-- But it will preserve recurring_template_status for masters
SELECT * FROM archive_expired_tournaments();

-- Step 3: Verify what's left active
SELECT 
    COUNT(*) as active_tournaments_remaining,
    COUNT(CASE WHEN is_recurring_master = true THEN 1 END) as active_masters_remaining,
    COUNT(CASE WHEN start_date >= CURRENT_DATE THEN 1 END) as future_tournaments
FROM tournaments
WHERE status = 'active';

-- Step 4: Check archived tournaments (recent ones)
SELECT 
    COUNT(*) as total_in_archive,
    COUNT(CASE WHEN is_recurring_master = true THEN 1 END) as masters_in_archive
FROM tournaments_archive;
