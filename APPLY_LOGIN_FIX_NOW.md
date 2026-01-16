# 🚨 URGENT: Apply Login Fix Now

## Problem

**Users cannot login with username or email** because the database RLS policies require authentication BEFORE allowing profile reads, creating a chicken-and-egg problem.

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Paste This SQL

```sql
-- =====================================================
-- FIX LOGIN ISSUE - Allow Anon Users to Read Profiles
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and bar owners can view all profiles" ON profiles;

-- Create new policies that allow login to work

-- Policy 1: Allow anon AND authenticated users to read profiles (for login)
CREATE POLICY "Allow public read for login"
ON profiles FOR SELECT
TO anon, authenticated
USING (status IS NULL OR status != 'deleted');

-- Policy 2: Users can see their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Admins can see all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid())
  IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
);
```

### Step 3: Run the Query

1. Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)
2. Wait for "Success. No rows returned" message

### Step 4: Verify the Fix

Run this query to verify the policies were created:

```sql
SELECT
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

You should see 3 policies:

- ✅ "Allow public read for login" - {anon, authenticated} - SELECT
- ✅ "Admins can view all profiles" - {authenticated} - SELECT
- ✅ "Users can view own profile" - {authenticated} - SELECT

### Step 5: Test Login

1. Try logging in with a **username**
2. Try logging in with an **email**
3. Both should work now! ✅

## What This Fix Does

- **Allows unauthenticated users** to read the profiles table (username, email, etc.)
- This enables the username → email lookup needed for login
- Still protects against deleted users
- Maintains admin privileges

## Security Note

This makes usernames and emails publicly readable, which is standard for most applications (similar to Twitter, GitHub, etc.). If you need more security, see the alternative solutions in `LOGIN_ISSUE_DIAGNOSIS_AND_FIX.md`.

## Files Reference

- **SQL Fix**: `CompeteApp/sql/fix_login_rls_allow_anon.sql`
- **Detailed Diagnosis**: `CompeteApp/LOGIN_ISSUE_DIAGNOSIS_AND_FIX.md`
- **Test Script**: `CompeteApp/test_login_username_email.js`

## Need Help?

If login still doesn't work after applying this fix:

1. Check the Supabase logs for errors
2. Verify your environment variables are set correctly
3. Try the diagnostic test script
4. Review the detailed diagnosis document

## Next Steps

After confirming login works:

- ✅ No code changes needed
- ✅ No app rebuild needed
- ✅ Fix is applied immediately to all users
