-- =====================================================
-- FIX TOURNAMENT DELETION - ADD CASCADE DELETE FOR LIKES
-- =====================================================
-- Problem: Cannot delete tournaments because likes table has foreign key constraint
-- Solution: Update the foreign key constraint to CASCADE delete likes when tournament is deleted
-- =====================================================

-- Step 1: Check current foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'likes'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name LIKE '%tournament%';

-- Step 2: Drop the existing foreign key constraint
-- Note: The constraint name might be different, adjust if needed
ALTER TABLE public.likes
DROP CONSTRAINT IF EXISTS likes_turnament_id_fkey;

ALTER TABLE public.likes
DROP CONSTRAINT IF EXISTS likes_tournament_id_fkey;

-- Step 3: Add new foreign key constraint with CASCADE delete
-- This will automatically delete likes when a tournament is deleted
ALTER TABLE public.likes
ADD CONSTRAINT likes_turnament_id_fkey
FOREIGN KEY (turnament_id)
REFERENCES public.tournaments(id)
ON DELETE CASCADE;

-- Step 4: Verify the new constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'likes'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name LIKE '%tournament%';

-- Expected result: delete_rule should now be 'CASCADE'

-- =====================================================
-- TESTING
-- =====================================================

-- Test 1: Try deleting a past tournament (this should now work)
-- Replace 'tournament_id_here' with an actual tournament ID
/*
DELETE FROM public.tournaments
WHERE id = 'tournament_id_here';
*/

-- Test 2: Verify likes were also deleted
/*
SELECT COUNT(*) as remaining_likes
FROM public.likes
WHERE turnament_id = 'tournament_id_here';
-- Should return 0
*/

-- =====================================================
-- CLEANUP EXISTING ORPHANED LIKES (OPTIONAL)
-- =====================================================

-- Check for orphaned likes (likes where tournament no longer exists)
SELECT COUNT(*) as orphaned_likes_count
FROM public.likes l
WHERE NOT EXISTS (
    SELECT 1 FROM public.tournaments t WHERE t.id = l.turnament_id
)
AND NOT EXISTS (
    SELECT 1 FROM public.tournaments_archive ta WHERE ta.id = l.turnament_id
);

-- Delete orphaned likes if any exist
DELETE FROM public.likes
WHERE NOT EXISTS (
    SELECT 1 FROM public.tournaments t WHERE t.id = turnament_id
)
AND NOT EXISTS (
    SELECT 1 FROM public.tournaments_archive ta WHERE ta.id = turnament_id
);

-- =====================================================
-- SUMMARY
-- =====================================================
-- After running this script:
-- ✅ Tournaments can be deleted without foreign key errors
-- ✅ Likes are automatically deleted when tournament is deleted
-- ✅ No manual cleanup of likes needed before deleting tournaments
-- ✅ Orphaned likes (if any) are cleaned up
-- =====================================================
