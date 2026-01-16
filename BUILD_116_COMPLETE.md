# Build 116 - Tournament Director Search & Login Fix Complete

## Build Information

- **Build Number**: 116 (iOS & Android)
- **Version**: 1.0.2
- **Date**: 2024

## Changes in This Build

### 1. Tournament Director Search Fix

Fixed the issue where bar owners couldn't search through all users when adding tournament directors.

**Code Changes:**

- `CompeteApp/ApiSupabase/CrudUser.tsx`
  - Removed all `supabaseAdmin` references (fixed compilation errors)
  - Fixed `SignUp` function - removed admin user creation path
  - Fixed `DeleteUser` function - now uses regular `supabase` client

### 2. Login Functionality Restored

Fixed critical login issue caused by overly restrictive RLS policy.

**Database Changes:**

- Created two RLS policies via `EMERGENCY_FIX_LOGIN_RLS.sql`:
  1. **"Users can view own profile"** - Allows all users to login
  2. **"Admins and bar owners can view all profiles"** - Allows tournament director search

## How It Works

### Login Flow

- All users can now see their own profile (required for login)
- Authentication works for all user roles

### Tournament Director Search

- Bar owners can search ALL users (not role-specific)
- Search works by username, name, and email (case-insensitive)
- No artificial limits on results

### Assignment Logic

When assigning a tournament director:

- If user is **BasicUser** → upgrades to **TournamentDirector** role
- If user is already **TournamentDirector** or **MasterAdministrator** → keeps role, just assigns to venue

## Database Policies Applied

### Policy 1: Users Can View Own Profile

```sql
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

### Policy 2: Admins and Bar Owners Can View All Profiles

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

## Files Modified

- `CompeteApp/ApiSupabase/CrudUser.tsx` - Removed supabaseAdmin references
- `CompeteApp/app.json` - Updated build number to 116

## Files Created

- `CompeteApp/BUILD_116_COMPLETE.md` - This file
- `CompeteApp/BUILD_115_TOURNAMENT_DIRECTOR_SEARCH_FIX.md` - Build 115 notes
- `CompeteApp/TODO_tournament_director_search_fix.md` - Detailed fix documentation
- `CompeteApp/sql/fix_tournament_director_search_rls.sql` - Original RLS fix (too restrictive)
- `CompeteApp/sql/EMERGENCY_FIX_LOGIN_RLS.sql` - Corrected RLS policies

## Testing Completed

✅ Database RLS policies verified (screenshot confirmed)
✅ Login functionality restored
✅ Tournament director search enabled for bar owners

## Deployment Status

- **Code**: ✅ Ready for deployment
- **Database**: ✅ Policies applied and verified
- **Build Number**: ✅ Updated to 116

## Known Issues

None - all functionality restored and working correctly.
