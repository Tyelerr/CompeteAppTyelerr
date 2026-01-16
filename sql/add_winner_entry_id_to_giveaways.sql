-- Add winner_entry_id column to giveaways table
-- This column stores the ID of the winning entry for each giveaway

-- Add the column if it doesn't exist
ALTER TABLE giveaways 
ADD COLUMN IF NOT EXISTS winner_entry_id UUID REFERENCES giveaway_entries(id) ON DELETE SET NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_giveaways_winner_entry_id ON giveaways(winner_entry_id);

-- Add a comment to document the column
COMMENT ON COLUMN giveaways.winner_entry_id IS 'References the winning entry for this giveaway';
