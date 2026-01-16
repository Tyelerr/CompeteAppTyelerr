# Recurring Tournament Archival Issue - Analysis

## Problem

The 2 "metro chip tournament" entries (IDs 19 and 20, both dated 2025-10-28) keep persisting even after running the archival function. They appear to be part of a recurring tournament series.

## Root Cause Analysis

### How the Archival Function Works:

```sql
archive_expired_tournaments() does:
1. Archive tournaments where start_date <= CURRENT_DATE
2. Call generate_recurring_tournaments()
3. generate_recurring_tournaments() maintains 4 future instances per series
```

### The Problem:

If these tournaments are part of a recurring series:

1. They get archived (because start_date < today)
2. The function sees the series now has < 4 future tournaments
3. It regenerates new instances, but the logic might be flawed
4. New tournaments get created, possibly with past dates
5. Cycle repeats

## Verification Steps

### Step 1: Check if they're recurring

Run `diagnose_recurring_tournaments.sql` to see:

- Are these tournaments part of a recurring series?
- What is their `recurring_series_id`?
- Are they marked as `is_recurring = true`?

### Step 2: Check the generation logic

The `generate_recurring_tournaments()` function:

```sql
-- Finds series with < 4 future tournaments
SELECT recurring_series_id, COUNT(*)
FROM tournaments
WHERE recurring_series_id IS NOT NULL
AND start_date >= CURRENT_DATE  -- Only counts FUTURE tournaments
AND status = 'active'
GROUP BY recurring_series_id
HAVING COUNT(*) < 4
```

**Potential Issue**: If ALL tournaments in a series are past dates:

- Count = 0 (no future tournaments)
- Function tries to generate 4 new ones
- But it calculates new dates by adding weeks to the LATEST date in the series
- If latest date is in the past, new tournaments are also in the past!

## Solutions

### Solution 1: Delete the Entire Recurring Series (Recommended)

If you don't want this tournament anymore:

```sql
-- Run fix_recurring_tournament_issue.sql
-- This deletes ALL tournaments in the series
```

### Solution 2: Fix the Generation Logic

Modify `generate_recurring_tournaments()` to:

- Start from TODAY, not from the latest tournament date
- Only generate tournaments with future dates
- Skip series where all tournaments are past

### Solution 3: Disable Recurring for These Tournaments

```sql
UPDATE tournaments
SET is_recurring = false,
    recurring_series_id = NULL
WHERE id_unique_number IN (19, 20);
```

## Recommended Action

**For immediate cleanup:**

1. Run `fix_recurring_tournament_issue.sql` to delete the entire series
2. This prevents regeneration

**For long-term fix:**

1. Modify `generate_recurring_tournaments()` to check if latest date is in the past
2. If so, start from CURRENT_DATE instead of latest tournament date
3. This prevents creating tournaments with past dates

## Testing

After running the fix:

```sql
-- Should return 0
SELECT COUNT(*) FROM tournaments WHERE tournament_name LIKE '%metro chip%';

-- Should show no recurring series or only future ones
SELECT recurring_series_id, COUNT(*), MIN(start_date), MAX(start_date)
FROM tournaments
WHERE recurring_series_id IS NOT NULL
GROUP BY recurring_series_id;
```
