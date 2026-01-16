-- Fix Registration Validation - Allow Anonymous Users to Check Username/Email Availability
-- This creates secure database functions that anonymous users can call

-- ============================================
-- STEP 1: Create secure functions for validation
-- ============================================

-- Function to check username availability (case-insensitive)
CREATE OR REPLACE FUNCTION public.check_username_available(username_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_exists BOOLEAN;
BEGIN
  -- Check if username exists (case-insensitive, excluding deleted users)
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE LOWER(user_name) = LOWER(username_to_check)
    AND (status IS NULL OR status != 'deleted')
  ) INTO username_exists;
  
  -- Return TRUE if available (NOT exists), FALSE if taken
  RETURN NOT username_exists;
END;
$$;

-- Function to check email availability (case-insensitive)
CREATE OR REPLACE FUNCTION public.check_email_available(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  -- Check if email exists (case-insensitive, excluding deleted users)
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE LOWER(email) = LOWER(email_to_check)
    AND (status IS NULL OR status != 'deleted')
  ) INTO email_exists;
  
  -- Return TRUE if available (NOT exists), FALSE if taken
  RETURN NOT email_exists;
END;
$$;

-- ============================================
-- STEP 2: Grant execute permissions to anonymous users
-- ============================================

GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_available(TEXT) TO anon;

-- ============================================
-- STEP 3: Add indexes for performance (if not already exist)
-- ============================================

-- Index on lowercase username for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_name_lower
ON profiles (LOWER(user_name))
WHERE status IS DISTINCT FROM 'deleted';

-- Index on lowercase email for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
ON profiles (LOWER(email))
WHERE status IS DISTINCT FROM 'deleted';

-- ============================================
-- VERIFICATION
-- ============================================

-- Test the functions (should return TRUE for available, FALSE for taken)
-- SELECT check_username_available('nonexistent_user_12345');  -- Should return TRUE
-- SELECT check_email_available('nonexistent@example.com');    -- Should return TRUE

-- If you have existing users, test with their data:
-- SELECT check_username_available('existing_username');  -- Should return FALSE
-- SELECT check_email_available('existing@email.com');    -- Should return FALSE
