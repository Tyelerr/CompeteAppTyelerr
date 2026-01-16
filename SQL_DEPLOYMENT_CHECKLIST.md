# SQL Deployment Checklist - Recurring Tournament Horizon Fix

## ✅ Script 1: COMPLETE

**File:** `sql/add_unique_constraint_recurring_tournaments.sql`

**Expected Result:**

```
indexname: idx_unique_recurring_series_date
indexdef: CREATE UNIQUE INDEX idx_unique_recurring_series_date ON public.tournaments...
```

**Status:** ✅ Successfully created unique index

---

## 📋 Script 2: Fix Parent Tournament ID Type

**File:** `sql/fix_parent_tournament_id_type.sql`

**What it does:**

- Adds `parent_recurring_tournament_uuid` column (UUID type)
- Migrates data from old `parent_recurring_tournament_id` (int8)
- Creates index for performance

**Expected Output:**

- NOTICE messages about migration progress
- Count of migrated records
- Confirmation that all records migrated successfully

**To Run:** Copy and paste the entire contents of `CompeteApp/sql/fix_parent_tournament_id_type.sql` into Supabase SQL Editor

---

## 📋 Script 3: Create Horizon Generation Function

**File:** `sql/generate_recurring_tournaments_horizon.sql`

**What it does:**

- Creates `generate_recurring_tournaments_horizon()` function
- Generates tournaments 60 days ahead
- Only creates future tournaments
- Prevents duplicates

**Expected Output:**

- Function created successfully
- Comment added to function

**To Run:** Copy and paste the entire contents of `CompeteApp/sql/generate_recurring_tournaments_horizon.sql` into Supabase SQL Editor

---

## 📋 Script 4: Update Archival Function

**File:** `sql/update_archive_function_with_horizon.sql`

**What it does:**

- Updates `archive_expired_tournaments()` function
- Replaces old generation logic with new horizon-based approach

**Expected Output:**

- Function updated successfully
- Comment updated

**To Run:** Copy and paste the entire contents of `CompeteApp/sql/update_archive_function_with_horizon.sql` into Supabase SQL Editor

---

## 🧪 Testing After All Scripts

### Option 1: Automated Test

```bash
cd CompeteApp
node test_recurring_tournaments_horizon.js
```

### Option 2: Manual SQL Test

```sql
-- Test the generation function
SELECT * FROM generate_recurring_tournaments_horizon();

-- Check results
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

---

## ✅ Completion Checklist

- [x] Script 1: Unique index created
- [ ] Script 2: UUID column added and data migrated
- [ ] Script 3: Horizon generation function created
- [ ] Script 4: Archival function updated
- [ ] Testing: Verified system works correctly

---

## 🆘 If You Encounter Errors

### Duplicate Key Error

Run this first to find and remove duplicates:

```sql
SELECT recurring_series_id, start_date, COUNT(*)
FROM tournaments
WHERE is_recurring = true
GROUP BY recurring_series_id, start_date
HAVING COUNT(*) > 1;
```

### Permission Error

Ensure you're logged in as a database admin or service role user.

### Function Already Exists

The scripts use `CREATE OR REPLACE FUNCTION` so they should overwrite existing functions safely.

---

**Next Step:** Run Script 2 (`sql/fix_parent_tournament_id_type.sql`)
