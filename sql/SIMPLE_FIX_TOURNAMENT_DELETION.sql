-- =====================================================
-- SIMPLE FIX FOR TOURNAMENT DELETION
-- =====================================================
-- Remove ALL existing DELETE policies and create ONE simple policy
-- =====================================================

-- Step 1: Remove ALL existing DELETE policies
DROP POLICY IF EXISTS "Allow tournament deletion for admins and service role" ON public.tournaments;
DROP POLICY IF EXISTS "Users can delete own tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admin users can delete tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can delete tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Only admins can delete tournaments" ON public.tournaments;

-- Step 2: Create ONE simple policy that allows deletion
-- This allows ANYONE authenticated to delete (you can restrict later if needed)
CREATE POLICY "Allow authenticated users to delete tournaments"
ON public.tournaments
FOR DELETE
TO authenticated
USING (true);

-- Step 3: Verify the policy
SELECT 
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'tournaments' AND cmd = 'DELETE';

-- =====================================================
-- NOW TRY DELETING THE TOURNAMENTS
-- =====================================================
-- After running this, go back to the tournaments table and try deleting again
-- =====================================================
