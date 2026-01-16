-- Test Script: Verify Generator Works with Archived Master
-- This tests that the recurring tournament generator still works even when the master is archived

-- Step 1: Check current state of recurring masters
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status as instance_status,
    recurring_template_status as template_status,
    is_recurring_master,
    recurring_series_id
FROM tournaments
WHERE is_recurring_master = true
ORDER BY start_date;

-- Step 2: Check existing child tournaments for the archived master
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status,
    is_recurring_master,
    recurring_series_id,
    parent_recurring_tournament_id
FROM tournaments
WHERE recurring_series_id IN (
    SELECT recurring_series_id 
    FROM tournaments 
    WHERE is_recurring_master = true 
    AND status = 'archived'
)
ORDER BY start_date;

-- Step 3: Run the generator
-- This should create new tournaments for the archived master (because template_status = 'active')
SELECT * FROM generate_recurring_tournaments_horizon();

-- Step 4: Verify new tournaments were created
SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status,
    is_recurring_master,
    recurring_series_id,
    recurring_template_status
FROM tournaments
WHERE recurring_series_id IN (
    SELECT recurring_series_id 
    FROM tournaments 
    WHERE is_recurring_master = true 
    AND status = 'archived'
)
ORDER BY start_date;

-- Step 5: Final verification - count tournaments by series
SELECT 
    recurring_series_id,
    COUNT(*) as total_tournaments,
    COUNT(CASE WHEN is_recurring_master = true THEN 1 END) as masters,
    COUNT(CASE WHEN is_recurring_master = false THEN 1 END) as children,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
    MAX(CASE WHEN is_recurring_master = true THEN recurring_template_status END) as template_status
FROM tournaments
WHERE is_recurring = true
GROUP BY recurring_series_id
ORDER BY recurring_series_id;
