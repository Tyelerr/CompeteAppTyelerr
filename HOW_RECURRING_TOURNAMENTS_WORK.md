# How Recurring Tournaments Work

## Overview

The recurring tournament system maintains 4 active tournament instances at all times for each recurring series, always looking 60 days ahead.

## Master Tournament Selection

A tournament becomes a "master" recurring tournament when it's created with these settings:

### Required Fields:

1. **`is_recurring`** = `true` (checkbox: "This is a recurring tournament")
2. **`is_recurring_master`** = `true` (this is the template/master)
3. **`recurring_series_id`** = unique identifier for this series (auto-generated)
4. **`status`** = `'active'`

### How to Check for Master Tournaments:

```sql
SELECT
    id_unique_number,
    tournament_name,
    recurring_series_id,
    is_recurring,
    is_recurring_master,
    start_date,
    status
FROM tournaments
WHERE is_recurring_master = true
AND is_recurring = true
AND status = 'active';
```

## How the Generator Works

When you run `SELECT * FROM generate_recurring_tournaments_horizon();`:

1. **Finds all master tournaments** with:

   - `is_recurring_master = true`
   - `is_recurring = true`
   - `status = 'active'`

2. **For each master**, it:

   - Looks at the latest child tournament already created
   - Generates new weekly instances up to 60 days from today
   - Skips any dates in the past
   - Prevents duplicates using `ON CONFLICT`

3. **Child tournaments** have:
   - `is_recurring = true`
   - `is_recurring_master = false`
   - Same `recurring_series_id` as the master
   - `parent_recurring_tournament_id` = master's id
   - Dates incremented by 7 days

## Message: "No new tournaments needed"

This means:

- All recurring series already have tournaments generated up to 60 days ahead
- OR there are no master tournaments in the database
- OR all master tournaments have been archived

## To Create a New Recurring Tournament Series:

When submitting a tournament in the app:

1. Check the "This is a recurring tournament" checkbox
2. The system automatically sets:
   - `is_recurring = true`
   - `is_recurring_master = true` (for the first one)
   - Generates a unique `recurring_series_id`
3. Run the generator to create the 4 instances

## Maintenance

The system should run daily (via cron job) to:

1. Archive past tournaments
2. Generate new recurring instances to maintain the 60-day horizon
