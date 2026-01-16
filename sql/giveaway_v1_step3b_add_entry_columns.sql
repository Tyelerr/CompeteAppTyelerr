-- ============================================================================
-- GIVEAWAY V1 MIGRATION - STEP 3B OF 6
-- ============================================================================
-- Add columns to giveaway_entries table
-- RUN THIS AFTER STEP 3A COMPLETES
-- ============================================================================

-- Add entry validation columns (enum type now exists from Step 3A)
ALTER TABLE giveaway_entries
ADD COLUMN IF NOT EXISTS status entry_status NOT NULL DEFAULT 'valid',
ADD COLUMN IF NOT EXISTS disqualified_reason TEXT,
ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disqualified_by UUID REFERENCES auth.users(id);

-- Remove duplicate entries (keep the first one)
DELETE FROM giveaway_entries a
USING giveaway_entries b
WHERE a.id > b.id
  AND a.giveaway_id = b.giveaway_id
  AND a.user_id = b.user_id;

-- Add unique constraint for one entry per user per giveaway
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'giveaway_entries_user_giveaway_unique'
  ) THEN
    ALTER TABLE giveaway_entries 
    ADD CONSTRAINT giveaway_entries_user_giveaway_unique 
      UNIQUE (giveaway_id, user_id);
  END IF;
END $$;

-- Create index for valid entries queries
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_status 
  ON giveaway_entries(giveaway_id, status) 
  WHERE status = 'valid';

-- Add comments
COMMENT ON COLUMN giveaway_entries.status IS 'Entry validity status (valid or disqualified)';
COMMENT ON COLUMN giveaway_entries.disqualified_reason IS 'Reason for disqualification';
COMMENT ON COLUMN giveaway_entries.disqualified_at IS 'Timestamp when entry was disqualified';
COMMENT ON COLUMN giveaway_entries.disqualified_by IS 'Admin user who disqualified the entry';
