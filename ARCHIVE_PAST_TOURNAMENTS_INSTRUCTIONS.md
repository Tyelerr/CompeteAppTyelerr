# How to Archive Past Tournaments - Quick Guide

## What You Need to Do

You mentioned you changed one tournament to 2026-01-05 for testing. Now you want to archive all tournaments with previous dates.

---

## Option 1: Use the SQL Script (Recommended)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Archive Script

Copy and paste the contents of: **`CompeteApp/sql/ARCHIVE_PAST_TOURNAMENTS_NOW.sql`**

This script will:

1. **Show you** what will be archived (preview)
2. **Run** the archive function
3. **Verify** what was archived
4. **Confirm** masters still have active templates

### What Happens:

- ✅ All tournaments with `start_date < today` will be archived
- ✅ Master tournaments will be archived BUT their `recurring_template_status` stays `active`
- ✅ The generator will continue creating future tournaments for those series
- ✅ Likes are cleaned up
- ✅ Tournaments are moved to `tournaments_archive` table

---

## Option 2: Simple One-Line Command

If you just want to archive everything quickly, run this single line in Supabase SQL Editor:

```sql
SELECT * FROM archive_expired_tournaments();
```

This will archive all past tournaments and return a summary.

---

## What About Your Test Tournament (2026-01-05)?

**Important:** The tournament you changed to 2026-01-05 will **NOT** be archived because:

- 2026-01-05 is in the **future** (not a past date)
- The archive function only archives tournaments where `start_date < CURRENT_DATE`

If you want to archive that specific tournament too, you have two options:

### Option A: Change it back to a past date

```sql
UPDATE tournaments
SET start_date = '2024-01-05'  -- or any past date
WHERE start_date = '2026-01-05';
```

Then run the archive function.

### Option B: Manually archive just that one

```sql
-- First, delete its likes
DELETE FROM likes WHERE turnament_id = (
    SELECT id FROM tournaments WHERE start_date = '2026-01-05'
);

-- Then move to archive
INSERT INTO tournaments_archive
SELECT *, NOW(), 'manual_test', NULL
FROM tournaments
WHERE start_date = '2026-01-05';

-- Finally, delete from main table
DELETE FROM tournaments WHERE start_date = '2026-01-05';
```

---

## Verification Queries

### Check what's still active:

```sql
SELECT
    tournament_name,
    start_date,
    status,
    is_recurring_master,
    recurring_template_status
FROM tournaments
WHERE status = 'active'
ORDER BY start_date;
```

### Check what was archived:

```sql
SELECT
    tournament_name,
    start_date,
    is_recurring_master,
    recurring_template_status,
    archived_at
FROM tournaments_archive
ORDER BY archived_at DESC
LIMIT 20;
```

### Verify masters can still generate:

```sql
SELECT
    tournament_name,
    recurring_template_status,
    'Will continue generating!' as note
FROM tournaments_archive
WHERE is_recurring_master = true
AND recurring_template_status = 'active';
```

---

## After Archiving

### Test the Generator:

```sql
SELECT * FROM generate_recurring_tournaments_horizon();
```

This should still work and create new tournaments for any series that had their masters archived (as long as `recurring_template_status = 'active'`).

---

## Summary

**To archive all past tournaments:**

1. Open Supabase SQL Editor
2. Run: `SELECT * FROM archive_expired_tournaments();`
3. Done!

**The new system ensures:**

- Past tournaments are cleaned up
- Master tournaments can be archived
- Recurring series keep generating
- No data loss
