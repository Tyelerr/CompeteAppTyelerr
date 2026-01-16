-- Check if masters have recurring_template_status set

SELECT 
    id_unique_number,
    tournament_name,
    recurring_series_id,
    is_recurring_master,
    is_recurring,
    status,
    recurring_template_status,
    CASE 
        WHEN recurring_template_status IS NULL THEN '❌ NULL - generator will skip this!'
        WHEN recurring_template_status = 'active' THEN '✅ Active - generator will use this'
        ELSE format('⚠️ %s - generator will skip', recurring_template_status)
    END as generator_will_use
FROM tournaments
WHERE is_recurring_master = true
AND is_recurring = true
ORDER BY recurring_series_id;
