# Build 115 - Tournament Director Search Fix

## Build Information

- **Build Number**: 115 (iOS & Android)
- **Version**: 1.0.2
- **Date**: 2024

## Changes in This Build

### Tournament Director Search Fix

Fixed the issue where bar owners couldn't search through all users when adding tournament directors in the bar owner dashboard.

#### Code Changes:

1. **CompeteApp/ApiSupabase/CrudUser.tsx**
   - Removed all `supabaseAdmin` references (compilation errors)
   - Fixed `SignUp` function - removed admin user creation path
   - Fixed `DeleteUser` function - now uses regular `supabase` client

#### Database Changes Required:

2. **SQL Script Created**: `CompeteApp/sql/fix_tournament_director_search_rls.sql`
   - Creates RLS policy to allow bar owners to view all active profiles
   - Must be run in Supabase SQL Editor

#### Documentation:

3. **CompeteApp/TODO_tournament_director_search_fix.md**
   - Complete documentation of the issue and solution
   - Testing instructions
   - Troubleshooting guide

## How It Works

### Search Functionality

- `FetchUsersV2` searches ALL users when no role filter is provided
- Searches by username, name, and email (case-insensitive)
- Excludes deleted users
- No artificial limits on results

### Assignment Logic

When assigning a tournament director:

- If user is **BasicUser** → upgrades to **TournamentDirector** role
- If user is already **TournamentDirector** or **MasterAdministrator** → keeps role, just assigns to venue

## Deployment Steps

1. **Update app.json** ✅ (Build number updated to 115)
2. **Deploy code changes** ✅ (CrudUser.tsx fixed)
3. **Run SQL script** ⚠️ (Must be done manually in Supabase)
4. **Test the search** (Verify all users appear in search)

## SQL Script to Run

Open Supabase SQL Editor and run:

```sql
-- File: CompeteApp/sql/fix_tournament_director_search_rls.sql
```

This creates the policy:

```sql
CREATE POLICY "Bar owners can view all active profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid())
  IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
  AND
  (status IS NULL OR status != 'deleted')
);
```

## Testing Checklist

- [ ] Run SQL script in Supabase
- [ ] Log in as bar owner
- [ ] Navigate to Bar Owner Dashboard
- [ ] Click "Add Tournament Director"
- [ ] Search for users (type at least 3 characters)
- [ ] Verify ALL matching users appear (not just a few)
- [ ] Select a BasicUser → verify role upgrades to TournamentDirector
- [ ] Select existing TournamentDirector → verify role stays, venue assignment works

## Files Modified

- `CompeteApp/ApiSupabase/CrudUser.tsx`
- `CompeteApp/app.json` (build number)

## Files Created

- `CompeteApp/TODO_tournament_director_search_fix.md`
- `CompeteApp/sql/fix_tournament_director_search_rls.sql`
- `CompeteApp/BUILD_115_TOURNAMENT_DIRECTOR_SEARCH_FIX.md`

## Known Issues

None - the code changes fix compilation errors. The search limitation is due to RLS policies which must be fixed via the SQL script.

## Rollback Plan

If issues occur:

1. Revert to Build 114
2. The SQL policy can be dropped if needed:
   ```sql
   DROP POLICY IF EXISTS "Bar owners can view all active profiles" ON profiles;
   ```
