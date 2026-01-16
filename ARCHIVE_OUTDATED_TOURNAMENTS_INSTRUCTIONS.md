# Archive Outdated Tournaments - Instructions

## Problem

There are 2 outdated tournaments from October 2025 (2025-10-21 and 2025-10-28) that should have been automatically archived but are still in the active tournaments table.

## Quick Fix - Archive Them Now

### Option 1: Run SQL Script in Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy and paste this SQL**:

```sql
-- Archive all past tournaments (tournaments before today)
SELECT * FROM archive_expired_tournaments();

-- Verify they were archived
SELECT
    COUNT(*) as remaining_past_tournaments
FROM tournaments
WHERE start_date < CURRENT_DATE
AND status = 'active';
```

3. **Click "Run"**
4. **Expected result**:
   - `archived_count`: 2 (the 2 outdated tournaments)
   - `remaining_past_tournaments`: 0 (no more past tournaments)

### Option 2: Use the Provided SQL File

The SQL file `CompeteApp/sql/archive_outdated_tournaments_now.sql` contains the complete script. You can:

1. Open it in Supabase SQL Editor
2. Run it to see diagnostics and archive the tournaments

## Why This Happened

The `archive_expired_tournaments()` function exists and works correctly, but it needs to be run either:

1. **Manually** (like we're doing now)
2. **Automatically via Supabase Cron Job** (recommended for production)

## Long-Term Solution: Set Up Automatic Archival

### Set Up Supabase Cron Job (Recommended)

1. **Go to Supabase Dashboard** → Database → Cron Jobs (pg_cron extension)

2. **Create a new cron job** that runs daily at midnight:

```sql
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the archival function to run daily at midnight UTC
SELECT cron.schedule(
    'archive-expired-tournaments-daily',  -- Job name
    '0 0 * * *',                          -- Cron schedule (midnight UTC daily)
    $$SELECT * FROM archive_expired_tournaments()$$
);
```

3. **Verify the cron job was created**:

```sql
SELECT * FROM cron.job;
```

### Alternative: Manual Archival

If you prefer to manually archive tournaments, you can:

1. Run the SQL script whenever you notice outdated tournaments
2. Or create a button in the admin panel to trigger archival

## Current Archival Function Behavior

The `archive_expired_tournaments()` function:

- ✅ Archives tournaments where `start_date <= CURRENT_DATE`
- ✅ Moves them to `tournaments_history` table
- ✅ Deletes them from active `tournaments` table
- ✅ Preserves all tournament data including venue snapshots
- ✅ Generates new recurring tournament instances if needed

## Verification After Running

After running the archival:

1. **Check active tournaments**:

```sql
SELECT id_unique_number, tournament_name, start_date, status
FROM tournaments
WHERE status = 'active'
ORDER BY start_date;
```

2. **Check archived tournaments**:

```sql
SELECT id_unique_number, tournament_name, start_date, archived_reason, archived_at
FROM tournaments_history
ORDER BY archived_at DESC
LIMIT 10;
```

3. **Login as tmoneyhill** and verify:
   - Billiards page now shows only current/future tournaments for regular users
   - As master-admin, you can still see all tournaments (because of Build 140 fix)

## Notes

- The archival function is already created and working
- It just needs to be triggered (manually or via cron job)
- Once set up with cron, tournaments will automatically archive daily
- Archived tournaments are preserved in `tournaments_history` table
- The Build 140 fix allows admins to see archived tournaments if needed
