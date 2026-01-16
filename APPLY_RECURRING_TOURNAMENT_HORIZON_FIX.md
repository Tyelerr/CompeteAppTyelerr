# APPLY RECURRING TOURNAMENT HORIZON FIX - Quick Guide

## SQL Scripts to Run (In Order)

Copy and paste these SQL scripts into your Supabase SQL Editor in the exact order shown below:

### Step 1: Add Unique Index (Prevents Duplicates)

**File:** `CompeteApp/sql/add_unique_constraint_recurring_tournaments.sql`

This creates a partial unique index that prevents duplicate tournaments for the same series on the same date.

### Step 2: Fix Parent Tournament ID Type

**File:** `CompeteApp/sql/fix_parent_tournament_id_type.sql`

This adds the `parent_recurring_tournament_uuid` column and migrates data from the old int8 column.

### Step 3: Create Horizon-Based Generation Function

**File:** `CompeteApp/sql/generate_recurring_tournaments_horizon.sql`

This creates the new `generate_recurring_tournaments_horizon()` function that generates tournaments 60 days ahead.

### Step 4: Update Archival Function

**File:** `CompeteApp/sql/update_archive_function_with_horizon.sql`

This updates `archive_expired_tournaments()` to use the new horizon-based generation.

## Testing After Deployment

### Option 1: Run the Test Script

```bash
cd CompeteApp
node test_recurring_tournaments_horizon.js
```

### Option 2: Manual SQL Testing

```sql
-- Test the generation function
SELECT * FROM generate_recurring_tournaments_horizon();

-- Check the results
SELECT
    recurring_series_id,
    tournament_name,
    COUNT(*) as total_tournaments,
    MIN(start_date) as earliest,
    MAX(start_date) as latest,
    MAX(start_date) - CURRENT_DATE as days_ahead
FROM tournaments
WHERE is_recurring = true
AND start_date >= CURRENT_DATE
AND status = 'active'
GROUP BY recurring_series_id, tournament_name
ORDER BY tournament_name;
```

## What This Fixes

✅ **No Past Tournaments**: Only creates tournaments with start_date >= CURRENT_DATE  
✅ **Flexible Horizon**: Generates up to 60 days ahead (not fixed count of 4)  
✅ **Duplicate Prevention**: Partial unique index prevents duplicates  
✅ **Type Safety**: UUID column matches tournaments.id type  
✅ **Safe to Re-run**: Can execute multiple times without issues

## Troubleshooting

If you encounter errors:

1. **Duplicate Key Error**: Run `diagnose_recurring_tournaments.sql` to find and remove duplicates first
2. **Function Not Found**: Make sure you ran scripts in order
3. **Permission Error**: Ensure you're using a database admin account

## Full Documentation

See `RECURRING_TOURNAMENT_HORIZON_IMPLEMENTATION_COMPLETE.md` for complete details.
