# BUILD 179 - Tournament Pagination Fix FINAL

## Issue

Billiards page shows "Total count: 20 Displaying 1-20" with no pagination arrows, despite having 27+ displayable tournaments.

## Root Cause (SQL Diagnostic Confirmed)

Database has 30 tournaments:

- **3 master templates** (IDs: 21, 13, 36) with `is_recurring_master = true` - Should be HIDDEN
- **27 real tournaments** with `is_recurring_master = false` - Should be DISPLAYED

Master templates were being included in counts, causing incorrect pagination.

## Fix Applied

### File: `CompeteApp/ApiSupabase/CrudTournament.tsx`

Changed filter to exclude master templates using `.not()` syntax:

```typescript
// Main query (line ~467)
query = query.not('is_recurring_master', 'eq', true);
```

This excludes all tournaments where `is_recurring_master = true`.

### File: `CompeteApp/app.json`

- iOS buildNumber: 178 → 179
- Android versionCode: 178 → 179

## Expected Result

**Current (BUILD 178):** "Total count: 20 Displaying 1-20" (no arrows)

**After BUILD 179:** "Total count: 27 Displaying 1-20" (with ← → arrows)

**Pagination Navigation:**

- Page 1: Shows tournaments 1-20
- Click → arrow: Shows tournaments 21-27 (replaces 1-20 in same area)
- Click ← arrow: Returns to tournaments 1-20

## Files Modified

1. `CompeteApp/ApiSupabase/CrudTournament.tsx` - Added `.not('is_recurring_master', 'eq', true)` filter
2. `CompeteApp/app.json` - Build 179

## Deployment

Rebuild and redeploy to TestFlight. The pagination arrows will automatically appear when totalCount > 20.

## Build History

- BUILD 176: Added recurring tournament template status
- BUILD 177: First pagination fix attempt (used `.or()` syntax - didn't work in production)
- BUILD 178: Changed to `.not()` syntax
- BUILD 179: Final build number for deployment
