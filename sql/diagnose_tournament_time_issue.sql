-- Diagnose Tournament Time Issue
-- This script will help us understand how times are being stored and retrieved

-- 1. Check the data type of the start_date column
SELECT 
    column_name,
    data_type,
    datetime_precision,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tournaments' 
AND column_name = 'start_date';

-- 2. Check a sample of recent tournaments to see how times are stored
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    strart_time,
    created_at,
    is_recurring
FROM tournaments
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if there's a timezone set on the database
SHOW timezone;

-- 4. Check how Supabase is interpreting the timestamp
SELECT 
    id_unique_number,
    tournament_name,
    start_date AT TIME ZONE 'UTC' as start_date_utc,
    start_date AT TIME ZONE 'America/Chicago' as start_date_cst,
    start_date AT TIME ZONE 'America/New_York' as start_date_est,
    start_date AT TIME ZONE 'America/Los_Angeles' as start_date_pst
FROM tournaments
ORDER BY created_at DESC
LIMIT 5;
