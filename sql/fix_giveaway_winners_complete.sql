-- ============================================================================
-- COMPLETE FIX: Add ALL missing columns to giveaway_winners table
-- ============================================================================
-- This fixes the schema mismatch between the code and database
-- The code expects: method, picked_at, notified
-- The database has: selected_at, status (enum)
-- ============================================================================

-- Add method column (for tracking how winner was selected)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_winners' AND column_name = 'method'
  ) THEN
    ALTER TABLE giveaway_winners ADD COLUMN method TEXT NOT NULL DEFAULT 'random';
    
    COMMENT ON COLUMN giveaway_winners.method IS 'Method used to select winner (e.g., random, manual)';
    
    RAISE NOTICE '✅ Added method column to giveaway_winners';
  ELSE
    RAISE NOTICE 'ℹ️ method column already exists';
  END IF;
END $$;

-- Add picked_at column (alias for selected_at)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_winners' AND column_name = 'picked_at'
  ) THEN
    ALTER TABLE giveaway_winners ADD COLUMN picked_at TIMESTAMPTZ;
    
    -- Copy existing selected_at values to picked_at
    UPDATE giveaway_winners SET picked_at = selected_at WHERE picked_at IS NULL;
    
    -- Make it NOT NULL after copying data
    ALTER TABLE giveaway_winners ALTER COLUMN picked_at SET NOT NULL;
    ALTER TABLE giveaway_winners ALTER COLUMN picked_at SET DEFAULT NOW();
    
    COMMENT ON COLUMN giveaway_winners.picked_at IS 'Timestamp when winner was picked (alias for selected_at for backward compatibility)';
    
    RAISE NOTICE '✅ Added picked_at column to giveaway_winners';
  ELSE
    RAISE NOTICE 'ℹ️ picked_at column already exists';
  END IF;
END $$;

-- Add notified column (boolean version of status)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_winners' AND column_name = 'notified'
  ) THEN
    ALTER TABLE giveaway_winners ADD COLUMN notified BOOLEAN NOT NULL DEFAULT false;
    
    -- Set notified to true for winners with status 'notified', 'claimed', etc.
    UPDATE giveaway_winners 
    SET notified = true 
    WHERE status IN ('notified', 'claimed');
    
    COMMENT ON COLUMN giveaway_winners.notified IS 'Boolean flag indicating if winner has been notified (derived from status)';
    
    RAISE NOTICE '✅ Added notified column to giveaway_winners';
  ELSE
    RAISE NOTICE 'ℹ️ notified column already exists';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_picked_at ON giveaway_winners(picked_at);
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_method ON giveaway_winners(method);

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  v_method_exists BOOLEAN;
  v_picked_at_exists BOOLEAN;
  v_notified_exists BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_winners' AND column_name = 'method'
  ) INTO v_method_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_winners' AND column_name = 'picked_at'
  ) INTO v_picked_at_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_winners' AND column_name = 'notified'
  ) INTO v_notified_exists;
  
  IF v_method_exists AND v_picked_at_exists AND v_notified_exists THEN
    RAISE NOTICE '✅ ✅ ✅ ALL required columns exist in giveaway_winners table!';
    RAISE NOTICE 'The Pick Winner feature should now work correctly.';
  ELSE
    IF NOT v_method_exists THEN
      RAISE WARNING '⚠️ method column is missing';
    END IF;
    IF NOT v_picked_at_exists THEN
      RAISE WARNING '⚠️ picked_at column is missing';
    END IF;
    IF NOT v_notified_exists THEN
      RAISE WARNING '⚠️ notified column is missing';
    END IF;
  END IF;
END $$;

-- Show the current schema
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'giveaway_winners'
ORDER BY ordinal_position;
