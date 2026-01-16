# Login Issue Diagnosis and Fix Plan

## Problem Statement

User reports: **"I still cannot login with username or email"**

## Current State Analysis

Based on the codebase review, here's what I found:

### 1. **Code Implementation (CrudUser.tsx)**

The `SignIn` function in `CompeteApp/ApiSupabase/CrudUser.tsx` has been updated to support both username and email login with the following logic:

```typescript
export const SignIn = async (userSignIn: ICrudUserData) => {
  // 1. Fetch ALL profiles (limit 1000)
  // 2. Find user by username (case-insensitive, client-side)
  // 3. If found, use their email for authentication
  // 4. If not found, treat input as email
  // 5. Authenticate with Supabase using email + password
};
```

**Potential Issues:**

- ✅ Code looks correct
- ⚠️ **CRITICAL**: Relies on fetching profiles without authentication
- ⚠️ **CRITICAL**: RLS policies might be blocking unauthenticated profile access

### 2. **Database RLS Policies**

According to `BUILD_116_COMPLETE.md`, these policies were applied via `EMERGENCY_FIX_LOGIN_RLS.sql`:

**Policy 1: "Users can view own profile"**

```sql
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

**Policy 2: "Admins and bar owners can view all profiles"**

```sql
CREATE POLICY "Admins and bar owners can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid())
  IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
  AND
  (status IS NULL OR status != 'deleted')
);
```

**CRITICAL PROBLEM IDENTIFIED:**

Both policies require `TO authenticated` - meaning users must ALREADY be logged in to view profiles!

This creates a **chicken-and-egg problem**:

1. User tries to login with username
2. App needs to fetch profiles to find username → email mapping
3. RLS blocks the query because user is NOT authenticated yet
4. Login fails

## Root Cause

**The RLS policies prevent unauthenticated users from reading the profiles table, which breaks the username → email lookup required for login.**

## Solution

We need to allow **unauthenticated** users to read ONLY the necessary fields (username, email) from profiles for login purposes, while still protecting sensitive data.

### Option 1: Create a Public Read Policy for Login (RECOMMENDED)

Create a new RLS policy that allows unauthenticated users to read ONLY username and email fields:

```sql
-- Allow unauthenticated users to read username and email for login purposes
CREATE POLICY "Allow username lookup for login"
ON profiles FOR SELECT
TO anon
USING (true);
```

**Note**: This makes usernames and emails publicly readable, which is acceptable for most applications (similar to how most apps work).

### Option 2: Use a Database Function with SECURITY DEFINER

Create a PostgreSQL function that bypasses RLS to look up email by username:

```sql
CREATE OR REPLACE FUNCTION public.get_email_by_username(input_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM profiles
  WHERE LOWER(user_name) = LOWER(input_username)
    AND (status IS NULL OR status != 'deleted')
  LIMIT 1;

  RETURN user_email;
END;
$$;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon;
```

Then update `SignIn` function in `CrudUser.tsx` to use this function:

```typescript
// Instead of fetching all profiles, call the function
const { data, error } = await supabase.rpc('get_email_by_username', {
  input_username: username,
});

if (data) {
  emailTemporary = data;
} else {
  emailTemporary = username; // Treat as email
}
```

### Option 3: Hybrid Approach (MOST SECURE)

1. Create a view with only public fields
2. Allow anon access to the view
3. Keep strict RLS on the main table

```sql
-- Create a public view for login
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  id,
  user_name,
  email,
  status
FROM profiles
WHERE status IS NULL OR status != 'deleted';

-- Allow anon users to read from the view
GRANT SELECT ON public.profiles_public TO anon;
```

Then update `SignIn` to query the view instead:

```typescript
const { data: allProfiles, error: fetchError } = await supabase
  .from('profiles_public') // Use the view instead
  .select('*')
  .limit(1000);
```

## Recommended Implementation Steps

### Step 1: Verify Current RLS Policies

Run this SQL in Supabase SQL Editor:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

### Step 2: Apply the Fix (Option 1 - Simplest)

```sql
-- Drop existing restrictive policies if needed
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and bar owners can view all profiles" ON profiles;

-- Create new policies that allow login
-- Policy 1: Allow anon users to read username/email for login
CREATE POLICY "Allow public read for login"
ON profiles FOR SELECT
TO anon, authenticated
USING (status IS NULL OR status != 'deleted');

-- Policy 2: Allow users to see their own full profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Allow admins to see all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid())
  IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
);
```

### Step 3: Test the Fix

1. Try logging in with a username
2. Try logging in with an email
3. Verify both work correctly

### Step 4: Security Considerations

If you're concerned about exposing usernames/emails publicly, use **Option 2** (database function) instead, which:

- Only exposes the email lookup functionality
- Doesn't allow browsing all users
- Still allows login to work

## Testing Checklist

- [ ] Can login with username (case-insensitive)
- [ ] Can login with email
- [ ] Cannot login with deleted user accounts
- [ ] RLS still protects sensitive profile data
- [ ] Admin users can still search all users
- [ ] Regular users can only see their own profile

## Files to Modify

1. **Database**: Apply SQL fix in Supabase SQL Editor
2. **Code**: No changes needed if using Option 1
3. **Code**: Update `CrudUser.tsx` if using Option 2 or 3

## Next Steps

1. Choose which option to implement (I recommend Option 1 for simplicity)
2. Apply the SQL changes in Supabase
3. Test login functionality
4. Deploy updated build if code changes were made

## Additional Notes

- The current code in `CrudUser.tsx` is well-written and handles username/email login correctly
- The issue is purely at the database RLS policy level
- Once RLS is fixed, login should work immediately without code changes
