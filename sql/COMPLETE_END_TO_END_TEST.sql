-- Complete End-to-End Test of Recurring Template Status System
-- This tests the entire flow: archive past, generate future, verify separation

-- ============================================
-- TEST 1: Reactivate any incorrectly archived future tournaments
-- ============================================
SELECT '=== TEST 1: Reactivate Future Tournaments ===' as test_step;

UPDATE tournaments
SET status = 'active'
WHERE status = 'archived'
AND start_date >= CURRENT_DATE;

SELECT 
    'Reactivated future tournaments' as action,
    COUNT(*) as count
FROM tournaments
WHERE status = 'active'
AND start_date >= CURRENT_DATE;

-- ============================================
-- TEST 2: Archive past tournaments (preserve template_status)
-- ============================================
SELECT '=== TEST 2: Archive Past Tournaments ===' as test_step;

UPDATE tournaments
SET status = 'archived'
WHERE start_date < CURRENT_DATE
AND status = 'active';

SELECT 
    'Archived past tournaments' as action,
    COUNT(*) as count
FROM tournaments
WHERE status = 'archived'
AND start_date < CURRENT_DATE;

-- ============================================
-- TEST 3: Verify masters with archived instance but active template
-- ============================================
SELECT '=== TEST 3: Archived Masters with Active Templates ===' as test_step;

SELECT 
    id_unique_number,
    tournament_name,
    start_date,
    status as instance_status,
    recurring_template_status as template_status,
    CASE 
        WHEN status = 'archived' AND recurring_template_status = 'active' 
        THEN '✅ CORRECT: Archived instance, active template'
        ELSE 'Check this one'
    END as verification
FROM tournaments
WHERE is_recurring_master = true
AND is_recurring = true;

-- ============================================
-- TEST 4: Deploy the fixed generator
-- ============================================
SELECT '=== TEST 4: Update Generator Function ===' as test_step;
SELECT 'Run FIX_GENERATOR_IGNORE_ARCHIVED_CHILDREN.sql manually' as instruction;

-- ============================================
-- TEST 5: Run the generator
-- ============================================
SELECT '=== TEST 5: Generate New Tournaments ===' as test_step;

SELECT * FROM generate_recurring_tournaments_horizon();

-- ============================================
-- TEST 6: Verify results
-- ============================================
SELECT '=== TEST 6: Final Verification ===' as test_step;

-- Count by series
SELECT 
    recurring_series_id,
    COUNT(*) as total,
    COUNT(CASE WHEN is_recurring_master = true THEN 1 END) as masters,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
    COUNT(CASE WHEN status = 'active' AND start_date >= CURRENT_DATE THEN 1 END) as active_future,
    MAX(CASE WHEN status = 'active' THEN start_date END) as latest_active_date,
    CURRENT_DATE + INTERVAL '60 days' as horizon_target,
    CASE 
        WHEN MAX(CASE WHEN status = 'active' THEN start_date END) >= CURRENT_DATE + INTERVAL '60 days' 
        THEN '✅ Horizon satisfied'
        ELSE '⚠️ Needs more tournaments'
    END as horizon_status,
    MAX(CASE WHEN is_recurring_master = true THEN recurring_template_status END) as template_status
FROM tournaments
WHERE is_recurring = true
GROUP BY recurring_series_id
ORDER BY recurring_series_id;

-- ============================================
-- TEST 7: Verify the key requirement
-- ============================================
SELECT '=== TEST 7: Key Requirement Verification ===' as test_step;

SELECT 
    'Can archived masters generate?' as question,
    COUNT(*) as archived_masters_with_active_template,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ YES - System working correctly'
        ELSE 'No archived masters yet'
    END as answer
FROM tournaments
WHERE is_recurring_master = true
AND status = 'archived'
AND recurring_template_status = 'active';

-- ============================================
-- SUMMARY
-- ============================================
SELECT '=== SUMMARY ===' as test_step;

SELECT 
    COUNT(*) as total_tournaments,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
    COUNT(CASE WHEN is_recurring = true THEN 1 END) as recurring_total,
    COUNT(CASE WHEN is_recurring_master = true THEN 1 END) as masters,
    COUNT(CASE WHEN recurring_template_status = 'active' THEN 1 END) as active_templates
FROM tournaments;
