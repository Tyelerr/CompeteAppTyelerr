-- ============================================================================
-- GIVEAWAY V1 MIGRATION - STEP 3A OF 6
-- ============================================================================
-- Create entry_status enum type
-- RUN THIS AFTER STEP 2 COMPLETES
-- ============================================================================

-- Create entry_status enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_status') THEN
    CREATE TYPE entry_status AS ENUM ('valid', 'disqualified');
  END IF;
END $$;

-- Verify it was created
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'entry_status'::regtype
ORDER BY enumsortorder;
