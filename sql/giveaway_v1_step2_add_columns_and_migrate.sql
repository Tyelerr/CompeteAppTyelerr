-- ============================================================================
-- GIVEAWAY V1 MIGRATION - STEP 2 OF 5
-- ============================================================================
-- Add new columns to giveaways table and migrate data
-- RUN THIS AFTER STEP 1 COMPLETES
-- ============================================================================

-- Add new columns to giveaways table
ALTER TABLE giveaways
ADD COLUMN IF NOT EXISTS max_entries INTEGER NOT NULL DEFAULT 500,
ADD COLUMN IF NOT EXISTS entry_count_cached INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_age INTEGER NOT NULL DEFAULT 18 CHECK (min_age >= 18),
ADD COLUMN IF NOT EXISTS claim_period_days INTEGER NOT NULL DEFAULT 7,
ADD COLUMN IF NOT EXISTS winner_lock_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prize_name TEXT,
ADD COLUMN IF NOT EXISTS prize_arv NUMERIC,
ADD COLUMN IF NOT EXISTS prize_image_url TEXT,
ADD COLUMN IF NOT EXISTS eligibility_text TEXT;

-- Migrate status values (enum values now exist from Step 1)
UPDATE giveaways SET status = 'closed' WHERE status = 'ended';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_giveaways_winner_lock 
  ON giveaways(winner_lock_until) 
  WHERE winner_lock_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_giveaways_entry_count 
  ON giveaways(entry_count_cached, max_entries);

-- Add comments
COMMENT ON COLUMN giveaways.max_entries IS 'Maximum number of entries allowed (required)';
COMMENT ON COLUMN giveaways.entry_count_cached IS 'Cached count of valid entries';
COMMENT ON COLUMN giveaways.min_age IS 'Minimum age requirement (enforced ≥18)';
COMMENT ON COLUMN giveaways.claim_period_days IS 'Days winner has to claim prize (default 7)';
COMMENT ON COLUMN giveaways.winner_lock_until IS '1-minute lock timestamp during winner selection';
COMMENT ON COLUMN giveaways.prize_name IS 'Name of the prize';
COMMENT ON COLUMN giveaways.prize_arv IS 'Approximate Retail Value of prize';
COMMENT ON COLUMN giveaways.eligibility_text IS 'Additional eligibility requirements text';
