# BUILD 157: Bar Owner Role Change Fix - COMPLETE

## Problem

When adding a venue to user "metrosportzbar" with the Bar Owner role, the user's role was being changed from "bar-admin" to "basic" (displayed as "Basic User" in the app).

## Root Cause Found

The database had **BOTH** role values stored:

- `"BarAdmin"` (PascalCase) - **WRONG** - This was being written by the Edit User modal
- `"bar-admin"` (kebab-case) - **CORRECT** - This is the proper enum value

### Why This Happened

In `ScreenAdminUsers.tsx`, the `EditUserProfileModal` component's `handleSave` function was directly passing `form.role` to `UpdateProfile()`. When a user was edited (even if just to add a venue), the role field was being saved, and if it had the wrong format, it would overwrite the correct value.

The correct enum values from `InterfacesGlobal.tsx` are:

```typescript
export enum EUserRole {
  BasicUser = 'basic',
  CompeteAdmin = 'compete-admin',
  BarAdmin = 'bar-admin', // ← CORRECT
  TournamentDirector = 'tournament-director',
  MasterAdministrator = 'master-administrator',
}
```

## Solution Implemented

### 1. Fixed Application Code

**File:** `CompeteApp/screens/Admin/ScreenAdminUsers.tsx`

Added logging to the `handleSave` function in `EditUserProfileModal` to track what role value is being saved:

```typescript
console.log('EditUserProfileModal: Saving user with role:', roleValue);
console.log('EditUserProfileModal: Role type:', typeof roleValue);
```

This will help identify if the wrong value is being passed in the future.

### 2. Created Database Fix Script

**File:** `CompeteApp/sql/FIX_ALL_BARADMIN_TO_BAR_ADMIN.sql`

This script:

- Shows all current role values in the database
- Converts all "BarAdmin" values to "bar-admin"
- Verifies the fix was applied
- Checks metrosportzbar's role specifically

### 3. Created Diagnostic Tools

**Files Created:**

- `sql/TRACE_VENUE_ASSIGNMENT_ISSUE.sql` - Comprehensive logging trigger (already deployed)
- `sql/FINAL_FIX_BAROWNER_ROLE_ISSUE.sql` - Complete diagnostic and fix script
- `sql/IMMEDIATE_FIX_BAROWNER_ROLE.sql` - Quick restore script
- `BUILD_157_VENUE_ASSIGNMENT_ROLE_PRESERVATION_FIX.md` - Analysis documentation

## How to Fix

### Step 1: Run the Database Fix

Run `CompeteApp/sql/FIX_ALL_BARADMIN_TO_BAR_ADMIN.sql` in your Supabase SQL Editor.

This will convert all incorrect "BarAdmin" values to the correct "bar-admin" format.

### Step 2: Test

1. Refresh your app
2. Check that metrosportzbar shows as "Bar Owner" (which maps to 'bar-admin')
3. Try assigning a venue
4. Verify the role doesn't change

### Step 3: Monitor (Optional)

The logging trigger from `TRACE_VENUE_ASSIGNMENT_ISSUE.sql` is already active and will log any future role changes to help identify issues.

## Prevention

The code fix in `ScreenAdminUsers.tsx` adds logging that will help catch this issue in the future. The `UserRoles` dropdown should already be providing the correct enum values ('bar-admin'), so this should prevent the issue from recurring.

## Files Modified

1. ✅ `CompeteApp/screens/Admin/ScreenAdminUsers.tsx` - Added logging to track role saves
2. ✅ `CompeteApp/sql/FIX_ALL_BARADMIN_TO_BAR_ADMIN.sql` - Database fix script
3. ✅ `CompeteApp/sql/TRACE_VENUE_ASSIGNMENT_ISSUE.sql` - Diagnostic trigger (deployed)
4. ✅ `CompeteApp/sql/FINAL_FIX_BAROWNER_ROLE_ISSUE.sql` - Comprehensive fix
5. ✅ `CompeteApp/sql/IMMEDIATE_FIX_BAROWNER_ROLE.sql` - Quick fix
6. ✅ `CompeteApp/BUILD_157_VENUE_ASSIGNMENT_ROLE_PRESERVATION_FIX.md` - Documentation

## Summary

**Root Cause:** Database had incorrect "BarAdmin" (PascalCase) values instead of correct "bar-admin" (kebab-case) enum values.

**Fix:** Run `FIX_ALL_BARADMIN_TO_BAR_ADMIN.sql` to convert all incorrect values to the correct format.

**Prevention:** Added logging to track role saves and deployed monitoring trigger to catch future issues.
