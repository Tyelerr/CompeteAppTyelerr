# Setup Automatic Tournament Archival & Recurring Generation

## The Problem

You're seeing past tournaments still marked as `status = 'active'` in the database because the archival function `archive_expired_tournaments()` is not running automatically.

This function should:

1. Archive tournaments where `start_date <= CURRENT_DATE` (past tournaments)
2. Generate new recurring tournaments to maintain the 60-day horizon

## The Solution: Set Up Supabase Cron Job

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **Database** → **Cron Jobs** (or **Extensions** → **pg_cron**)

### Step 2: Create Cron Job for Tournament Archival

Create a new cron job with these settings:

**Job Name**: `Archive Expired Tournaments and Generate Recurring`

**Schedule**: `0 2 * * *` (runs daily at 2 AM)

**SQL Command**:

```sql
SELECT * FROM archive_expired_tournaments();
```

### Step 3: Verify the Cron Job

After creating the cron job, you can verify it's scheduled by running:

```sql
SELECT * FROM cron.job;
```

## Manual Archival (Quick Fix for Now)

To immediately archive all past tournaments and generate new recurring ones, run this in Supabase SQL Editor:

```sql
SELECT * FROM archive_expired_tournaments();
```

This will:

- Archive all tournaments where `start_date <= today`
- Move them to `tournaments_history` table
- Delete them from active `tournaments` table
- Generate new recurring tournaments up to 60 days ahead
- Return a summary showing how many were archived and generated

## What the Function Does

The `archive_expired_tournaments()` function:

1. **Finds Past Tournaments**:

   ```sql
   WHERE t.start_date <= CURRENT_DATE
   AND t.status = 'active'
   ```

2. **Archives Them**:

   - Copies tournament data to `tournaments_history` table
   - Includes venue snapshot and creator info
   - Marks with `archived_reason = 'expired'`
   - Deletes from active `tournaments` table

3. **Generates New Recurring Tournaments**:
   - Calls `generate_recurring_tournaments_horizon()`
   - Creates tournaments up to 60 days ahead
   - Prevents duplicates
   - Only creates future tournaments

## Expected Results

After running the archival function, you should see:

- **Billiards Page**: Only future tournaments (working correctly)
- **Tournaments Admin Page**: Only future active tournaments + archived tournaments in history
- **Recurring Series**: Always have tournaments up to 60 days ahead

## Recommended Setup

**Set up BOTH cron jobs**:

1. **Tournament Archival** (daily at 2 AM):

   ```sql
   SELECT * FROM archive_expired_tournaments();
   ```

2. **Recurring Tournament Generation** (daily at 3 AM - runs after archival):
   ```sql
   SELECT * FROM generate_recurring_tournaments_horizon();
   ```

This ensures:

- Past tournaments are archived daily
- New recurring tournaments are generated daily
- The 60-day horizon is always maintained
- Users always see upcoming tournaments

## Troubleshooting

If tournaments aren't being archived:

1. Check if the cron job is enabled
2. Check cron job logs in Supabase
3. Manually run the function to test
4. Verify the `tournaments_history` table exists
5. Check for any RLS policies blocking the archival

## Alternative: Run Manually Weekly

If you don't want to set up cron jobs, you can manually run this SQL command once a week:

```sql
SELECT * FROM archive_expired_tournaments();
```

This will clean up past tournaments and generate new recurring ones.
