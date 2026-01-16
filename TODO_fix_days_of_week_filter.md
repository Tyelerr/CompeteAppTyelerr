# Fix Days of Week Filter Issue

## Problem Identified

The days of the week filtering is not working correctly due to incorrect conversion between frontend day indices and PostgreSQL day-of-week values.

## Root Cause

- Frontend uses 0-based indexing: 0=Monday, 1=Tuesday, ..., 6=Sunday
- PostgreSQL EXTRACT(DOW) returns: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
- Current conversion logic incorrectly maps days (off by 1)

## Current Incorrect Logic

```javascript
const postgresqlDays = filters.daysOfWeek.map((frontendDay) => {
  if (frontendDay === 6) {
    return 1; // Sunday -> Should be 0
  } else {
    return frontendDay + 2; // Off by 1
  }
});
```

## Correct Logic

```javascript
const postgresqlDays = filters.daysOfWeek.map((frontendDay) => {
  if (frontendDay === 6) {
    return 0; // Sunday
  } else {
    return frontendDay + 1; // Monday(0)->1, Tuesday(1)->2, etc.
  }
});
```

## Tasks

- [x] Identify the issue
- [x] Fix the conversion logic in CrudTournament.tsx
- [x] Implement client-side filtering for days of week
- [x] Apply filter to both main query and count query
- [x] Fix variable naming from PostgreSQL to JavaScript
- [x] Update comments to reflect JavaScript Date.getDay() usage
- [ ] Test the fix
- [ ] Update documentation

## Files to Update

- CompeteApp/ApiSupabase/CrudTournament.tsx (line ~1050 in FetchTournaments_Filters function)
