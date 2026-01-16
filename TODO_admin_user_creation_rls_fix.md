# Admin User Creation RLS Fix

## Issue

When adding a user in the compete admin dashboard, it fails with:

```
ERROR AdminCreateUser: Profile creation failed: {"code": "42501", "details": null, "hint": null, "message": "new row violates row-level security policy for table \"profiles\""}
```

## Root Cause

The AdminCreateUser function in AdminAuthHelpers.ts is using the regular `supabase` client (with anon key) instead of the `supabaseAdmin` client (with service role key) for profile creation. The service role key should bypass RLS policies.

## Plan

- [x] Identify the issue in AdminCreateUser function
- [x] Fix AdminCreateUser to use supabaseAdmin for profile creation
- [x] Fix user role updates to update both authentication and profile
- [ ] Test the admin user creation functionality
- [ ] Verify existing functionality still works

## Files to Edit

- CompeteApp/ApiSupabase/AdminAuthHelpers.ts
- CompeteApp/ApiSupabase/CrudUser.tsx
- CompeteApp/screens/Admin/ScreenAdminUsers.tsx

## Changes Made

- [x] Changed profile creation from `supabase.from('profiles').upsert()` to `supabaseAdmin.from('profiles').upsert()` in AdminAuthHelpers.ts
- [x] Fixed UpdateProfile function in CrudUser.tsx to use `supabaseAdmin.from('profiles').update()` instead of `supabase.from('profiles').update()`
- [x] Created AdminUpdateUserRole function that updates both authentication user metadata and profile table
- [x] Updated ScreenAdminUsers.tsx to use AdminUpdateUserRole for role changes instead of UpdateProfile
- [x] Updated error handling and logging accordingly
- [ ] Tested the fix

## Testing Steps

1. Try creating a user through the admin dashboard
2. Verify the user is created successfully
3. Check that the profile is created in the database
4. Ensure no existing functionality is broken
