# Tournament Display Fix for Master-Administrators

## Problem Identified

The billiards page is not displaying all tournaments for the `tmoneyhill` master-administrator account because of restrictive filters in `FetchTournaments_Filters`:

1. **Status Filter**: Only shows tournaments with `status = 'active'`
2. **Date Filter**: Only shows tournaments from today onwards (`start_date >= today`)

### Current Behavior

- Total tournaments in database: **6**
- Tournaments shown to master-admin: **4** (only future/today tournaments)
- Tournaments hidden: **2** (past tournaments)

### Expected Behavior for Master-Administrators

Master-administrators should see **ALL tournaments** regardless of:

- Status (active, archived, cancelled, completed)
- Date (past, present, future)

## Solution

Modify `FetchTournaments_Filters` in `CrudTournament.tsx` to:

1. Accept an optional `userRole` parameter
2. Skip status and date filters for master-administrators and administrators
3. Keep filters for regular users (for performance and UX)

## Implementation

### Option 1: Pass User Role to Filter Function (Recommended)

Modify the function signature to accept user role and conditionally apply filters.

### Option 2: Add Admin-Specific Filter Flag

Add a flag like `showAllTournaments` that bypasses restrictive filters.

### Option 3: Create Separate Admin Function

Create `FetchAllTournaments_Admin` specifically for administrators.

## Files to Modify

1. **CompeteApp/ApiSupabase/CrudTournament.tsx**
   - Modify `FetchTournaments_Filters` function
2. **CompeteApp/screens/Billiard/ScreenBilliardHome.tsx**
   - Pass user role to the fetch function
3. **CompeteApp/hooks/InterfacesGlobal.tsx** (if needed)
   - Add `userRole` to `ITournamentFilters` interface

## Testing

After implementing the fix:

1. Login as `tmoneyhill` (master-administrator)
2. Navigate to billiards page
3. Verify all 6 tournaments are displayed
4. Test with regular user account to ensure filters still work

## Database Info

- Column name in profiles table: `user_name` (not `username`)
- Role values: `master-administrator`, `administrator`, `bar-owner`, `user`, etc.
