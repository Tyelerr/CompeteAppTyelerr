# Instructions: Delete All Users and Start Fresh

## ⚠️ WARNING

This will delete ALL users from your database. Only do this if you're sure you want to start completely fresh!

## Step-by-Step Instructions

### Step 1: Delete Users from Supabase Dashboard (EASIEST METHOD)

1. **Go to Supabase Dashboard**

   - Navigate to your project at supabase.com

2. **Go to Authentication > Users**

   - Click on "Authentication" in the left sidebar
   - Click on "Users"

3. **Delete All Users**
   - Select all users (checkbox at top)
   - Click "Delete users" button
   - Confirm the deletion

This will automatically delete users from both `auth.users` AND `profiles` tables if you have proper CASCADE rules set up.

### Step 2: Clean Up Profiles Table (if needed)

If any profiles remain after deleting auth users, run this SQL:

```sql
-- Delete all profiles
DELETE FROM public.profiles;

-- Reset the auto-increment counter
ALTER SEQUENCE profiles_id_auto_seq RESTART WITH 1;
```

### Step 3: Clean Up Related Data (Optional but Recommended)

```sql
-- Delete all permissions
DELETE FROM public.permissions;

-- Delete all likes
DELETE FROM public.likes;

-- Delete all giveaway entries
DELETE FROM public.giveaway_entries;

-- Delete all search alerts
DELETE FROM public.alerts;
```

### Step 4: Verify Everything is Clean

```sql
-- Check profiles (should return 0)
SELECT COUNT(*) as profiles_count FROM public.profiles;

-- Check permissions (should return 0)
SELECT COUNT(*) as permissions_count FROM public.permissions;

-- Check likes (should return 0)
SELECT COUNT(*) as likes_count FROM public.likes;
```

## After Deletion

1. **Test Registration**: Register a new user through the app
2. **Test Login**: Login with the new user (both username and email)
3. **Verify**: Check that the user appears in both `auth.users` and `profiles`

## Alternative: Use the SQL Script

I've created `DELETE_ALL_USERS_START_FRESH.sql` with all the commands, but the Supabase Dashboard method (Step 1) is easier and safer.

## What This Fixes

After deleting all users and re-registering:

- ✅ All users will have matching records in both `auth.users` and `profiles`
- ✅ No orphaned profiles (profiles without auth users)
- ✅ Clean slate for testing Build 125 fixes
- ✅ All login methods (username and email) will work correctly

## Build 125 is Ready

Once you've cleaned up the users, Build 125 with the username login fix is ready to deploy and test with fresh user registrations.
