-- ============================================================================
-- FIX: Add missing columns to giveaway_winners table
-- ============================================================================
-- The ModalPickWinner.tsx is trying to use 'picked_at' and 'notified' columns
-- but the table was created with 'selected_at' and uses 'status' enum instead.
-- We need to add these columns for backward compatibility or update the code.
-- 
-- Option 1: Add the missing columns (recommended for backward compatibility)
-- ============================================================================

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
    
    RAISE NOTICE '✅ Added notified column to giveaway_winners';
  ELSE
    RAISE NOTICE 'ℹ️ notified column already exists';
  END IF;
END $$;

-- Create index on picked_at for better query performance
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_picked_at ON giveaway_winners(picked_at);

-- Add comment
COMMENT ON COLUMN giveaway_winners.picked_at IS 'Timestamp when winner was picked (alias for selected_at for backward compatibility)';
COMMENT ON COLUMN giveaway_winners.notified IS 'Boolean flag indicating if winner has been notified (derived from status)';

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  v_picked_at_exists BOOLEAN;
  v_notified_exists BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_winners' AND column_name = 'picked_at'
  ) INTO v_picked_at_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_winners' AND column_name = 'notified'
  ) INTO v_notified_exists;
  
  IF v_picked_at_exists AND v_notified_exists THEN
    RAISE NOTICE '✅ All required columns exist in giveaway_winners table';
  ELSE
    IF NOT v_picked_at_exists THEN
      RAISE WARNING '⚠️ picked_at column is missing';
    END IF;
    IF NOT v_notified_exists THEN
      RAISE WARNING '⚠️ notified column is missing';
    END IF;
  END IF;
END $$;
