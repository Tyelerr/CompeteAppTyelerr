-- ============================================================================
-- FIX GIVEAWAYS_ARCHIVE TABLE - ADD V1 COLUMNS
-- ============================================================================
-- The giveaways_archive table is missing the new v1 columns that were added
-- to the giveaways table. This causes "INSERT has more expressions than target
-- columns" error when trying to archive/delete giveaways.
-- ============================================================================

-- Add all new v1 columns to giveaways_archive table
ALTER TABLE giveaways_archive
ADD COLUMN IF NOT EXISTS max_entries INTEGER,
ADD COLUMN IF NOT EXISTS entry_count_cached INTEGER,
ADD COLUMN IF NOT EXISTS min_age INTEGER,
ADD COLUMN IF NOT EXISTS claim_period_days INTEGER,
ADD COLUMN IF NOT EXISTS winner_lock_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prize_name TEXT,
ADD COLUMN IF NOT EXISTS prize_arv NUMERIC,
ADD COLUMN IF NOT EXISTS prize_image_url TEXT,
ADD COLUMN IF NOT EXISTS eligibility_text TEXT;

-- Verify the columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaways_archive' 
    AND column_name IN ('max_entries', 'entry_count_cached', 'min_age', 'claim_period_days', 'winner_lock_until', 'prize_name', 'prize_arv', 'prize_image_url', 'eligibility_text')
  ) THEN
    RAISE NOTICE '✅ All v1 columns added to giveaways_archive table';
  ELSE
    RAISE WARNING '⚠️ Some columns may be missing from giveaways_archive';
  END IF;
END $$;

-- Show current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'giveaways_archive'
ORDER BY ordinal_position;
