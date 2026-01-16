# BUILD 162 - Import Errors to Fix

## Issue

After cleaning up temporary files and restoring the working `CrudTournament.tsx`, there are 3 screen files that still have imports from the deleted `CrudTournament_Fixed.tsx` file:

1. `CompeteApp/screens/ProfileLogged/ProfileLoggedFavoriteTournaments.tsx`
2. `CompeteApp/screens/Billiard/ScreenBilliardThumbDetails.tsx`
3. `CompeteApp/screens/Billiard/ScreenBilliardListTournaments.tsx`

## Root Cause

The `CrudTournament_Fixed.tsx` file was deleted during cleanup, but these screen files were not updated to use the correct import path.

## Missing Functions

These files are trying to import:

- `AddTournamentLike`
- `FetchTournaments_LikedByUser`

These functions are NOT in the current `CrudTournament.tsx` file (which only has filter-related functions).

## Solution Options

### Option 1: Check CrudTournamentViews.tsx

These functions might be in `CrudTournamentViews.tsx`. Check if they exist there and update the imports.

### Option 2: Re-add Missing Functions

If the functions don't exist anywhere, they need to be re-added to `CrudTournament.tsx` from a backup or VSCode Timeline.

### Option 3: Use Backup Files

The backup directory `screens_BACKUP_BUILD54` has working versions of these files that might have the correct imports.

## Files to Fix

```typescript
// Change this:
import {
  AddTournamentLike,
  FetchTournaments_LikedByUser,
} from '../../ApiSupabase/CrudTournament_Fixed';

// To this (if functions are in CrudTournamentViews):
import {
  AddTournamentLike,
  FetchTournaments_LikedByUser,
} from '../../ApiSupabase/CrudTournamentViews';

// Or to this (if functions are in main CrudTournament):
import {
  AddTournamentLike,
  FetchTournaments_LikedByUser,
} from '../../ApiSupabase/CrudTournament';
```

## Status

⚠️ **NOT FIXED YET** - These import errors will prevent the app from compiling.

The tournament filters fix (BUILD 162) is complete, but these import errors need to be resolved before deployment.

## Next Steps

1. Check `CrudTournamentViews.tsx` for the missing functions
2. If not there, check VSCode Timeline for `CrudTournament.tsx` to find when these functions existed
3. Re-add the missing functions or update the imports to the correct location
4. Test that the Favorite Tournaments page and tournament details work correctly

---

**Priority**: HIGH - Blocks compilation
