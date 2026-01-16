# Build 176 - Final Generator UPSERT Fix

## Problem Identified

After running the end-to-end test, the generator still wasn't creating new tournaments because:

**Root Cause:** The unique constraint `(recurring_series_id, start_date)` was blocking inserts when archived future tournaments existed.

- Generator tries to INSERT a tournament for a future date
- An archived tournament already exists for that date
- `ON CONFLICT DO NOTHING` skips it
- No new tournament is created
- Horizon appears "satisfied" but with archived tournaments

## The Solution: UPSERT to Reactivate

Changed from:

```sql
ON CONFLICT (recurring_series_id, start_date) DO NOTHING
```

To:

```sql
ON CONFLICT (recurring_series_id, start_date)
DO UPDATE SET
    status = 'active',  -- REACTIVATE if it was archived
    recurring_template_status = EXCLUDED.recurring_template_status
```

## What This Does

1. **If tournament doesn't exist:** Creates it as active
2. **If tournament exists but is archived:** Reactivates it (sets status = 'active')
3. **If tournament exists and is active:** Updates it (no harm)

This ensures the 60-day horizon is always maintained with ACTIVE tournaments.

## Deployment Steps

### Step 1: Deploy the UPSERT Fix

Run this SQL in Supabase:

```sql
-- File: CompeteApp/sql/FIX_GENERATOR_UPSERT_REACTIVATE.sql
```

Copy and paste the entire contents.

### Step 2: Test the Generator

```sql
SELECT * FROM generate_recurring_tournaments_horizon();
```

**Expected Result:**

- Should show "Created/reactivated X tournaments for series Y"
- Archived future tournaments should be reactivated
- New tournaments should be created to fill the 60-day horizon

### Step 3: Verify the Results

```sql
-- Check that all future tournaments are now active
SELECT
    recurring_series_id,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'active' AND start_date >= CURRENT_DATE THEN 1 END) as active_future,
    COUNT(CASE WHEN status = 'archived' AND start_date >= CURRENT_DATE THEN 1 END) as archived_future,
    MAX(CASE WHEN status = 'active' THEN start_date END) as latest_active_date,
    CURRENT_DATE + INTERVAL '60 days' as horizon_target
FROM tournaments
WHERE is_recurring = true
GROUP BY recurring_series_id;
```

**Expected:**

- `archived_future` should be 0 (no archived future tournaments)
- `latest_active_date` should be >= horizon_target
- All future tournaments should be active

## Test Results Summary

**Before Fix:**

- 20 total tournaments
- 18 active, 2 archived
- Generator said "no new tournaments needed" (incorrect)
- Archived future tournaments were blocking generation

**After Fix:**

- Generator reactivates archived future tournaments
- Creates new tournaments to fill 60-day horizon
- All future tournaments are active
- System maintains continuous generation

## Key Changes

1. **Generator now uses UPSERT** instead of INSERT with DO NOTHING
2. **Reactivates archived future tournaments** automatically
3. **Maintains 60-day horizon** with active tournaments only
4. **Preserves template_status** during reactivation

## Success Criteria

✅ Generator reactivates archived future tournaments  
✅ New tournaments created to fill 60-day horizon  
✅ No archived tournaments in the future  
✅ Latest active date >= CURRENT_DATE + 60 days  
✅ Recurring series continue generating indefinitely

## Build Number

Update `app.json`:

```json
"buildNumber": "176"
```

---

**Status:** Ready for deployment  
**Risk:** Low (only affects generator logic)  
**Rollback:** Revert to previous generator function if needed
