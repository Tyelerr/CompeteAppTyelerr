-- =====================================================
-- UPDATE NULL STATUS TO ACTIVE (Simple Version)
-- =====================================================
-- This migration updates all NULL status values to 'active'
-- Works with TEXT column type (not enum)
-- =====================================================

-- Step 1: Update all NULL status values to 'active'
UPDATE public.profiles
SET status = 'active'
WHERE status IS NULL;

-- Step 2: Verify the update
SELECT 
    COALESCE(status, 'NULL') as status_value,
    COUNT(*) as user_count
FROM public.profiles
GROUP BY status
ORDER BY status;

-- Step 3: Show sample of updated users
SELECT 
    id_auto,
    user_name,
    email,
    status,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- VERIFICATION: Check for any remaining NULL values
-- =====================================================
SELECT COUNT(*) as null_status_count
FROM public.profiles
WHERE status IS NULL;

-- Expected result: 0 (no NULL values should remain)
