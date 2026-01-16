-- Clean up tournament likes for tournaments that no longer exist
-- This fixes the issue where liked tournaments reference deleted tournaments

-- Remove likes for tournaments that don't exist anymore
DELETE FROM likes 
WHERE tournament_id NOT IN (SELECT id FROM tournaments);

-- Remove likes history for tournaments that don't exist anymore (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_likes_history') THEN
        DELETE FROM tournament_likes_history 
        WHERE tournament_id NOT IN (SELECT id FROM tournaments);
        RAISE NOTICE 'Cleaned up tournament_likes_history table';
    ELSE
        RAISE NOTICE 'tournament_likes_history table does not exist - skipping cleanup';
    END IF;
END $$;

-- Check results
SELECT 
  (SELECT COUNT(*) FROM likes) as remaining_likes,
  (SELECT COUNT(*) FROM tournaments WHERE status = 'active') as active_tournaments;
