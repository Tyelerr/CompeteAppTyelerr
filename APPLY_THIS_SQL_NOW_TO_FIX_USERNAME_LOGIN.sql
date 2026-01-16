-- ============================================
-- COPY AND PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- This will fix username login immediately (no rebuild needed)
-- ============================================

-- Step 1: Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow anonymous users to read profiles for login" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Step 2: Create the fix - Allow anonymous users to SELECT profiles for username lookup
CREATE POLICY "Allow anonymous users to read profiles for login"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Step 3: Verify it worked
SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'SELECT';

-- ============================================
-- DONE! Username login should work immediately in TestFlight
-- No app rebuild needed - this is a database-only fix
-- ============================================
