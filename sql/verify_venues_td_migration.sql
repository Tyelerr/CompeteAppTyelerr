-- Verification script to check the venues td_id migration
-- Run this after the migration to verify everything worked correctly

-- 1. Check the venues table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'venues' 
AND column_name IN ('td_id', 'barowner_id')
ORDER BY column_name;

-- 2. Check venues with tournament directors assigned
SELECT 
    v.id as venue_id,
    v.venue,
    v.td_id,
    p.name as director_name,
    p.user_name as director_username,
    p.email as director_email,
    v.barowner_id,
    bo.name as bar_owner_name
FROM venues v 
LEFT JOIN profiles p ON v.td_id = p.id_auto 
LEFT JOIN profiles bo ON v.barowner_id = bo.id_auto
WHERE v.td_id IS NOT NULL
ORDER BY v.id;

-- 3. Count venues by bar owner
SELECT 
    v.barowner_id,
    bo.name as bar_owner_name,
    COUNT(v.id) as venue_count,
    COUNT(v.td_id) as venues_with_directors
FROM venues v
LEFT JOIN profiles bo ON v.barowner_id = bo.id_auto
WHERE v.barowner_id IS NOT NULL
GROUP BY v.barowner_id, bo.name
ORDER BY venue_count DESC;

-- 4. Check for any data integrity issues
SELECT 
    'Venues with invalid td_id' as issue_type,
    COUNT(*) as count
FROM venues v
LEFT JOIN profiles p ON v.td_id = p.id_auto
WHERE v.td_id IS NOT NULL AND p.id_auto IS NULL

UNION ALL

SELECT 
    'Venues with invalid barowner_id' as issue_type,
    COUNT(*) as count
FROM venues v
LEFT JOIN profiles p ON v.barowner_id = p.id_auto
WHERE v.barowner_id IS NOT NULL AND p.id_auto IS NULL;
