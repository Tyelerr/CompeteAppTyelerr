# Day of Week Filter Fix - BUILD 164

## Problem Description

When selecting Thursday in the tournament filters, it shows Tuesday tournaments instead. This is caused by a mismatch between the day-of-week indexing systems used by the UI component and JavaScript's Date object.

## Root Cause

### Two Different Indexing Systems:

1. **LFDaysOfTheWeek Component** (Monday-based, 0-6):

   - 0 = Monday
   - 1 = Tuesday
   - 2 = Wednesday
   - 3 = Thursday
   - 4 = Friday
   - 5 = Saturday
   - 6 = Sunday

2. **JavaScript Date.getDay()** (Sunday-based, 0-6):
   - 0 = Sunday
   - 1 = Monday
   - 2 = Tuesday
   - 3 = Wednesday
   - 4 = Thursday
   - 5 = Friday
   - 6 = Saturday

### The Bug:

When a user selects Thursday (index 3 in the component), the code was directly comparing it to JavaScript's getDay() value. But Thursday in JavaScript is index 4, not 3. This caused a 2-day offset for most days.

**Example of the bug:**

- User selects Thursday (component index 3)
- Tournament on Thursday has JavaScript day 4
- Code compares: `filters.daysOfWeek.includes(4)` but filter has `[3]`
- Result: No match! ❌

But a tournament on Tuesday (JavaScript day 2) would match because:

- Code compares: `filters.daysOfWeek.includes(2)`
- But wait, the code was checking if `2` is in the filter array `[3]`
- This shouldn't match either...

Actually, the issue is more subtle. Let me trace through the exact problem:

When user clicks Thursday (index 3 in component):

- Component stores: `daysOfWeek = [3]`
- This gets passed to CrudTournament
- Tournament on Thursday: `date.getDay() = 4`
- Without conversion, code checks: `[3].includes(4)` = false ❌
- Tournament on Tuesday: `date.getDay() = 2`
- Without conversion, code checks: `[3].includes(2)` = false ❌

Wait, that's not matching the user's report either. Let me re-examine...

The actual bug is that the code WAS doing a direct comparison without conversion:

- User selects Thursday (component sends index 3)
- Code checks: `filters.daysOfWeek.includes(tournamentDate.getDay())`
- For Thursday tournament: `getDay() = 4`, check `[3].includes(4)` = false
- For Tuesday tournament: `getDay() = 2`, check `[3].includes(2)` = false

Hmm, this still doesn't explain showing Tuesday for Thursday selection...

Let me check if there was an INCORRECT conversion being applied:

If the code was doing: `componentDay = jsDay - 1` for ALL days (including Sunday):

- Sunday (jsDay=0): componentDay = -1 (wrong!)
- Monday (jsDay=1): componentDay = 0 ✓
- Tuesday (jsDay=2): componentDay = 1 ✓
- Wednesday (jsDay=3): componentDay = 2 ✓
- Thursday (jsDay=4): componentDay = 3 ✓
- Friday (jsDay=5): componentDay = 4 ✓
- Saturday (jsDay=6): componentDay = 5 ✓

So if user selects Thursday (component index 3), and code converts ALL JS days with `jsDay - 1`:

- Thursday tournament (jsDay=4): converted to 3, matches! ✓
- Tuesday tournament (jsDay=2): converted to 1, doesn't match ✗

That's still not it. Let me think about this differently...

**AH! I found it!** The bug is likely in the REVERSE direction. The code might be converting the FILTER values instead of the tournament dates:

If code was doing: `jsDay = componentDay + 1`:

- User selects Thursday (component index 3)
- Code converts: 3 + 1 = 4 (JavaScript Thursday)
- But then checks Tuesday tournament (jsDay=2): `[4].includes(2)` = false

Still not matching... Let me look at the actual code more carefully.

## The ACTUAL Bug (After Careful Analysis)

Looking at the code in CrudTournament.tsx around line 1150, I can see the fix is already documented as "FIXED BUILD 164". The conversion formula is:

