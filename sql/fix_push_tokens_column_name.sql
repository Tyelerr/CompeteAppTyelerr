-- ============================================
-- FIX PUSH_TOKENS TABLE COLUMN MISMATCH
-- ============================================
-- This script fixes the column name mismatch between code and database
-- The code uses 'token' but the table has 'expo_push_token'
-- ============================================

-- First check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'push_tokens') THEN
    -- Check if we need to rename the column
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'push_tokens' 
               AND column_name = 'expo_push_token') 
    AND NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'push_tokens' 
                   AND column_name = 'token') THEN
      
      -- Rename the column to match what the code expects
      ALTER TABLE public.push_tokens RENAME COLUMN expo_push_token TO token;
      
      -- Update the unique constraint if it exists
      ALTER INDEX IF EXISTS idx_push_tokens_expo_token RENAME TO idx_push_tokens_token;
      
      RAISE NOTICE 'Column renamed from expo_push_token to token';
    ELSE
      RAISE NOTICE 'No column rename needed - token column already exists or expo_push_token does not exist';
    END IF;
    
    -- Ensure RLS policies are correctly set up
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own push tokens" ON public.push_tokens;
    DROP POLICY IF EXISTS "Users can create their own push tokens" ON public.push_tokens;
    DROP POLICY IF EXISTS "Users can update their own push tokens" ON public.push_tokens;
    DROP POLICY IF EXISTS "Users can delete their own push tokens" ON public.push_tokens;
    
    -- Create policies that match exactly what the code expects
    CREATE POLICY "Users can view their own push tokens"
    ON public.push_tokens
    FOR SELECT
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create their own push tokens"
    ON public.push_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own push tokens"
    ON public.push_tokens
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own push tokens"
    ON public.push_tokens
    FOR DELETE
    USING (auth.uid() = user_id);
    
    -- Make sure RLS is enabled
    ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS policies have been updated for push_tokens table';
  ELSE
    RAISE NOTICE 'push_tokens table does not exist - no changes made';
  END IF;
END $$;
