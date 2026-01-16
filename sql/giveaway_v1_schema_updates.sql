-- ============================================================================
-- GIVEAWAY V1 SCHEMA UPDATES
-- ============================================================================
-- This script updates the giveaways and giveaway_entries tables to match
-- the Final Giveaway v1 Settings requirements
-- ============================================================================

-- ============================================================================
-- STEP 1: Update giveaways table
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

-- Update status enum to match v1 requirements
-- First, drop the old constraint
ALTER TABLE giveaways DROP CONSTRAINT IF EXISTS giveaways_status_check;

-- Add new constraint with all old AND new values temporarily
ALTER TABLE giveaways ADD CONSTRAINT giveaways_status_check 
  CHECK (status IN ('draft', 'active', 'full', 'drawn', 'closed', 'scheduled', 'ended', 'archived'));

-- Now update existing statuses to new values
UPDATE giveaways SET status = 'active' WHERE status = 'scheduled';
UPDATE giveaways SET status = 'closed' WHERE status = 'ended';
UPDATE giveaways SET status = 'closed' WHERE status = 'archived';

-- Drop and recreate constraint with only new values
ALTER TABLE giveaways DROP CONSTRAINT giveaways_status_check;
ALTER TABLE giveaways ADD CONSTRAINT giveaways_status_check 
  CHECK (status IN ('draft', 'active', 'full', 'drawn', 'closed'));

-- Create index for winner lock queries
CREATE INDEX IF NOT EXISTS idx_giveaways_winner_lock 
  ON giveaways(winner_lock_until) 
  WHERE winner_lock_until IS NOT NULL;

-- Create index for entry count queries
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

-- ============================================================================
-- STEP 2: Update giveaway_entries table
-- ============================================================================

-- Add entry validation columns
ALTER TABLE giveaway_entries
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'disqualified')),
ADD COLUMN IF NOT EXISTS disqualified_reason TEXT,
ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disqualified_by UUID REFERENCES auth.users(id);

-- Add unique constraint for one entry per user per giveaway
-- First, remove any duplicate entries (keep the first one)
DELETE FROM giveaway_entries a
USING giveaway_entries b
WHERE a.id > b.id
  AND a.giveaway_id = b.giveaway_id
  AND a.user_id = b.user_id;

-- Now add the unique constraint
ALTER TABLE giveaway_entries 
ADD CONSTRAINT giveaway_entries_user_giveaway_unique 
  UNIQUE (giveaway_id, user_id);

-- Create index for valid entries queries
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_status 
  ON giveaway_entries(giveaway_id, status) 
  WHERE status = 'valid';

-- Add comments
COMMENT ON COLUMN giveaway_entries.status IS 'Entry validity status (valid or disqualified)';
COMMENT ON COLUMN giveaway_entries.disqualified_reason IS 'Reason for disqualification';
COMMENT ON COLUMN giveaway_entries.disqualified_at IS 'Timestamp when entry was disqualified';
COMMENT ON COLUMN giveaway_entries.disqualified_by IS 'Admin user who disqualified the entry';

-- ============================================================================
-- STEP 3: Create giveaway_winners table
-- ============================================================================

CREATE TABLE IF NOT EXISTS giveaway_winners (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES giveaway_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ranking (1 = primary winner, 2+ = alternates)
  rank INTEGER NOT NULL CHECK (rank > 0),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'selected' CHECK (status IN ('selected', 'notified', 'claimed', 'forfeited', 'disqualified')),
  
  -- Timestamps
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claim_deadline TIMESTAMPTZ NOT NULL,
  notified_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Resolution details
  resolution_reason TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE (giveaway_id, rank),
  UNIQUE (giveaway_id, entry_id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_giveaway ON giveaway_winners(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_user ON giveaway_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_status ON giveaway_winners(giveaway_id, status);
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_rank ON giveaway_winners(giveaway_id, rank);

-- Comments
COMMENT ON TABLE giveaway_winners IS 'Tracks selected winners and alternates for giveaways';
COMMENT ON COLUMN giveaway_winners.rank IS 'Winner rank: 1 = primary winner, 2+ = alternates';
COMMENT ON COLUMN giveaway_winners.status IS 'Winner status: selected, notified, claimed, forfeited, disqualified';
COMMENT ON COLUMN giveaway_winners.claim_deadline IS 'Deadline for winner to claim prize';

-- Enable RLS
ALTER TABLE giveaway_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view winners"
  ON giveaway_winners FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert winners"
  ON giveaway_winners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('compete-admin', 'master-administrator')
    )
  );

CREATE POLICY "Only admins can update winners"
  ON giveaway_winners FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('compete-admin', 'master-administrator')
    )
  );

-- Create function for updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_giveaway_winners_updated_at ON giveaway_winners;
CREATE TRIGGER update_giveaway_winners_updated_at
  BEFORE UPDATE ON giveaway_winners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify giveaways table columns
DO $$
BEGIN
  RAISE NOTICE '✅ Giveaway v1 schema updates completed successfully';
  RAISE NOTICE 'Verifying giveaways table...';
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaways' 
    AND column_name IN ('max_entries', 'entry_count_cached', 'min_age', 'claim_period_days', 'winner_lock_until')
  ) THEN
    RAISE NOTICE '✅ All new giveaways columns exist';
  ELSE
    RAISE WARNING '⚠️ Some giveaways columns may be missing';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'giveaway_entries' 
    AND column_name IN ('status', 'disqualified_reason', 'disqualified_at', 'disqualified_by')
  ) THEN
    RAISE NOTICE '✅ All new giveaway_entries columns exist';
  ELSE
    RAISE WARNING '⚠️ Some giveaway_entries columns may be missing';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'giveaway_winners'
  ) THEN
    RAISE NOTICE '✅ giveaway_winners table created';
  ELSE
    RAISE WARNING '⚠️ giveaway_winners table not found';
  END IF;
END $$;
