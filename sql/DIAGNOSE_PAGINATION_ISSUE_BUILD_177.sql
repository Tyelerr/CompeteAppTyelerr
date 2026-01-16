-- BUILD 177: Diagnose Pagination Issue
-- Run this in Supabase SQL Editor to see tournament counts

-- 1. Total tournaments (all)
SELECT 'Total tournaments (all)' as description, COUNT(*) as count
FROM tournaments;

-- 2. Recurring master templates (should be EXCLUDED from display)
SELECT 'Recurring master templates (EXCLUDED)' as description, COUNT(*) as count
FROM tournaments
WHERE is_recurring_master = true;

-- 3. Non-master tournaments (should be DISPLAYED)
SELECT 'Non-master tournaments (DISPLAYED)' as description, COUNT(*) as count
FROM tournaments
WHERE is_recurring_master IS NULL OR is_recurring_master = false;

-- 4. Active future non-master tournaments (what regular users see)
SELECT 'Active future non-master (regular users)' as description, COUNT(*) as count
FROM tournaments
WHERE (is_recurring_master IS NULL OR is_recurring_master = false)
  AND status = 'active'
  AND start_date >= CURRENT_DATE;

-- 5. Sample of tournaments showing master status
SELECT 
  id_unique_number,
  tournament_name,
  is_recurring_master,
  status,
  start_date,
  CASE 
    WHEN is_recurring_master = true THEN '🚫 MASTER (hidden)'
    ELSE '✅ DISPLAY'
  END as display_status
FROM tournaments
ORDER BY start_date ASC
LIMIT 30;

-- EXPECTED RESULTS:
-- If there are master templates, they should be excluded from the display count
-- The "Non-master tournaments" count should be > 20 for pagination to appear
-- After the fix, only non-master tournaments will be shown with correct pagination
