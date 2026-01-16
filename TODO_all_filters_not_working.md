# All Filters Not Working - Troubleshooting Guide

## Issue

After fixing equipment, game_type, and format filters, user reports that:

- Days of the week filter is not working
- Date range filter is not working
- Entry fee filter is not working

## Root Cause Analysis

The filter logic in `CrudTournament.tsx` appears correct:

- ✅ Entry fee filters use `.gte()` and `.lte()`
- ✅ Date range filters use `.gte()` and `.lte()`
- ✅ Days of week filter uses client-side filtering after query

## Most Likely Causes

### 1. **App Not Reloaded with New Code** (MOST LIKELY)

The app may still be running old cached code. The user needs to:

- **Close the app completely** (not just minimize)
- **Clear app cache** if possible
- **Restart the app**
- Or **rebuild the app** with the new build number (32)

### 2. **Filters Not Being Passed from UI**

The filter modal might not be passing the filter values correctly to the query function.

### 3. **Filter Values Not Set Correctly**

The filter state in `ScreenBilliardModalFilters.tsx` might not be setting values correctly.

## Quick Fix Steps

### Step 1: Verify App is Using New Code

1. Check that build number shows as 32 in the app
2. If not, rebuild and reinstall the app

### Step 2: Check Console Logs

The `CrudTournament.tsx` file has console.log statements for date filters:

```typescript
console.log(`Applying dateFrom filter: ${filters.dateFrom}`);
console.log(`Applying dateTo filter: ${filters.dateTo}`);
```

Check if these logs appear when applying filters.

### Step 3: Verify Filter Values in Modal

Add console.logs in `ScreenBilliardModalFilters.tsx` when "Apply Filters" is clicked to see what values are being sent.

## Files Involved

1. **CompeteApp/ApiSupabase/CrudTournament.tsx** - Query logic (appears correct)
2. **CompeteApp/screens/Billiard/ScreenBilliardModalFilters.tsx** - Filter UI
3. **CompeteApp/screens/Billiard/ScreenBilliardHome.tsx** - Calls the query function

## Recommendation

**FIRST**: Have the user completely close and restart the app, or rebuild with build number 32.

**IF THAT DOESN'T WORK**: We need to add debug logging to trace where the filters are being lost in the chain from UI → Query.
