# How to Create Auth Users for Existing Profiles

## The Better Solution: Create Auth Users Instead of Deleting

Instead of deleting all users, you can create auth users for the existing profiles. This preserves all your data.

## Step-by-Step Instructions

### Method 1: Via Supabase Dashboard (EASIEST)

1. **Go to Supabase Dashboard**

   - Navigate to Authentication > Users

2. **For Each Profile Without Auth User:**

   **For Dozers:**

   - Click "Add user" or "Invite user"
   - Email: `dozers@test.com`
   - Password: Set a temporary password (e.g., `TempPass123!`)
   - Click "Create user"
   - ✅ Auto-confirm email (check the box if available)

   **Repeat for any other users missing auth:**

   - tbar, MetroSportzBar, etc.

3. **Important: Note the User IDs**
   - After creating each auth user, note their UUID
   - You'll need to update the profile to match this ID

### Method 2: Update Profile IDs to Match Auth IDs

After creating auth users, you need to sync the IDs:

1. **Find the Auth User ID:**

   ```sql
   SELECT id, email FROM auth.users WHERE email = 'dozers@test.com';
   ```

   Copy the `id` (it's a UUID like `123e4567-e89b-12d3-a456-426614174000`)

2. **Update the Profile ID:**

   ```sql
   UPDATE public.profiles
   SET id = 'paste-the-auth-user-id-here'
   WHERE email = 'dozers@test.com';
   ```

3. **Verify the Sync:**
   ```sql
   SELECT
     p.user_name,
     p.email,
     p.id as profile_id,
     au.id as auth_id,
     CASE
       WHEN p.id = au.id THEN '✅ Synced'
       ELSE '❌ Not synced'
     END as status
   FROM public.profiles p
   LEFT JOIN auth.users au ON p.email = au.email
   WHERE p.email = 'dozers@test.com';
   ```

### Method 3: Easier Alternative - Have Users Re-register

If the above seems complex, the simplest solution:

1. Delete the orphaned profiles (profiles without auth users)
2. Have users re-register through the app
3. This automatically creates both auth user and profile with matching IDs

```sql
-- Delete only profiles without auth users
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);
```

## Recommended Approach

**For Dozers specifically:**

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user"
3. Email: `dozers@test.com`
4. Password: `TempPassword123!` (or any secure password)
5. Check "Auto-confirm email"
6. Click "Create user"
7. Copy the new user's ID
8. Run this SQL:
   ```sql
   UPDATE public.profiles
   SET id = 'new-auth-user-id-here'
   WHERE email = 'dozers@test.com';
   ```
9. Dozers can now login with email and the password you set
10. They should change their password after first login

## After Fixing

Once all profiles have matching auth users, Build 125 will work perfectly with both username and email login.
