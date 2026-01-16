-- Test the maintenance system after setup

-- Check if tables and functions were created successfully
SELECT table_name FROM information_schema.tables WHERE table_name = 'tournaments_history';

SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('archive_expired_tournaments', 'generate_recurring_tournaments', 'archive_tournament_manual', 'get_tournament_archival_stats');

-- Check current tournament status
SELECT 
  COUNT(*) as total_tournaments,
  COUNT(CASE WHEN start_date < CURRENT_DATE THEN 1 END) as expired_tournaments,
  COUNT(CASE WHEN recurring_series_id IS NOT NULL THEN 1 END) as recurring_tournaments
FROM tournaments 
WHERE status = 'active';

-- Check recurring series status
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

-- Test the maintenance function manually
SELECT * FROM archive_expired_tournaments();

-- Check statistics
SELECT * FROM get_tournament_archival_stats();

-- View archived tournaments
SELECT tournament_name, start_date, archived_reason, archived_at 
FROM tournaments_history 
ORDER BY archived_at DESC 
LIMIT 10;
