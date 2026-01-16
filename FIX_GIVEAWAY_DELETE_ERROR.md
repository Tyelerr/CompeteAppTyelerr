# 🔧 FIX: Giveaway Delete Error

## Problem

When trying to delete a giveaway, you get this error:

```
INSERT has more expressions than target columns
```

## Root Cause

The `giveaways_archive` table is missing the new v1 columns that were added to the `giveaways` table. When the archival function tries to copy a giveaway to the archive, it fails because the archive table doesn't have all the columns.

## Solution

Run this SQL file in your Supabase SQL Editor:

**File:** `CompeteApp/sql/fix_giveaways_archive_add_v1_columns.sql`

This will add all 9 new v1 columns to the giveaways_archive table:

- max_entries
- entry_count_cached
- min_age
- claim_period_days
- winner_lock_until
- prize_name
- prize_arv
- prize_image_url
- eligibility_text

## Steps to Fix

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `fix_giveaways_archive_add_v1_columns.sql`
3. Click "Run"
4. You should see: ✅ All v1 columns added to giveaways_archive table
5. Try deleting a giveaway again - it should work now!

## What This Does

The SQL file:

1. Adds all missing v1 columns to giveaways_archive
2. Verifies the columns were added successfully
3. Shows the current table structure

After running this, the archival function will be able to copy all giveaway data (including the new v1 fields) to the archive table without errors.

## Quick Test

After running the SQL:

1. Go to Shop → Manage tab
2. Try deleting a test giveaway
3. Should see "Giveaway has been archived successfully"
4. No more "INSERT has more expressions" error!
