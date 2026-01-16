# Recurring Tournament Horizon-Based Implementation - COMPLETE

## Overview

This document describes the complete implementation of the horizon-based recurring tournament generation system, which replaces the flawed fixed-count approach with a more robust and flexible solution.

## Problem Statement

The previous `generate_recurring_tournaments()` function had several critical issues:

1. **Generated Past Tournaments**: Could create tournaments with dates in the past
2. **Fixed Count Limitation**: Always tried to maintain exactly 4 future instances (inflexible)
3. **No Duplicate Prevention**: Could create duplicate tournaments on multiple runs
4. **Type Mismatch**: `parent_recurring_tournament_id` (int8) didn't match `tournaments.id` (UUID)

## Solution: Horizon-Based Generation

### Key Concepts

- **Horizon**: Generate tournaments up to 60 days in the future
- **Duplicate Prevention**: Unique constraint on (recurring_series_id, start_date)
- **Future-Only**: Only creates tournaments with start_date >= CURRENT_DATE
- **Safe to Re-run**: Can be executed multiple times without creating duplicates

### Architecture

```
Master Tournament (is_recurring_master = true)
    ↓
Child Tournaments (is_recurring_master = false)
    - Generated weekly
    - Up to 60 days ahead
    - Share same recurring_series_id
```

## Implementation Files

### 1. Schema Fixes

#### `sql/add_unique_constraint_recurring_tournaments.sql`

- Adds unique constraint on (recurring_series_id, start_date)
- Prevents duplicate tournaments for same series on same date
- Checks for existing duplicates before adding constraint

#### `sql/fix_parent_tournament_id_type.sql`

- Adds `parent_recurring_tournament_uuid` (UUID) column
- Migrates data from `parent_recurring_tournament_id` (int8)
- Maintains backward compatibility (keeps old column)

### 2. Core Functions

#### `sql/generate_recurring_tournaments_horizon.sql`

The main generation function with these features:

- **Horizon-Based**: Generates tournaments 60 days ahead
- **Smart Starting Point**: Starts from latest child or master date
- **Future-Only**: Only creates tournaments >= CURRENT_DATE
- **Duplicate-Safe**: Uses ON CONFLICT DO NOTHING
- **Error Handling**: Continues on errors, logs warnings
- **Detailed Results**: Returns series_id, count, and message for each series

#### `sql/update_archive_function_with_horizon.sql`

Updates the archival function to use the new horizon-based generation:

- Replaces call to old `generate_recurring_tournaments()`
- Uses new `generate_recurring_tournaments_horizon()`
- Maintains same interface for backward compatibility

### 3. Testing & Verification

#### `test_recurring_tournaments_horizon.js`

Comprehensive test script that verifies:

1. Unique constraint exists
2. parent_recurring_tournament_uuid column exists
3. Recurring master tournaments are present
4. Child tournaments are correctly generated
5. Horizon generation function works
6. No duplicate tournaments exist

## Deployment Steps

### Step 1: Apply Schema Fixes

```sql
-- In Supabase SQL Editor, run in order:

-- 1. Add unique constraint
\i sql/add_unique_constraint_recurring_tournaments.sql

-- 2. Fix parent tournament ID type
\i sql/fix_parent_tournament_id_type.sql
```

### Step 2: Deploy New Functions

```sql
-- 3. Create horizon-based generation function
\i sql/generate_recurring_tournaments_horizon.sql

-- 4. Update archival function
\i sql/update_archive_function_with_horizon.sql
```

### Step 3: Test the Implementation

```bash
# Run the test script
cd CompeteApp
node test_recurring_tournaments_horizon.js
```

### Step 4: Manual Testing

```sql
-- Test the generation function manually
SELECT * FROM generate_recurring_tournaments_horizon();

-- Check results
SELECT
    recurring_series_id,
    COUNT(*) as total_tournaments,
    MIN(start_date) as earliest,
    MAX(start_date) as latest
FROM tournaments
WHERE is_recurring = true
AND start_date >= CURRENT_DATE
GROUP BY recurring_series_id;
```

## Benefits of This Approach

### 1. No Past Tournaments

- Only creates tournaments with `start_date >= CURRENT_DATE`
- Prevents confusion and data integrity issues

### 2. Flexible Horizon

- Generates up to 60 days ahead (configurable)
- Not limited to fixed count of 4 tournaments
- Adapts to different scheduling needs

### 3. Duplicate Prevention

- Unique constraint prevents duplicates at database level
- ON CONFLICT DO NOTHING handles race conditions
- Safe to run multiple times

