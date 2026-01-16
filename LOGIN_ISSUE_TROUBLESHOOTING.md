# Login Issue Troubleshooting Guide

## Problem: Can only login with "Tmoneyhill" username, not other accounts

Based on analysis of your authentication system, here are the most likely causes and solutions:

## Root Cause Analysis

### 1. **Row Level Security (RLS) Policies** - MOST LIKELY CAUSE

Your Supabase `profiles` table has RLS enabled with restrictive policies that prevent the login system from querying user profiles during authentication.

**How Login Works:**

1. User enters username/email + password
2. System queries `profiles` table: `SELECT * FROM profiles WHERE user_name ILIKE 'username'`
3. If found, uses associated email for Supabase auth
4. If RLS blocks step 2, login fails

**Why "Tmoneyhill" works:**

- You likely have admin privileges that bypass RLS restrictions
- Your account was created before restrictive policies were applied
- Your account has special role/status that allows access

### 2. **Account Status Issues**

Other accounts might have:

- `status: 'deleted'` (filtered out during login)
- Missing profile data
- Corrupted email associations

### 3. **Database Constraint Conflicts**

- Unique constraint violations
- Case sensitivity issues despite ILIKE implementation
- Index problems affecting lookups

## Step-by-Step Solutions

### **STEP 1: Run Debug Script**

1. Update the debug script with your Supabase credentials:

   ```bash
   # Edit CompeteApp/debug_login_issue.js
   # Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY
   ```

2. Run the debug script:

   ```bash
   cd CompeteApp
   node debug_login_issue.js
   ```

3. Look for these indicators:
   - ❌ "Cannot access profiles table" = RLS policy issue
   - ❌ "Username not found" = Data or query issue
   - ✅ "Found username" but login still fails = Auth issue

### **STEP 2: Check RLS Status (Database Admin Required)**

Run this SQL in your Supabase SQL editor:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- Check existing policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
```

### **STEP 3: Temporary Fix (CAREFUL!)**

If RLS is the issue, temporarily disable it to test:

```sql
-- TEMPORARY - REMOVES SECURITY!
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test login with other usernames now
-- If it works, RLS was the problem
```

### **STEP 4: Permanent Fix - Proper RLS Policies**

Run the SQL from `CompeteApp/sql/temporary_fix_login.sql`:

```sql
-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create proper policies
CREATE POLICY "Allow read access for validation" ON profiles
FOR SELECT USING (true);

-- Add other necessary policies...
```

### **STEP 5: Verify Fix**

1. Test login with different usernames
2. Check that all accounts can be found:
   ```sql
   SELECT user_name, email, status, role
   FROM profiles
   WHERE user_name ILIKE 'testusername'
   AND (status IS NULL OR status != 'deleted');
   ```

## Alternative Solutions

### **Solution A: Check Account Status**

```sql
-- Find accounts with problematic status
SELECT user_name, email, status, role, created_at
FROM profiles
WHERE status = 'deleted' OR status IS NOT NULL;

-- Fix deleted accounts
UPDATE profiles
SET status = NULL
WHERE user_name = 'problematic_username' AND status = 'deleted';
```

### **Solution B: Check Email Associations**

```sql
-- Find accounts with missing/invalid emails
SELECT user_name, email, status
FROM profiles
WHERE email IS NULL OR email = '' OR email NOT LIKE '%@%';

-- Fix missing emails
UPDATE profiles
SET email = 'correct_email@domain.com'
WHERE user_name = 'username_with_missing_email';
```

### **Solution C: Recreate User Profile**

If a specific account is corrupted:

```sql
-- Check if user exists in auth.users but not profiles
SELECT email FROM auth.users
WHERE email NOT IN (SELECT email FROM profiles WHERE email IS NOT NULL);

-- Recreate profile for existing auth user
INSERT INTO profiles (id, email, user_name, name, role, status)
VALUES (
  'auth_user_id_here',
  'user_email@domain.com',
  'username',
  'Display Name',
  'BasicUser',
  NULL
);
```

## Prevention

### **Proper RLS Policies**

Always ensure these policies exist:

1. **Validation Policy** (CRITICAL for login):

   ```sql
   CREATE POLICY "Allow read access for validation" ON profiles
   FOR SELECT USING (true);
   ```

2. **User Self-Access**:

   ```sql
   CREATE POLICY "Users can view own profile" ON profiles
   FOR SELECT USING (auth.uid() = id);
   ```

3. **Admin Access**:
   ```sql
   CREATE POLICY "Admins can manage all profiles" ON profiles
   FOR ALL USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid()
       AND role IN ('MasterAdministrator', 'CompeteAdmin')
     )
   );
   ```

### **Regular Maintenance**

- Monitor for accounts with `status = 'deleted'`
- Verify email/username associations
- Test login functionality after database changes
- Keep RLS policies minimal but secure

## Files Created for This Issue

1. `CompeteApp/debug_login_issue.js` - Debug script to identify the problem
2. `CompeteApp/sql/temporary_fix_login.sql` - SQL fixes for RLS policies
3. `CompeteApp/LOGIN_ISSUE_TROUBLESHOOTING.md` - This guide

## Next Steps

1. Run the debug script first
2. Based on results, apply appropriate SQL fixes
3. Test login with multiple accounts
4. Monitor for recurring issues

## Contact

If the issue persists after following this guide, the problem might be:

- Supabase configuration issues
- Network/connectivity problems
- App-specific authentication logic bugs

Check the console logs during login attempts for additional error details.
