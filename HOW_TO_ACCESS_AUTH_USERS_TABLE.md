# How to Access auth.users Table in Supabase

## The Issue

You're looking at the "public" schema, but the authentication tables are in the "auth" schema.

## Steps to View auth.users Table

### In Supabase Dashboard:

1. **Go to SQL Editor** (or Table Editor)

2. **Change Schema from "public" to "auth"**
   - Look for a dropdown that says "schema: public"
   - Click it and select "auth"
3. **Now you'll see the auth tables:**
   - `auth.users` - All authenticated users
   - `auth.identities` - User identity providers
   - `auth.sessions` - Active sessions
   - etc.

### Or Use SQL Editor Directly:

Run this query in the SQL Editor (it works regardless of schema selection):

```sql
-- Check if Dozers exists in auth.users
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email ILIKE '%dozers%';
```

## What to Check for Dozers Login Issue

### Query 1: Check if Dozers exists in auth.users

```sql
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email ILIKE 'dozers@test.com';
```

**Expected Results:**

- **If NO results**: Dozers exists in profiles but NOT in auth.users - this is why login fails
- **If results found**: Check the `email_confirmed_at` column:
  - If NULL: Email needs to be confirmed before login works
  - If has a date: Email is confirmed, so it's likely a password issue

### Query 2: Compare profiles vs auth.users

```sql
-- See which users are in profiles but NOT in auth
SELECT
  p.user_name,
  p.email as profile_email,
  p.status,
  CASE
    WHEN au.id IS NULL THEN '❌ NOT in auth.users'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email not confirmed'
    ELSE '✅ OK'
  END as auth_status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.user_name IN ('Dozers', 'tbar', 'MetroSportzBar', 'tmoneyhill')
ORDER BY p.user_name;
```

## How to Fix if Dozers is Missing from auth.users

### Option 1: Have Dozers Re-register

The easiest solution - have them create a new account with the same email.

### Option 2: Manually Create Auth User (Advanced)

This requires admin access to Supabase and should be done carefully.

## Summary

The `auth.users` table is in the `auth` schema, not `public`. Switch schemas in Supabase dashboard or use `auth.users` in your SQL queries to access it.
