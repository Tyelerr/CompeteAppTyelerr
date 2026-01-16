-- Fix duplicate IDs in tournaments_archive and add primary key
-- This handles the case where tournaments were archived multiple times

-- Step 1: Check for duplicates
SELECT 
    id, 
    COUNT(*) as duplicate_count,
    STRING_AGG(removal_date::text, ', ') as removal_dates
FROM tournaments_archive
GROUP BY id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Keep only the most recent archive entry for each tournament
-- Delete older duplicate entries, keeping the one with the latest removal_date
DELETE FROM tournaments_archive a
USING (
    SELECT id, MAX(removal_date) as latest_removal_date
    FROM tournaments_archive
    GROUP BY id
    HAVING COUNT(*) > 1
) b
WHERE a.id = b.id 
AND a.removal_date < b.latest_removal_date;

-- Step 3: Verify no duplicates remain
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT id
        FROM tournaments_archive
        GROUP BY id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Still have % duplicate IDs after cleanup', duplicate_count;
    ELSE
        RAISE NOTICE 'All duplicates cleaned up successfully!';
    END IF;
END $$;

-- Step 4: Now add the primary key
ALTER TABLE tournaments_archive 
ADD PRIMARY KEY (id);

-- Step 5: Verify the primary key was added
SELECT 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tournaments_archive' 
    AND tc.constraint_type = 'PRIMARY KEY';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Primary key added to tournaments_archive table successfully!';
    RAISE NOTICE '✅ Duplicate entries have been removed (kept most recent)';
    RAISE NOTICE '✅ You can now delete rows directly from the Supabase dashboard';
END $$;
