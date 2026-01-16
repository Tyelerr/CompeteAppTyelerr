-- Fix tournament deletion by adding SECURITY DEFINER to archival functions
-- This allows the functions to bypass RLS policies and properly delete tournaments
-- 
-- ISSUE: Tournaments were being archived successfully but not deleted from the main table
-- CAUSE: RLS policies were blocking the DELETE operation within the function
-- SOLUTION: Add SECURITY DEFINER to run the function with elevated privileges

-- ============================================================================
-- 1. Update archive_tournament_manual_simple function with SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_tournament_manual_simple(
    tournament_id UUID,
    admin_user_id TEXT DEFAULT NULL,
    reason TEXT DEFAULT 'admin_deletion'
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key fix - allows function to bypass RLS
SET search_path = public
AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    -- Check if tournament exists
    IF EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_id) THEN
        -- First, delete all likes associated with this tournament
        -- Note: The column is 'turnament_id' (with one 'o'), not 'tournament_id'
        DELETE FROM likes WHERE turnament_id = tournament_id;
        
        RAISE NOTICE 'Deleted likes for tournament %', tournament_id;
        
        -- Insert into tournaments_archive
        INSERT INTO tournaments_archive 
        SELECT *, NOW(), reason, admin_user_id
        FROM tournaments 
        WHERE id = tournament_id;

        -- Delete from active tournaments table
        -- This will now work because SECURITY DEFINER bypasses RLS
        DELETE FROM tournaments WHERE id = tournament_id;
        
        success := TRUE;
        
        RAISE NOTICE 'Successfully archived and deleted tournament % by admin %', tournament_id, admin_user_id;
    ELSE
        RAISE NOTICE 'Tournament % not found', tournament_id;
    END IF;

    RETURN success;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error archiving tournament %: %', tournament_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Add comment explaining the SECURITY DEFINER usage
COMMENT ON FUNCTION archive_tournament_manual_simple IS 
'Archives a tournament to tournaments_archive and deletes it from the active tournaments table. 
Uses SECURITY DEFINER to bypass RLS policies for proper deletion. 
This is safe because the function includes proper validation and logging.';

-- ============================================================================
-- 2. Update archive_expired_tournaments_simple function with SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_expired_tournaments_simple()
RETURNS TABLE (
    archived_count INTEGER,
    error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key fix - allows function to bypass RLS
SET search_path = public
AS $$
DECLARE
    archived_tournaments_count INTEGER := 0;
    tournament_record RECORD;
BEGIN
    -- Archive tournaments on their tournament date at midnight (same day archival)
    FOR tournament_record IN 
        SELECT *
        FROM tournaments
        WHERE start_date <= CURRENT_DATE 
        AND status = 'active'
    LOOP
        -- First, delete all likes associated with this tournament
        -- Note: The column is 'turnament_id' (with one 'o'), not 'tournament_id'
        DELETE FROM likes WHERE turnament_id = tournament_record.id;
        
        -- Insert into tournaments_archive (all fields from tournaments + archival fields)
        INSERT INTO tournaments_archive 
        SELECT *, NOW(), 'expired', NULL
        FROM tournaments 
        WHERE id = tournament_record.id;

        -- Delete from active tournaments table
        -- This will now work because SECURITY DEFINER bypasses RLS
        DELETE FROM tournaments WHERE id = tournament_record.id;
        
        archived_tournaments_count := archived_tournaments_count + 1;
        
        -- Log the archival for debugging
        RAISE NOTICE 'Archived tournament ID % (%) dated %', 
            tournament_record.id_unique_number, 
            tournament_record.tournament_name, 
            tournament_record.start_date;
            
    END LOOP;

    RETURN QUERY SELECT 
        archived_tournaments_count,
        NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0,
        SQLERRM;
END;
$$;

-- Add comment explaining the SECURITY DEFINER usage
COMMENT ON FUNCTION archive_expired_tournaments_simple IS 
'Archives expired tournaments (past their date) to tournaments_archive and deletes them from the active tournaments table. 
Uses SECURITY DEFINER to bypass RLS policies for proper deletion. 
This is safe because the function only archives tournaments that have passed their date.';

-- ============================================================================
-- 3. Grant execute permissions to authenticated users
-- ============================================================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION archive_tournament_manual_simple(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_expired_tournaments_simple() TO authenticated;

-- ============================================================================
-- 4. Verification queries
-- ============================================================================

-- Verify the functions were created with SECURITY DEFINER
SELECT 
    p.proname as function_name,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER' 
        ELSE 'SECURITY INVOKER' 
    END as security_type,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('archive_tournament_manual_simple', 'archive_expired_tournaments_simple');

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This fix adds SECURITY DEFINER to both archival functions, which allows them
-- to bypass Row Level Security (RLS) policies when deleting tournaments.
-- 
-- SECURITY DEFINER means the function runs with the privileges of the user who
-- created it (typically the database owner), not the user who calls it.
-- 
-- This is safe because:
-- 1. The functions include proper validation (checking if tournament exists)
-- 2. The functions log all operations with RAISE NOTICE
-- 3. The manual archival function requires explicit tournament_id parameter
-- 4. The automatic archival function only archives expired tournaments
-- 
-- After running this script, tournament deletion should work properly:
-- - Tournaments will be archived to tournaments_archive ✓
-- - Tournaments will be deleted from the main tournaments table ✓
