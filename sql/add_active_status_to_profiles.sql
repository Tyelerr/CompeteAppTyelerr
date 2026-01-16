-- =====================================================
-- ADD ACTIVE STATUS TO PROFILES TABLE
-- =====================================================
-- This migration adds an 'active' status value to the EUserStatus enum
-- and updates all existing NULL status values to 'active'
-- =====================================================

-- Step 1: Add 'active' to the status enum if it doesn't exist
-- Note: In PostgreSQL, you cannot directly add values to an enum in a simple way
-- We need to check if the type exists and handle it appropriately

DO $$ 
BEGIN
    -- Check if 'active' value already exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'active' 
        AND enumtypid = (
            SELECT oid 
            FROM pg_type 
            WHERE typname = 'user_status'
        )
    ) THEN
        -- Add 'active' to the enum
        ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'active';
        RAISE NOTICE 'Added active status to user_status enum';
    ELSE
        RAISE NOTICE 'Active status already exists in user_status enum';
    END IF;
END $$;

-- Step 2: Update all existing NULL status values to 'active'
UPDATE public.profiles
SET status = 'active'
WHERE status IS NULL;

-- Step 3: Verify the update
SELECT 
    status,
    COUNT(*) as user_count
FROM public.profiles
GROUP BY status
ORDER BY status;

-- Step 4: Add a comment to document the change
COMMENT ON COLUMN public.profiles.status IS 'User account status: active (normal user) or deleted (archived user). Should never be NULL.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all users and their statuses
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

-- Count users by status
SELECT 
    COALESCE(status::text, 'NULL') as status_value,
    COUNT(*) as count
FROM public.profiles
GROUP BY status
ORDER BY status;
