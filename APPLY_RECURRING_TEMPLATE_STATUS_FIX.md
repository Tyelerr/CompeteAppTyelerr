# Apply Recurring Template Status Fix - Deployment Guide

## Overview

This guide walks you through deploying the recurring template status redesign that separates tournament instance status from recurring template status.

## What This Fix Does

**Before:**

- Master tournaments with `status = 'archived'` stop generating future instances
- Archiving a past master tournament breaks the entire recurring series

**After:**

- Master tournaments can be `status = 'archived'` (as past instances)
- But `recurring_template_status = 'active'` keeps the series generating
- Archive job never touches `recurring_template_status`

---

## Step-by-Step Deployment

### Step 1: Add the New Column (5 minutes)

Run this SQL in your Supabase SQL Editor:

```sql
-- File: CompeteApp/sql/add_recurring_template_status.sql
```

Copy and paste the entire contents of `add_recurring_template_status.sql`

**What it does:**

- Creates enum type `recurring_template_status_enum`
- Adds column `recurring_template_status` with default `'active'`
- Migrates existing recurring masters to `'active'`
- Creates index for performance
- Verifies the migration

**Expected output:**

```
NOTICE: Migration complete:
NOTICE:   Total recurring masters: X
NOTICE:   Masters with active template status: X
```

---

### Step 2: Update the Generator Function (3 minutes)

Run this SQL in your Supabase SQL Editor:

```sql
-- File: CompeteApp/sql/update_generate_recurring_tournaments_with_template_status.sql
```

Copy and paste the entire contents of `update_generate_recurring_tournaments_with_template_status.sql`

**What it does:**

- Updates `generate_recurring_tournaments_horizon()` function
- Changes master selection from `status = 'active'` to `recurring_template_status = 'active'`
- Allows generation even when master is archived

**Test it:**

```sql
SELECT * FROM generate_recurring_tournaments_horizon();
```

---

### Step 3: Update the Archive Function (3 minutes)

Run this SQL in your Supabase SQL Editor:

```sql
-- File: CompeteApp/sql/update_archive_function_preserve_template_status.sql
```

Copy and paste the entire contents of `update_archive_function_preserve_template_status.sql`

**What it does:**

- Updates `archive_expired_tournaments()` function
- Removes exclusion of master tournaments
- Archives masters as instances but preserves `recurring_template_status`

**Test it:**

```sql
SELECT * FROM archive_expired_tournaments();
```

---

## Verification

### Check 1: Verify Column Exists

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tournaments'
AND column_name = 'recurring_template_status';
```

Expected: Should return one row showing the column exists.

### Check 2: Verify Existing Masters Have Active Status

```sql
SELECT
    id_unique_number,
    tournament_name,
    status,
    recurring_template_status,
    start_date
FROM tournaments
WHERE is_recurring_master = true
AND is_recurring = true;
```

Expected: All should have `recurring_template_status = 'active'`

### Check 3: Test the Full Flow

1. **Find a past master tournament:**

```sql
SELECT * FROM tournaments
WHERE is_recurring_master = true
AND start_date < CURRENT_DATE
AND status = 'active'
LIMIT 1;
```

2. **Archive it manually:**

```sql
UPDATE tournaments
SET status = 'archived'
WHERE id_unique_number = [ID_FROM_ABOVE];
```

3. **Verify template status unchanged:**

```sql
SELECT
    tournament_name,
    status,
    recurring_template_status
FROM tournaments
WHERE id_unique_number = [ID_FROM_ABOVE];
```

Expected: `status = 'archived'` but `recurring_template_status = 'active'`

4. **Run generator:**

```sql
SELECT * FROM generate_recurring_tournaments_horizon();
```

Expected: Should still generate future tournaments for this series!

---

## Rollback Plan

If something goes wrong:

1. **Revert Generator Function:**

```sql
-- Use the old version that checks status = 'active'
-- (Keep the file CompeteApp/sql/generate_recurring_tournaments_horizon.sql as backup)
```

2. **Keep the Column:**

- The `recurring_template_status` column is harmless if not used
- You can re-attempt the migration later

3. **Revert Archive Function:**

```sql
-- Use CompeteApp/sql/FIX_ARCHIVAL_EXCLUDE_MASTERS.sql
-- This excludes masters from archival (old behavior)
```

---

## Post-Deployment

### Update App Code (Optional)

If you want to add UI controls for template status:

1. Update TypeScript interface in `CompeteApp/hooks/InterfacesGlobal.tsx`
2. Update CRUD operations in `CompeteApp/ApiSupabase/CrudTournament.tsx`
3. Add admin controls in `CompeteApp/screens/Admin/ModalAdminTournamentEditor.tsx`

See `TODO_RECURRING_TEMPLATE_STATUS_IMPLEMENTATION.md` for details.

### Monitor the System

Check daily for the first week:

```sql
-- Count archived masters still generating
SELECT COUNT(*) as archived_masters_still_active
FROM tournaments
WHERE is_recurring_master = true
AND status = 'archived'
AND recurring_template_status = 'active';

-- Check recent generation activity
SELECT * FROM generate_recurring_tournaments_horizon();
```

---

## Troubleshooting

### Problem: Generator not finding masters

**Check:**

```sql
SELECT
    tournament_name,
    status,
    recurring_template_status,
    is_recurring_master
FROM tournaments
WHERE is_recurring = true
AND is_recurring_master = true;
```

**Solution:** Ensure `recurring_template_status = 'active'`

### Problem: Duplicates being created

**Check:**

```sql
SELECT
    recurring_series_id,
    start_date,
    COUNT(*)
FROM tournaments
WHERE is_recurring = true
GROUP BY recurring_series_id, start_date
HAVING COUNT(*) > 1;
```

**Solution:** The unique constraint should prevent this. If it happens, check that the constraint exists:

```sql
SELECT * FROM pg_indexes
WHERE tablename = 'tournaments'
AND indexname LIKE '%recurring%';
```

---

## Success Criteria

✅ Column `recurring_template_status` exists and has default value  
✅ All existing recurring masters have `recurring_template_status = 'active'`  
✅ Generator function uses `recurring_template_status` not `status`  
✅ Archive function preserves `recurring_template_status`  
✅ Past master tournaments can be archived while series continues  
✅ New tournaments are generated correctly

---

## Questions?

Refer to:

- `TODO_RECURRING_TEMPLATE_STATUS_IMPLEMENTATION.md` - Full implementation plan
- `HOW_RECURRING_TOURNAMENTS_WORK.md` - System overview
- `TODO_RECURRING_TEMPLATE_STATUS_REDESIGN.md` - Original requirements

---

**Deployment Time:** ~15 minutes  
**Risk Level:** Low (can be rolled back easily)  
**Testing Required:** Yes (verify with test data first)