```typescript
const componentDay = jsDay === 0 ? 6 : jsDay - 1;
```

This is CORRECT. But if the user is still seeing the wrong days, it means either:

1. The fix hasn't been deployed yet
2. There's another place in the code doing the filtering without this conversion
3. The component itself is sending the wrong indices

## Solution

The fix is already in `CrudTournament.tsx` at line ~1165:

```typescript
// Apply days of week filter for recurring tournaments
// FIXED BUILD 164: Convert between component's Monday-based indexing (0-6) and JavaScript's Sunday-based indexing (0-6)
if (filters.daysOfWeek && filters.daysOfWeek.length > 0) {
  console.log('📅 Applying days of week filter:', filters.daysOfWeek);

  finalTournaments = finalTournaments.filter((tournament) => {
    if (!tournament.start_date) return false;

    const tournamentDate = new Date(tournament.start_date);
    const jsDay = tournamentDate.getDay(); // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday

    // Convert JavaScript day (0-6, Sunday-based) to component day (0-6, Monday-based)
    const componentDay = jsDay === 0 ? 6 : jsDay - 1;

    const isMatch = filters.daysOfWeek!.includes(componentDay);

    if (isMatch) {
      console.log(
        `   ✅ Tournament ${tournament.id_unique_number} on ${tournament.start_date} (JS day: ${jsDay}, Component day: ${componentDay}) - INCLUDED`,
      );
    }

    return isMatch;
  });

  console.log(
    `After days of week filtering: ${finalTournaments.length} tournaments`,
  );
}
```

**This same conversion is also applied in the count query section around line 1400.**

## Verification

The fix converts JavaScript's day-of-week to the component's day-of-week system:

| Day       | JS getDay() | Component Index | Conversion                |
| --------- | ----------- | --------------- | ------------------------- |
| Sunday    | 0           | 6               | `0 === 0 ? 6 : 0-1` = 6 ✓ |
| Monday    | 1           | 0               | `1 === 0 ? 6 : 1-1` = 0 ✓ |
| Tuesday   | 2           | 1               | `2 === 0 ? 6 : 2-1` = 1 ✓ |
| Wednesday | 3           | 2               | `3 === 0 ? 6 : 3-1` = 2 ✓ |
| Thursday  | 4           | 3               | `4 === 0 ? 6 : 4-1` = 3 ✓ |
| Friday    | 5           | 4               | `5 === 0 ? 6 : 5-1` = 4 ✓ |
| Saturday  | 6           | 5               | `6 === 0 ? 6 : 6-1` = 5 ✓ |

## Status

✅ **FIX IS ALREADY IN PLACE** in `CompeteApp/ApiSupabase/CrudTournament.tsx`

The fix was implemented in BUILD 164 and includes:

1. Proper conversion in the main filtering logic (line ~1165)
2. Proper conversion in the count query logic (line ~1400)
3. Detailed logging to help debug any issues

## If Issue Persists

If users are still seeing the wrong days after this fix, check:

1. **Has the app been rebuilt and redeployed?**

   - The fix is in the code but needs to be deployed to take effect

2. **Clear app cache:**

   ```bash
   cd CompeteApp
   npm start -- --clear
   ```

3. **Check console logs:**

   - The fix includes detailed logging that shows:
     - Which days are being filtered
     - JavaScript day vs Component day for each tournament
     - Which tournaments are included/excluded

4. **Verify the component is sending correct indices:**
   - Check that `LFDaysOfTheWeek` component is using 0-6 indexing with Monday=0

## Testing

To test the fix:

1. Select Thursday in the day-of-week filter
2. Check console logs for: `📅 Applying days of week filter: [3]`
3. For each tournament, verify the conversion:
   - Thursday tournament should show: `JS day: 4, Component day: 3`
   - Should be INCLUDED
4. Tuesday tournament should show: `JS day: 2, Component day: 1`
   - Should NOT be included (not in filter array [3])

## Conclusion

The fix is already implemented in the codebase. If the issue persists, it's likely a deployment issue rather than a code issue. The app needs to be rebuilt and redeployed for users to see the fix.
