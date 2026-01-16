# BUILD 172 - Tournament Time Timezone Fix

## Issue Fixed

Tournament times were being saved with incorrect timezone conversion, causing times to display incorrectly.

**Problem Example:**

- User enters: 5:30 PM
- System saved: 5:30 PM UTC (with `+00` offset)
- System displayed: 10:30 AM (converted from UTC to local timezone)

## Root Cause

In `CompeteApp/ApiSupabase/CrudTournament.tsx`, the `TournamentObjectToDataForSupabase` function was appending a hardcoded `+00` UTC timezone offset to the timestamp:

```typescript
// BEFORE (Line 60-65)
start_date: `${tournament.start_date} ${tournament.strart_time}:00+00`,
```

This forced the database to interpret the time as UTC, which then got converted when displayed in the user's local timezone.

## Solution Implemented

Removed the hardcoded `+00` timezone offset so the database treats the timestamp as a local time value without timezone conversion:

```typescript
// AFTER (Line 60-65)
start_date: `${tournament.start_date} ${tournament.strart_time}:00`,
```

## Files Modified

1. **CompeteApp/ApiSupabase/CrudTournament.tsx**

   - Line 60-65: Removed `+00` from timestamp formatting
   - Affects both single and recurring tournament creation

2. **CompeteApp/app.json**
   - Updated iOS buildNumber: 171 → 172
   - Updated Android versionCode: 171 → 172

## Impact

✅ **New tournaments**: Will now save and display times correctly without timezone conversion
✅ **Recurring tournaments**: All 4 generated tournaments will preserve the correct time
✅ **User experience**: Times entered will match times displayed

⚠️ **Existing tournaments**: Tournaments already in the database with the old `+00` format may still show incorrect times. These would need to be:

- Re-submitted with the correct time, OR
- Manually corrected in the database if the time discrepancy is critical

## Testing Recommendations

After deployment, verify:

1. Create a new tournament with time 5:30 PM
2. Confirm it displays as 5:30 PM (not 10:30 AM or other converted time)
3. Create a recurring tournament and verify all instances have the correct time
4. Check tournament display in:
   - Tournament list view
   - Tournament details modal
   - Admin tournament management
   - Bar owner dashboard

## Technical Details

- **Database Column**: `start_date` (timestamp field)
- **Format**: `YYYY-MM-DD HH:MM:SS` (without timezone offset)
- **Behavior**: Database treats as local timestamp, no timezone conversion applied
- **User Timezone Display**: Already shown in UI via `getCurrentTimezone()` helper

## Deployment Notes

This is a code-only fix that requires app rebuild and deployment. No database migrations needed.

**Build Number**: 172
**Previous Build**: 171
**Fix Type**: Timezone handling correction
**Breaking Changes**: None (backward compatible)
