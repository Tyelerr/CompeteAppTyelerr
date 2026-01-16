# Build 138 - Tournament Director Assignment Database Fix

## Problem Identified

The error "No rows updated for venue ID: 7" indicates that the RLS (Row Level Security) policies on the `venues` table are blocking the update of the `td_id` field.

## Root Cause

The `assignTournamentDirectorToVenue` function in `CrudVenues.tsx` is correctly trying to:

1. Update the `venues` table
2. Set the `td_id` field to the selected user's `id_auto`
3. For the venue with the specified `id`

However, the database RLS policies are preventing this update from happening.

## The Fix

### SQL Script Created: `CompeteApp/sql/fix_venues_td_assignment_rls.sql`

This script will:

1. Check current RLS policies on the `venues` table
2. Drop any restrictive UPDATE policies
3. Create a new policy that allows:
   - Bar owners to update `td_id` for their own venues (where `barowner_id` matches their `id_auto`)
   - Admins to update any venue

### How to Apply

**IMPORTANT**: You must run this SQL in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `CompeteApp/sql/fix_venues_td_assignment_rls.sql`
4. Click "Run"

## What the Code is Already Doing Correctly

The `assignTournamentDirectorToVenue` function in `CrudVenues.tsx` is:

- ✅ Correctly targeting the `venues` table
- ✅ Correctly updating the `td_id` field
- ✅ Using the user's `id_auto` (profile ID) as the value
- ✅ Matching by venue `id`

The issue is purely a database permission problem, not a code problem.

## Expected Behavior After SQL Fix

1. Bar owner clicks "Add Tournament Director"
2. Selects a venue (if multiple)
3. Searches for and selects a user
4. Confirms assignment
5. **Database UPDATE succeeds** (currently failing due to RLS)
6. User's `id_auto` is stored in `venues.td_id`
7. Success message appears
8. Directors list refreshes

## Files in This Build

1. `CompeteApp/screens/BarOwner/ScreenBarOwnerDashboard.tsx` - Uses ModalAssignTournamentDirector
2. `CompeteApp/app.json` - Build 138
3. `CompeteApp/sql/fix_venues_td_assignment_rls.sql` - **MUST BE RUN IN SUPABASE**
4. `CompeteApp/BUILD_138_TD_ASSIGNMENT_DATABASE_FIX.md` - This file

## Status

- ✅ Code is correct
- ⚠️ **DATABASE FIX REQUIRED** - Run the SQL script in Supabase
- ✅ Build 138 ready for deployment AFTER database fix

## Next Steps

1. **FIRST**: Run `CompeteApp/sql/fix_venues_td_assignment_rls.sql` in Supabase SQL Editor
2. **THEN**: Deploy Build 138 to TestFlight
3. Test the Tournament Director assignment flow

The assignment will work once the RLS policy is updated in the database.
