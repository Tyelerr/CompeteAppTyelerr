# How Recurring Tournaments Work

## Current System

When you create a recurring tournament, the system:

1. Creates 4 tournaments initially (current week + 3 future weeks)
2. All tournaments share the same `recurring_series_id`
3. The first tournament is marked as `is_recurring_master = true`

## The Problem

The system creates 4 tournaments upfront, but it doesn't automatically generate new ones as old tournaments pass. This means:

- Week 1 tournament happens and gets archived
- You're left with only 3 tournaments
- No new tournament is created for Week 5

## The Solution

There's a database function `generate_recurring_tournaments_horizon()` that generates new tournaments up to 60 days ahead. You need to run this function periodically.

### Option 1: Run Manually in Supabase (Quick Fix)

1. Open your Supabase SQL Editor
2. Run this command:

```sql
SELECT * FROM generate_recurring_tournaments_horizon();
```

This will:

- Check all recurring tournament series
- Generate new tournaments up to 60 days ahead
- Prevent duplicates
- Return a summary of what was created

### Option 2: Set Up Automatic Cron Job (Recommended)

Set up a Supabase cron job to run this function daily:

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Create a new cron job:
   - **Name**: Generate Recurring Tournaments
   - **Schedule**: `0 2 * * *` (runs daily at 2 AM)
   - **SQL**:
   ```sql
   SELECT * FROM generate_recurring_tournaments_horizon();
   ```

### Option 3: Run from Command Line

You can also run the generator script:

```bash
cd CompeteApp
node run_tournament_maintenance.js
```

## How It Works

The `generate_recurring_tournaments_horizon()` function:

1. Finds all active recurring master tournaments
2. For each series, calculates the latest tournament date
3. Generates weekly tournaments from that date up to 60 days ahead
4. Skips any dates that already have tournaments (prevents duplicates)
5. Only creates tournaments for future dates

## Example

If you have a recurring tournament that meets every Monday:

- Initial creation: Creates tournaments for Weeks 1, 2, 3, 4
- After Week 1 passes and gets archived: You have Weeks 2, 3, 4
- Run `generate_recurring_tournaments_horizon()`: Creates Weeks 5, 6, 7, 8 (up to 60 days ahead)

## Recommended Setup

**Set up the cron job** so you don't have to manually run the function. The cron job will:

- Run daily at 2 AM
- Check all recurring series
- Generate new tournaments as needed
- Keep the 60-day horizon filled

This ensures users always see upcoming tournaments for recurring series.
