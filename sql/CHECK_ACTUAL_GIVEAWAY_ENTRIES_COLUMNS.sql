-- ============================================================================
-- CHECK ACTUAL COLUMNS IN GIVEAWAY_ENTRIES TABLE
-- ============================================================================
-- Run this to see what columns actually exist
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'giveaway_entries'
ORDER BY ordinal_position;
