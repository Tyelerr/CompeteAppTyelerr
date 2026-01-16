-- Add fields for recurring tournament functionality
-- This allows tournaments to be grouped into recurring series

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS recurring_series_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_recurring_master BOOLEAN DEFAULT FALSE;

-- Create index for better performance when querying recurring series
CREATE INDEX IF NOT EXISTS idx_tournaments_recurring_series_id
ON tournaments(recurring_series_id)
WHERE recurring_series_id IS NOT NULL;

-- Create index for recurring master tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_recurring_master
ON tournaments(is_recurring_master)
WHERE is_recurring_master = TRUE;

-- Add comment to document the fields
COMMENT ON COLUMN tournaments.recurring_series_id IS 'Groups tournaments that are part of the same recurring series';
COMMENT ON COLUMN tournaments.is_recurring_master IS 'Indicates if this is the original/master tournament in a recurring series';
