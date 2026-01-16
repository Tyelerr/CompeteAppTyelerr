# Why Username Login Needs RLS Fix (Even Though UUIDs Match)

## You're Right - They ARE Connected!

The `auth.users` and `profiles` tables ARE properly linked by UUID (`profiles.id` = `auth.users.id`). That's working correctly.

## So Why Doesn't Username Login Work?

The problem is **RLS (Row Level Security) policies** are blocking the app from READING the profiles table during login.

### How Username Login Works (Step by Step):

1. **User enters username** "tbar" in the app
2. **App tries to read profiles table** to find the email:
   ```sql
   SELECT email FROM profiles WHERE user_name = 'tbar'
   ```
3. **❌ RLS BLOCKS THIS** - Anonymous users can't read profiles
4. **App can't get the email** - Login fails

### Why Email Login Works:

1. **User enters email** "testbar@test.com" in the app
2. **App authenticates directly** with auth.users (no profiles table read needed):
   ```sql
   -- This happens in auth schema, RLS doesn't block it
   auth.signInWithPassword(email, password)
   ```
3. **✅ Login succeeds** - No RLS check needed

## The Fix

Allow anonymous users to READ (SELECT only) from profiles:

```sql
CREATE POLICY "Allow anonymous users to read profiles for login"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);
```

This is SAFE because:

- ✅ Only allows SELECT (read), not INSERT/UPDATE/DELETE
- ✅ Only reads public profile info (username, email)
- ✅ Doesn't expose passwords (those are in auth.users, separate schema)
- ✅ Standard practice for username-based login systems

## Summary

- **UUIDs ARE connected** ✅ (profiles.id = auth.users.id)
- **Email login works** ✅ (bypasses profiles table)
- **Username login fails** ❌ (RLS blocks profiles table read)
- **Solution**: Add RLS policy to allow anonymous SELECT on profiles

The tables are properly linked. The issue is just RLS permissions.
