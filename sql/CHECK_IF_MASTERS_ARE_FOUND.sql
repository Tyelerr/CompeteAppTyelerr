-- Check if the generator can find the masters

-- This is the EXACT query the generator uses
SELECT 
    id_unique_number,
    tournament_name,
    recurring_series_id,
    is_recurring_master,
    is_recurring,
    recurring_template_status,
    '✅ Generator will process this' as note
FROM tournaments
WHERE is_recurring_master = true
AND is_recurring = true
AND recurring_template_status = 'active';

-- If this returns 0 rows, the generator won't process anything!
