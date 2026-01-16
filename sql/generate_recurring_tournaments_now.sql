-- Run this to generate recurring tournaments immediately
-- This will ensure all recurring series have at least 4 future tournaments

SELECT * FROM generate_recurring_tournaments();

-- Check the results
SELECT 
  recurring_series_id,
  COUNT(*) as future_tournaments,
  MIN(start_date) as next_tournament,
  MAX(start_date) as last_tournament
FROM tournaments 
WHERE recurring_series_id IS NOT NULL 
  AND start_date >= CURRENT_DATE 
  AND status = 'active'
GROUP BY recurring_series_id
ORDER BY next_tournament;
