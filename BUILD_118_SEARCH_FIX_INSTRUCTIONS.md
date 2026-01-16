# Build 118 - Tournament Director Search Fix - CRITICAL DATABASE UPDATE REQUIRED

## Issue

You're only seeing ~10 profiles when searching for tournament directors because **Row Level Security (RLS) policies** in Supabase are restricting which profiles bar owners can view.

## Root Cause

The `FetchUsersV2` function in the code works correctly and has NO LIMIT, but Supabase's RLS policies are blocking bar owners from seeing all users in the database.

## CRITICAL: Database Fix Required

You MUST run this SQL script in your Supabase SQL Editor to fix the search:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Open your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Copy and Paste This SQL

```sql
-- =====================================================
-- Fix Tournament Director Search - RLS Policies
-- =====================================================

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Bar owners can view all active profiles" ON profiles;
DROP POLICY IF EXISTS "BarAdmins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow bar owners to search users" ON profiles;

-- Create new policy that allows bar owners to see all active users
CREATE POLICY "Bar owners can view all active profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Allow if requesting user is a bar owner, admin, or master admin
  (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
  AND
  -- Only show non-deleted users
  (status IS NULL OR status != 'deleted')
);

-- Verify the policy was created
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'Bar owners can view all active profiles';
```

### Step 3: Run the Query

1. Click "Run" or press Ctrl+Enter (Cmd+Enter on Mac)
2. You should see a success message
3. The verification query at the end should show the new policy

## What This Does

This SQL script creates a Row Level Security policy that allows:

- ✅ Bar owners (BarAdmin role) to see ALL active users
- ✅ Master administrators to see ALL active users
- ✅ Compete admins to see ALL active users
- ❌ Blocks deleted users from being shown

## Code Changes Already Made

✅ `CompeteApp/screens/BarOwner/ScreenBarOwnerDashboard.tsx` - Fixed to load users immediately
✅ `CompeteApp/app.json` - Build number updated to 118

## Testing After SQL Fix

After running the SQL script:

1. **Log in as a bar owner** in your app
2. **Navigate to Bar Owner Dashboard**
3. **Click "Add Tournament Director"**
4. **Verify you see ALL users** (not just 10)
5. **Type in the search field** to filter
6. **Clear the search** to see all users again

## Why This Happens

Supabase uses Row Level Security (RLS) to control data access. By default, users can only see their own profile. The SQL policy above explicitly grants bar owners permission to view all profiles (except deleted ones) so they can search for and assign tournament directors.

## If SQL Fix Doesn't Work

If you still only see 10 users after running the SQL:

1. **Check your user's role in the database:**

   ```sql
   SELECT id, email, user_name, role
   FROM profiles
   WHERE email = 'your-bar-owner-email@example.com';
   ```

   Make sure the role is exactly `'BarAdmin'` (case-sensitive!)

2. **Check all existing RLS policies:**

   ```sql
   SELECT policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'profiles';
   ```

   Look for any policies that might be conflicting

3. **Temporarily disable RLS to test:**

   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```

   ⚠️ WARNING: Only do this for testing, then re-enable:

   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ```

## Files Modified in Build 118

1. `CompeteApp/screens/BarOwner/ScreenBarOwnerDashboard.tsx` - Search UX fix
2. `CompeteApp/app.json` - Build number 117 → 118

## Files Created

1. `CompeteApp/TODO_bar_owner_search_fix_plan.md` - Planning document
2. `CompeteApp/BAR_OWNER_SEARCH_FIX_COMPLETE.md` - Summary
3. `CompeteApp/BUILD_118_SEARCH_FIX_INSTRUCTIONS.md` - This file

## Related Files

- `CompeteApp/sql/fix_tournament_director_search_rls.sql` - The SQL fix (same content as above)
- `CompeteApp/BUILD_115_TOURNAMENT_DIRECTOR_SEARCH_FIX.md` - Previous attempt at this fix

---

**IMPORTANT:** The code fix alone won't work without the database RLS policy update. You MUST run the SQL script above in Supabase for the search to show all users.
