-- FIX: Change start_date column from timestamptz to timestamp
-- This prevents automatic timezone conversion by the database

-- IMPORTANT: Run this SQL in your Supabase SQL Editor

-- Step 1: Check current column type
SELECT 
    column_name,
    data_type,
    datetime_precision
FROM information_schema.columns
WHERE table_name = 'tournaments' 
AND column_name = 'start_date';

-- Step 2: Alter the column type from timestamptz to timestamp
-- This will preserve the exact time values without timezone conversion
ALTER TABLE tournaments 
ALTER COLUMN start_date TYPE timestamp without time zone;

-- Step 3: Verify the change
SELECT 
    column_name,
    data_type,
    datetime_precision
FROM information_schema.columns
WHERE table_name = 'tournaments' 
AND column_name = 'start_date';

-- Step 4: Check a sample tournament to see the time format
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    created_at
FROM tournaments
ORDER BY created_at DESC
LIMIT 5;
