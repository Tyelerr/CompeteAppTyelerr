-- ============================================
-- Fix Push Tokens RLS Policies
-- ============================================
-- This script ensures proper RLS policies for the push_tokens table
-- Run this in Supabase SQL Editor

-- Check current RLS policies
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
WHERE tablename = 'push_tokens';

-- Enable RLS if not already enabled
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can view their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Service role can manage all push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON push_tokens;
DROP POLICY IF EXISTS "Enable read access for users to their own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Enable update for users to their own tokens" ON push_tokens;

-- Create proper RLS policies

-- 1. Allow authenticated users to insert their own tokens
CREATE POLICY "Users can insert their own push tokens"
ON push_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow authenticated users to view their own tokens
CREATE POLICY "Users can view their own push tokens"
ON push_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow authenticated users to update their own tokens
CREATE POLICY "Users can update their own push tokens"
ON push_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Allow authenticated users to delete their own tokens
CREATE POLICY "Users can delete their own push tokens"
ON push_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Allow service role to manage all tokens (for edge function)
CREATE POLICY "Service role can manage all push tokens"
ON push_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created successfully
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'push_tokens'
ORDER BY policyname;

-- Test query to verify RLS is working
-- This should return 0 rows if no tokens exist for the current user
SELECT COUNT(*) as my_token_count
FROM push_tokens
WHERE user_id = auth.uid();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Push tokens RLS policies have been updated successfully!';
  RAISE NOTICE '📋 Total policies created: 5';
  RAISE NOTICE '   1. Users can insert their own push tokens';
  RAISE NOTICE '   2. Users can view their own push tokens';
  RAISE NOTICE '   3. Users can update their own push tokens';
  RAISE NOTICE '   4. Users can delete their own push tokens';
  RAISE NOTICE '   5. Service role can manage all push tokens';
END $$;
