# BUILD 153 - Pick Winner Schema Mismatch Fix

## Problem

The "Pick Winner" feature is showing an error:

```
Could not find the 'method' column of 'giveaway_winners' in the schema cache
```

## Root Cause

The `ModalPickWinner.tsx` component is trying to query columns (`picked_at` and `notified`) that don't exist in the `giveaway_winners` table.

**Current Table Schema:**

- id, giveaway_id, entry_id, user_id, rank, status, selected_at, claim_deadline, notified_at, claimed_at, resolved_at, resolution_reason, resolved_by, created_at, updated_at

**What the Code Expects:**

- `picked_at` (doesn't exist - should be `selected_at`)
- `notified` (doesn't exist - should derive from `status` enum)

## Solution

Add the missing columns to the `giveaway_winners` table for backward compatibility.

## Steps to Fix

### Step 1: Apply Database Migration

Run the SQL script in your Supabase SQL Editor:

```sql
-- File: CompeteApp/sql/fix_giveaway_winners_schema_mismatch.sql
```

This script will:

1. Add `picked_at` column (alias for `selected_at`)
2. Add `notified` boolean column (derived from `status`)
3. Copy existing data to maintain consistency
4. Create necessary indexes

### Step 2: Verify the Fix

After running the SQL, verify the columns exist:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'giveaway_winners'
AND column_name IN ('picked_at', 'notified')
ORDER BY column_name;
```

Expected output:

```
column_name | data_type
------------|------------------
notified    | boolean
picked_at   | timestamp with time zone
```

### Step 3: Test the Pick Winner Feature

1. Open the app
2. Navigate to Shop/Giveaways management
3. Click "Pick Winner" on a giveaway with entries
4. Verify the modal opens without errors
5. Click "Pick Random Winner"
6. Verify a winner is selected successfully

## What Was Fixed

✅ Added `picked_at` column to `giveaway_winners` table
✅ Added `notified` column to `giveaway_winners` table  
✅ Migrated existing data to new columns
✅ Created indexes for better query performance
✅ Added proper comments for documentation

## Files Modified

- `CompeteApp/sql/fix_giveaway_winners_schema_mismatch.sql` (NEW)
- `CompeteApp/BUILD_153_PICK_WINNER_SCHEMA_FIX.md` (NEW)

## Notes

- The `picked_at` column is essentially an alias for `selected_at` for backward compatibility
- The `notified` boolean is derived from the `status` enum (true if status is 'notified' or 'claimed')
- No code changes were needed - only database schema updates
- This fix maintains backward compatibility with existing code

## Next Steps

After applying this fix:

1. Test the pick winner functionality thoroughly
2. Consider updating the code in future to use the proper column names (`selected_at` and `status`)
3. Document the column relationships for future developers

## Deployment Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify columns exist
- [ ] Test pick winner feature
- [ ] Verify existing winners still display correctly
- [ ] Test picking multiple winners for same giveaway
- [ ] Verify winner history displays properly
