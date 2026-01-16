-- ============================================
-- VERIFY SEARCH_ALERTS RLS CONFIGURATION
-- ============================================
-- This script verifies that RLS is enabled and policies are correctly configured
-- for the search_alerts table
-- ============================================

-- Step 1: Check if RLS is enabled on search_alerts table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'search_alerts';

-- Expected result: rls_enabled should be TRUE

-- ============================================
-- Step 2: List all RLS policies on search_alerts
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'search_alerts'
ORDER BY policyname;

-- Expected policies:
-- 1. "Users can view their own search alerts" - SELECT - USING (auth.uid() = user_id)
-- 2. "Users can create their own search alerts" - INSERT - WITH CHECK (auth.uid() = user_id)
-- 3. "Users can update their own search alerts" - UPDATE - USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
-- 4. "Users can delete their own search alerts" - DELETE - USING (auth.uid() = user_id)

-- ============================================
-- Step 3: Verify table structure matches expected schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'search_alerts'
ORDER BY ordinal_position;

-- Expected columns (21 total):
-- id, user_id, alert_name, game_type, format, equipment, reports_to_fargo,
-- max_entry_fee, min_fargo, max_fargo, required_fargo_games, table_size,
-- is_open_tournament, city, state, location_text, date_from, date_to,
-- is_enabled, created_at, updated_at

-- ============================================
-- Step 4: Check indexes for performance
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'search_alerts'
ORDER BY indexname;

-- Expected indexes:
-- - idx_search_alerts_user_id
-- - idx_search_alerts_is_enabled
-- - idx_search_alerts_user_enabled
-- - idx_search_alerts_created_at

-- ============================================
-- Step 5: Verify the updated_at trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'search_alerts';

-- Expected trigger: trigger_update_search_alerts_updated_at

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ RLS should be enabled
-- ✅ 4 policies should exist (SELECT, INSERT, UPDATE, DELETE)
-- ✅ All policies should use auth.uid() = user_id
-- ✅ 21 columns should exist
-- ✅ 4 indexes should exist for performance
-- ✅ updated_at trigger should exist
-- ============================================
