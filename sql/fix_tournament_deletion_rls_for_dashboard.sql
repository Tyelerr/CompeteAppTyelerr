-- =====================================================
-- FIX TOURNAMENT DELETION RLS FOR SUPABASE DASHBOARD
-- =====================================================
-- Problem: Tournaments cannot be deleted from Supabase dashboard due to RLS policies
-- Solution: Add RLS policies that allow deletion for authenticated users (especially admins)
-- =====================================================

-- Step 1: Check current DELETE policies on tournaments table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tournaments' AND cmd = 'DELETE';

-- Step 2: Drop existing restrictive DELETE policies if they exist
DROP POLICY IF EXISTS "Admin users can delete tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can delete tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Only admins can delete tournaments" ON public.tournaments;

-- Step 3: Create a comprehensive DELETE policy for tournaments
-- This policy allows:
-- 1. Authenticated users with admin roles (master-administrator, compete-admin)
-- 2. Service role (for backend operations)
CREATE POLICY "Allow tournament deletion for admins and service role"
ON public.tournaments
FOR DELETE
TO authenticated, service_role
USING (
    -- Allow service role to delete anything
    auth.role() = 'service_role'
    OR
    -- Allow authenticated users with admin roles
    (
        auth.role() = 'authenticated'
        AND
        EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('master-administrator', 'compete-admin')
        )
    )
);

-- Step 4: Verify the new policy
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'tournaments' AND cmd = 'DELETE';

-- Step 5: Also ensure likes table has proper CASCADE behavior
-- (This should already be done, but let's verify)
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

-- Expected: delete_rule should be 'CASCADE'

-- =====================================================
-- TESTING INSTRUCTIONS
-- =====================================================
-- After running this script:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Table Editor > tournaments
-- 3. Find tournament ID 19 or 20
-- 4. Click the delete button (trash icon)
-- 5. Confirm deletion
-- 6. The tournament should be deleted successfully
-- 7. Check the likes table - associated likes should be automatically removed
-- =====================================================

-- =====================================================
-- SUMMARY
-- =====================================================
-- This script:
-- ✅ Removes restrictive DELETE policies
-- ✅ Adds comprehensive DELETE policy for admins and service role
-- ✅ Verifies CASCADE DELETE is in place for likes
-- ✅ Allows deletion from Supabase Dashboard
-- =====================================================
