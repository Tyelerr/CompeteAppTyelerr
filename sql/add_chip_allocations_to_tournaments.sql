-- Add chip_allocations column to tournaments table
-- This column will store chip allocation data for chip tournaments
-- Similar structure to side_pots column

ALTER TABLE tournaments 
ADD COLUMN chip_allocations JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN tournaments.chip_allocations IS 'Stores chip allocation data for chip tournaments. Format: [{"label": "# of chips", "value": "3"}, {"label": "Fargo Range", "value": "700+"}]';

-- Create an index on the chip_allocations column for better query performance
CREATE INDEX IF NOT EXISTS idx_tournaments_chip_allocations ON tournaments USING GIN (chip_allocations);
