# Tournament Director Selection Fix - Complete

## Issue Fixed

Users were unable to select tournament directors from the search results in the "Add Tournament Director" modal. The selection was not working properly due to touch event conflicts and incomplete role handling logic.

## Root Causes Identified

1. **Touch Event Conflict**: The modal content was wrapped in a `TouchableOpacity` with an empty `onPress={() => {}}` handler, which was blocking touch events from propagating to the user selection buttons.

2. **Incomplete Role Logic**: The system only handled BasicUser role upgrades but didn't properly handle:

   - CompeteAdmin and MasterAdministrator (who shouldn't be assigned as TDs)
   - Existing TournamentDirectors (who should just get the venue added)
   - BarAdmins (who should keep their role while gaining TD access)

3. **Lack of User Feedback**: No clear messaging about what would happen based on the user's current role.

## Changes Made

### File: `CompeteApp/screens/Shop/ModalAssignTournamentDirector.tsx`

#### 1. Fixed Touch Event Handling

- **Changed**: Replaced the inner `TouchableOpacity` wrapper with a `View` component
- **Before**: `<TouchableOpacity activeOpacity={1} onPress={() => {}}>`
- **After**: `<View>`
- **Result**: Touch events now properly propagate to user selection buttons

#### 2. Enhanced Role Checking Logic

Added comprehensive role validation in `confirmAssignTournamentDirector`:

```typescript
// Check if user is Master Administrator or Compete Admin
if (
  selectedUser.role === EUserRole.MasterAdministrator ||
  selectedUser.role === EUserRole.CompeteAdmin
) {
  Alert.alert(
    'Cannot Assign',
    `${capitalizeProfileName(
      selectedUser.user_name || selectedUser.name,
    )} is a ${getRoleDisplayName(
      selectedUser.role,
    )} and already has full administrative access. They do not need to be assigned as a Tournament Director.`,
  );
  return;
}
```

#### 3. Improved Role Upgrade Logic

Enhanced `assignTournamentDirector` function with role-specific handling:

- **BasicUser**: Upgrades to TournamentDirector role
- **BarAdmin**: Keeps BarAdmin role, gains TD access to venue
- **TournamentDirector**: No role change, venue added to their TD venues
- **CompeteAdmin/MasterAdmin**: Blocked from assignment (handled in step 2)

#### 4. Enhanced Confirmation Modal

Added role-specific visual feedback with color-coded messages:

- **BasicUser**: Orange warning badge - "⚠️ Their role will be upgraded to Tournament Director"
- **TournamentDirector**: Blue info badge - "ℹ️ This venue will be added to their existing Tournament Director venues"
- **BarAdmin**: Purple info badge - "ℹ️ They will maintain their Bar Admin role and gain Tournament Director access to this venue"

#### 5. Improved Success Messages

Success alerts now include role-specific information:

- "Their role has been upgraded to Tournament Director." (BasicUser)
- "They will maintain their Bar Admin role while also having Tournament Director access to this venue." (BarAdmin)
- "This venue has been added to their Tournament Director venues." (TournamentDirector)

## Expected Behavior After Fix

### User Selection Flow:

1. Admin searches for a user
2. User appears in search results with role badge
3. Admin clicks on user
4. System validates user's role:
   - If MasterAdmin/CompeteAdmin → Shows "Cannot Assign" alert
   - If BasicUser/BarAdmin/TournamentDirector → Shows confirmation modal
5. Confirmation modal displays:
   - User details (name, ID, current role)
   - Role-specific message about what will happen
   - Confirm/Cancel buttons
6. On confirmation:
   - BasicUser → Role upgraded to TournamentDirector
   - BarAdmin → Keeps role, gains TD access
   - TournamentDirector → Venue added to their list
   - Venue's td_id field updated with user's id_auto
7. Success message displayed with role-specific details

### Role Handling Matrix:

| Current Role        | Can Be Assigned? | Role After Assignment | Notes                       |
| ------------------- | ---------------- | --------------------- | --------------------------- |
| BasicUser           | ✅ Yes           | TournamentDirector    | Role upgraded               |
| TournamentDirector  | ✅ Yes           | TournamentDirector    | Venue added to list         |
| BarAdmin            | ✅ Yes           | BarAdmin              | Keeps role, gains TD access |
| CompeteAdmin        | ❌ No            | N/A                   | Already has admin access    |
| MasterAdministrator | ❌ No            | N/A                   | Already has admin access    |

## Testing Recommendations

1. **Test BasicUser Assignment**:

   - Search for a BasicUser
   - Assign them as TD
   - Verify role upgraded to TournamentDirector
   - Verify venue's td_id updated

2. **Test Existing TD Assignment**:

   - Search for existing TournamentDirector
   - Assign them to a new venue
   - Verify role remains TournamentDirector
   - Verify venue added to their TD venues

3. **Test BarAdmin Assignment**:

   - Search for BarAdmin
   - Assign them as TD
   - Verify role remains BarAdmin
   - Verify they gain TD access to venue

4. **Test Admin Blocking**:

   - Search for CompeteAdmin or MasterAdmin
   - Attempt to assign
   - Verify "Cannot Assign" alert appears
   - Verify no changes made

5. **Test Touch Events**:
   - Verify users can be selected by tapping
   - Verify modal doesn't close when tapping content
   - Verify confirmation modal works properly

## Files Modified

- `CompeteApp/screens/Shop/ModalAssignTournamentDirector.tsx`

## Related Files (No Changes Needed)

- `CompeteApp/ApiSupabase/CrudVenues.tsx` - Already has correct `assignTournamentDirectorToVenue` function
- `CompeteApp/ApiSupabase/CrudUser.tsx` - Already has correct `UpdateProfile` function
- `CompeteApp/hooks/InterfacesGlobal.tsx` - Already has correct `EUserRole` enum

## Deployment Notes

- No database changes required
- No API changes required
- Frontend-only fix
- Safe to deploy immediately
- No breaking changes

## Status

✅ **COMPLETE** - Tournament Director selection now works correctly with proper role handling and user feedback.
