-- Fixed cleanup script to remove all mock tournaments and test data
-- This script properly handles foreign key constraints

-- Step 1: Delete all likes referencing mock tournaments first
-- Note: The column name is 'turnament_id' (with one 'o'), not 'tournament_id'
DELETE FROM public.likes WHERE turnament_id IN (
  SELECT id FROM public.tournaments WHERE 
    tournament_name LIKE '%Mock%' OR
    tournament_name LIKE '%Test%' OR 
    tournament_name LIKE '%test%' OR
    director_name LIKE '%Director A%' OR
    director_name LIKE '%Director B%' OR
    venue LIKE '%Venue 1%' OR
    venue LIKE '%Venue 2%' OR
    description LIKE '%Description for Mock%' OR
    id_unique_number IN (1, 2)
);

-- Step 2: Delete all tournament views for mock tournaments
DELETE FROM public.tournament_views WHERE tournament_id IN (
  SELECT id FROM public.tournaments WHERE 
    tournament_name LIKE '%Mock%' OR
    tournament_name LIKE '%Test%' OR 
    tournament_name LIKE '%test%' OR
    director_name LIKE '%Director A%' OR
    director_name LIKE '%Director B%' OR
    venue LIKE '%Venue 1%' OR
    venue LIKE '%Venue 2%' OR
    description LIKE '%Description for Mock%' OR
    id_unique_number IN (1, 2)
);

-- Step 3: Now safely delete all mock and test tournaments
DELETE FROM public.tournaments WHERE 
  tournament_name LIKE '%Mock%' OR
  tournament_name LIKE '%Test%' OR 
  tournament_name LIKE '%test%' OR
  director_name LIKE '%Director A%' OR
  director_name LIKE '%Director B%' OR
  venue LIKE '%Venue 1%' OR
  venue LIKE '%Venue 2%' OR
  description LIKE '%Description for Mock%' OR
  id_unique_number IN (1, 2);

-- Step 4: Clean up any orphaned likes that might remain
DELETE FROM public.likes WHERE turnament_id NOT IN (
  SELECT id FROM public.tournaments
);

-- Step 5: Clean up any orphaned tournament views that might remain
DELETE FROM public.tournament_views WHERE tournament_id NOT IN (
  SELECT id FROM public.tournaments
);

-- Step 6: Reset the id_unique_number sequence if needed
SELECT setval('tournaments_id_unique_number_seq', COALESCE(MAX(id_unique_number), 0) + 1, false) 
FROM public.tournaments;

-- Verification queries:
SELECT COUNT(*) as remaining_tournaments FROM public.tournaments;
SELECT COUNT(*) as remaining_likes FROM public.likes;
SELECT 'Mock tournament data cleanup completed successfully!' as status;
