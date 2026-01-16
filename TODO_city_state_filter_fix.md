# City and State Filter Fix

## Issue

When users select a city or state in the LocationFilters component, the filtering doesn't work because the database query in `FetchTournaments_Filters` doesn't apply city/state filters.

## Analysis

- ✅ Zip code filtering works (uses radius-based geocoding)
- ❌ City filtering doesn't work (not applied to database query)
- ❌ State filtering doesn't work (not applied to database query)
- ❌ Count is incorrect because count query also doesn't apply city/state filters

## Root Cause

In `CompeteApp/ApiSupabase/CrudTournament.tsx`, the `FetchTournaments_Filters` function builds a Supabase query but never applies the `filters.city` or `filters.state` parameters to filter tournaments by venue location.

## Solution

Add city and state filtering logic to the database query in `FetchTournaments_Filters`:

1. Filter by `venues.city` when `filters.city` is provided
2. Filter by `venues.state` when `filters.state` is provided
3. Apply the same filters to the count query for accurate pagination

## Files to Edit

- `CompeteApp/ApiSupabase/CrudTournament.tsx`

## Steps

- [x] Add city filtering to main query
- [x] Add state filtering to main query
- [x] Add city filtering to count query
- [x] Add state filtering to count query
- [x] Update ScreenBilliardHome.tsx to use fixed CrudTournament file
- [x] Fix syntax errors in original CrudTournament.tsx file
- [x] Restore proper import paths
- [x] Ready for testing

## Changes Made

1. Created `CompeteApp/ApiSupabase/CrudTournament_CityStateFixed.tsx` with proper city and state filtering
2. Added `query.eq('venues.city', filters.city)` to filter tournaments by venue city
3. Added `query.eq('venues.state', filters.state)` to filter tournaments by venue state
4. Added same filters to count query for accurate pagination
5. Copied the fixed version over the original `CrudTournament.tsx` file
6. Updated `CompeteApp/screens/Billiard/ScreenBilliardHome.tsx` to use the standard import path

## Fix Summary

The issue was that the `FetchTournaments_Filters` function in `CrudTournament.tsx` was not applying city and state filters to the database query, even though the UI components were correctly passing these filters through the chain. The fix adds the missing database filtering logic for both the main query and the count query.

## Status: UPDATED WITH ADDRESS-BASED FILTERING

### Issue Found

The original venue-based filtering approach was failing because tournaments don't have proper venue_id relationships or the venues table doesn't have city/state data populated.

### New Approach

Created `CompeteApp/ApiSupabase/CrudTournament_AddressBased.tsx` that filters tournaments by searching the `address` field directly:

- City filtering: `query.ilike('address', '%${filters.city}%')`
- State filtering: `query.ilike('address', '%${filters.state}%')`

This approach is more reliable because:

1. Every tournament has an address field
2. Address fields typically contain city and state information
3. No dependency on venue table relationships
4. Works with existing data structure

### Changes Made

1. Created address-based filtering version
2. Updated ScreenBilliardHome.tsx to use the new approach
3. Applied same filtering logic to count query for accurate pagination

The city and state filtering should now work properly by searching tournament addresses for the selected city or state names.
