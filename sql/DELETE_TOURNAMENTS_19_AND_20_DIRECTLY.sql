-- =====================================================
-- DIRECT DELETION OF TOURNAMENTS 19 AND 20
-- =====================================================
-- This script will directly delete the tournaments from the database
-- bypassing any RLS or application-level restrictions
-- =====================================================

-- Step 1: Check what's preventing deletion - look for ALL foreign key references
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'tournaments'
    AND tc.constraint_type = 'FOREIGN KEY';

-- Step 2: Find the actual UUIDs for tournaments 19 and 20
SELECT id, id_unique_number, tournament_name, start_date
FROM public.tournaments
WHERE id_unique_number IN (19, 20);

-- Step 3: Check for likes on these tournaments
SELECT COUNT(*) as likes_count, turnament_id
FROM public.likes
WHERE turnament_id IN (
    SELECT id FROM public.tournaments WHERE id_unique_number IN (19, 20)
)
GROUP BY turnament_id;

-- Step 4: Check for tournament_views on these tournaments
SELECT COUNT(*) as views_count, tournament_id
FROM public.tournament_views
WHERE tournament_id IN (
    SELECT id FROM public.tournaments WHERE id_unique_number IN (19, 20)
)
GROUP BY tournament_id;

-- Step 5: Delete tournament_views first (if table exists)
DELETE FROM public.tournament_views
WHERE tournament_id IN (
    SELECT id FROM public.tournaments WHERE id_unique_number IN (19, 20)
);

-- Step 6: Delete likes (should CASCADE but let's be explicit)
DELETE FROM public.likes
WHERE turnament_id IN (
    SELECT id FROM public.tournaments WHERE id_unique_number IN (19, 20)
);

-- Step 7: Now delete the tournaments themselves
DELETE FROM public.tournaments
WHERE id_unique_number IN (19, 20);

-- Step 8: Verify deletion
SELECT id, id_unique_number, tournament_name
FROM public.tournaments
WHERE id_unique_number IN (19, 20);
-- Should return 0 rows

-- Step 9: Verify likes are gone
SELECT COUNT(*) as remaining_likes
FROM public.likes
WHERE turnament_id IN (
    SELECT id FROM public.tournaments WHERE id_unique_number IN (19, 20)
);
-- Should return 0

-- =====================================================
-- SUMMARY
-- =====================================================
-- This script:
-- 1. Shows all foreign key constraints
-- 2. Finds the tournament UUIDs
-- 3. Deletes related tournament_views
-- 4. Deletes related likes
-- 5. Deletes the tournaments
-- 6. Verifies deletion
-- =====================================================
