-- ============================================================================
-- FIX EXISTING GIVEAWAY_WINNERS TABLE
-- ============================================================================
-- This fixes the existing giveaway_winners table that's missing the status column
-- Run this INSTEAD of Step 4 if you already have a giveaway_winners table
-- ============================================================================

-- Option 1: Drop and recreate (RECOMMENDED if table is empty or you can lose data)
DROP TABLE IF EXISTS giveaway_winners CASCADE;

-- Create winner_status enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'winner_status') THEN
    CREATE TYPE winner_status AS ENUM ('selected', 'notified', 'claimed', 'forfeited', 'disqualified');
  END IF;
END $$;

-- Create the table with correct schema
CREATE TABLE giveaway_winners (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES giveaway_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ranking (1 = primary winner, 2+ = alternates)
  rank INTEGER NOT NULL CHECK (rank > 0),
  
  -- Status tracking
  status winner_status NOT NULL DEFAULT 'selected',
  
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
CREATE INDEX idx_giveaway_winners_giveaway ON giveaway_winners(giveaway_id);
CREATE INDEX idx_giveaway_winners_user ON giveaway_winners(user_id);
CREATE INDEX idx_giveaway_winners_status ON giveaway_winners(giveaway_id, status);
CREATE INDEX idx_giveaway_winners_rank ON giveaway_winners(giveaway_id, rank);

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

-- Create function for updated_at trigger
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

-- Verify
SELECT 'giveaway_winners table recreated successfully!' AS message;