### 4. Type Safety

- New UUID column matches tournaments.id type
- Maintains backward compatibility with int8 column
- Proper foreign key relationships

### 5. Better Error Handling

- Continues processing on errors
- Logs warnings for debugging
- Returns detailed results per series

## Maintenance

### Running the Generation Function

The function is automatically called by `archive_expired_tournaments()`, but can also be run manually:

```sql
-- Generate new tournaments for all series
SELECT * FROM generate_recurring_tournaments_horizon();
```

### Monitoring

```sql
-- Check tournament distribution
SELECT
    t.recurring_series_id,
    t.tournament_name,
    COUNT(*) as future_count,
    MIN(t.start_date) as next_date,
    MAX(t.start_date) as furthest_date,
    MAX(t.start_date) - CURRENT_DATE as days_ahead
FROM tournaments t
WHERE t.is_recurring = true
AND t.start_date >= CURRENT_DATE
AND t.status = 'active'
GROUP BY t.recurring_series_id, t.tournament_name
ORDER BY t.tournament_name;
```

### Troubleshooting

#### Issue: Duplicates Still Appearing

```sql
-- Check for duplicates
SELECT recurring_series_id, start_date, COUNT(*)
FROM tournaments
WHERE is_recurring = true
GROUP BY recurring_series_id, start_date
HAVING COUNT(*) > 1;

-- If found, manually remove duplicates keeping the oldest
DELETE FROM tournaments t1
WHERE t1.id IN (
    SELECT t2.id
    FROM tournaments t2
    WHERE t2.recurring_series_id = t1.recurring_series_id
    AND t2.start_date = t1.start_date
    AND t2.created_at > (
        SELECT MIN(t3.created_at)
        FROM tournaments t3
        WHERE t3.recurring_series_id = t1.recurring_series_id
        AND t3.start_date = t1.start_date
    )
);
```

#### Issue: Not Generating Enough Tournaments

```sql
-- Check if master tournaments exist
SELECT * FROM tournaments
WHERE is_recurring_master = true
AND is_recurring = true
AND status = 'active';

-- If none found, you need to create master tournaments
-- Or set existing tournaments as masters
```

#### Issue: Generating Too Far Ahead

```sql
-- Adjust the horizon (default is 60 days)
-- Edit the function and change:
-- horizon_days INTEGER := 60;
-- To your desired value (e.g., 30 or 90)
```

## Migration from Old System

If you have existing recurring tournaments using the old system:

1. **Backup your data** before making changes
2. Apply schema fixes (unique constraint, UUID column)
3. Deploy new functions
4. Test with a single series first
5. Monitor for duplicates
6. Once verified, apply to all series

## Configuration

### Adjusting the Horizon

Edit `sql/generate_recurring_tournaments_horizon.sql`:

```sql
-- Change this line (default is 60 days)
horizon_days INTEGER := 60;

-- To your desired value, e.g.:
horizon_days INTEGER := 90;  -- 3 months ahead
```

### Changing Generation Frequency

The generation happens automatically during archival. To change frequency:

1. Adjust your cron job or scheduled task
2. Or call the function manually as needed

## Performance Considerations

- **Indexing**: The unique constraint creates an index automatically
- **Batch Size**: Processes all series in one transaction
- **Error Handling**: Continues on individual errors
- **Logging**: Uses RAISE WARNING for debugging

## Security

- Function uses SECURITY DEFINER (if needed for RLS)
- Respects existing RLS policies
- No direct user input (all data from database)

## Future Enhancements

Potential improvements for future versions:

1. **Configurable Horizon**: Store horizon_days in a settings table
2. **Series-Specific Horizons**: Different horizons per series
3. **Notification System**: Alert when tournaments are generated
4. **Analytics**: Track generation patterns and usage
5. **Bi-weekly/Monthly**: Support other recurrence patterns

## Summary

The horizon-based recurring tournament system provides:

✅ No past tournaments  
✅ Flexible scheduling (60-day horizon)  
✅ Duplicate prevention (unique constraint)  
✅ Type safety (UUID columns)  
✅ Safe to re-run (idempotent)  
✅ Better error handling  
✅ Detailed logging

This implementation solves all the issues with the previous system and provides a solid foundation for recurring tournament management.

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Run the test script: `node test_recurring_tournaments_horizon.js`
3. Review the SQL function comments
4. Check Supabase logs for errors

---

**Implementation Date**: December 2024  
**Status**: ✅ COMPLETE  
**Version**: 1.0
