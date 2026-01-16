-- Comprehensive cleanup script to remove all mock tournaments and test data
-- This script will clean up the database to show only real tournament data

-- Step 1: Delete all likes referencing mock tournaments to avoid foreign key constraint errors
DELETE FROM public.likes WHERE turnament_id IN (
  SELECT id FROM public.tournaments WHERE tournament_name LIKE '%Mock%'
);

-- Step 2: Delete all tournament views for mock tournaments
DELETE FROM public.tournament_views WHERE tournament_id IN (
  SELECT id FROM public.tournaments WHERE tournament_name LIKE '%Mock%'
);

-- Step 3: Delete all mock tournaments (tournaments with "Mock" in the name)
DELETE FROM public.tournaments WHERE tournament_name LIKE '%Mock%';

-- Step 4: Delete tournaments with test data patterns
DELETE FROM public.tournaments WHERE 
  tournament_name LIKE '%Test%' OR 
  tournament_name LIKE '%test%' OR
  director_name LIKE '%Director A%' OR
  director_name LIKE '%Director B%' OR
  venue LIKE '%Venue 1%' OR
  venue LIKE '%Venue 2%' OR
  description LIKE '%Description for Mock%';

-- Step 5: Delete any tournaments with id_unique_number 1 or 2 (from mock data)
DELETE FROM public.tournaments WHERE id_unique_number IN (1, 2);

-- Step 6: Clean up any orphaned likes that might remain
DELETE FROM public.likes WHERE turnament_id NOT IN (
  SELECT id FROM public.tournaments
);

-- Step 7: Clean up any orphaned tournament views that might remain
DELETE FROM public.tournament_views WHERE tournament_id NOT IN (
  SELECT id FROM public.tournaments
);

-- Step 8: Reset the id_unique_number sequence if needed
-- This will ensure new tournaments start with the correct numbering
SELECT setval('tournaments_id_unique_number_seq', COALESCE(MAX(id_unique_number), 0) + 1, false) 
FROM public.tournaments;

-- Verification queries (uncomment to check results):
-- SELECT COUNT(*) as remaining_tournaments FROM public.tournaments;
-- SELECT COUNT(*) as remaining_likes FROM public.likes;
-- SELECT tournament_name, director_name, venue FROM public.tournaments LIMIT 10;

-- Success message
SELECT 'Mock tournament data cleanup completed successfully!' as status;
