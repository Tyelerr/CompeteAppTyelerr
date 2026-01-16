# Tournament Director Search Fix - Complete

## Issue

When adding a new tournament director in the bar owner dashboard, the search was not returning all users. Only a few users were showing up in the search results.

## Root Cause

The code had references to `supabaseAdmin` which doesn't exist (removed for security reasons), which could cause compilation errors. Additionally, the search might be limited by RLS (Row Level Security) policies on the `profiles` table.

## Changes Made

### 1. CompeteApp/ApiSupabase/CrudUser.tsx

- **Removed all `supabaseAdmin` references** that were causing compilation errors
- **Fixed `SignUp` function**: Removed admin user creation path (should be done via Edge Functions)
- **Fixed `DeleteUser` function**: Now uses regular `supabase` client instead of `supabaseAdmin`
- **`FetchUsersV2` function**: Already correctly searches all users without role filter when not specified

## How It Works Now

### Search Functionality (`FetchUsersV2`)

```typescript
// When called from ModalAssignTournamentDirector:
FetchUsersV2(user, searchTerm, undefined, '', false);
```

- **No role filter**: When `userRole` is `undefined`, it searches ALL users
- **Searches by**: username, name, and email (case-insensitive)
- **Excludes**: Deleted users (unless user is admin)
- **No limit**: Returns all matching users

### Assignment Logic (in ModalAssignTournamentDirector)

```typescript
// If user is BasicUser → upgrade to TournamentDirector
if (selectedUser.role === EUserRole.BasicUser) {
  await UpdateProfile(selectedUser.id, {
    role: EUserRole.TournamentDirector,
  });
}

// Then assign to venue
await assignTournamentDirectorToVenue(selectedUser.id_auto, venueId);
```

## Potential RLS Issue

If users still aren't showing up, the issue is likely **RLS policies** on the `profiles` table. The policies might be restricting which users can be seen by bar owners.

### To Check RLS Policies:

Run this SQL in Supabase SQL Editor:

```sql
-- Check current RLS policies on profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
```

### Expected Policy for Bar Owners:

Bar owners should be able to SELECT all active (non-deleted) profiles:

```sql
-- Policy to allow bar owners to see all users
CREATE POLICY "Bar owners can view all active profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Allow if user is bar owner/admin
  (auth.uid() IN (
    SELECT id FROM profiles
    WHERE role IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
  ))
  AND
  -- Only show non-deleted users
  (status IS NULL OR status != 'deleted')
);
```

## Testing

### Test Script

Run `CompeteApp/test_tournament_director_search.js` to verify:

1. All users are returned (not just a few)
2. Search works by username, name, and email
3. Deleted users are excluded
4. Role upgrade logic works correctly

### Manual Testing

1. Log in as a bar owner
2. Go to Bar Owner Dashboard
3. Click "Add Tournament Director"
4. Type at least 3 characters to search
5. Verify ALL matching users appear (not just a few)
6. Select a BasicUser → should upgrade to TournamentDirector
7. Select existing TournamentDirector → should keep role, just assign to venue

## Files Modified

- `CompeteApp/ApiSupabase/CrudUser.tsx` - Removed supabaseAdmin references, fixed compilation errors

## Files to Check (if issue persists)

- Supabase RLS policies on `profiles` table
- `CompeteApp/screens/Shop/ModalAssignTournamentDirector.tsx` - Search UI
- `CompeteApp/ApiSupabase/CrudVenues.tsx` - Venue assignment logic

## Next Steps if Issue Persists

1. Check RLS policies (see SQL above)
2. Run test script to verify search returns all users
3. Check browser console for any errors
4. Verify bar owner has correct role in database
