-- Archive Outdated Tournaments Immediately
-- This script will archive the 2 outdated tournaments from October 2025

-- First, let's see what tournaments need to be archived
SELECT 
    id,
    id_unique_number,
    tournament_name,
    start_date,
    status,
    CASE 
        WHEN start_date < CURRENT_DATE THEN 'NEEDS ARCHIVAL'
        ELSE 'CURRENT/FUTURE'
    END as archival_status
FROM tournaments
WHERE start_date < CURRENT_DATE
AND status = 'active'
ORDER BY start_date;

-- Now archive them by calling the function
-- This will archive all tournaments with start_date < today
SELECT * FROM archive_expired_tournaments();

-- Verify the archival worked
SELECT 
    COUNT(*) as remaining_past_tournaments
FROM tournaments
WHERE start_date < CURRENT_DATE
AND status = 'active';

-- Show what's left in active tournaments
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status
FROM tournaments
WHERE status = 'active'
ORDER BY start_date;
