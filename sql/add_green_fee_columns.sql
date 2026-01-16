-- Add green fee columns to tournaments table
ALTER TABLE tournaments 
ADD COLUMN green_fee DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN has_green_fee BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN tournaments.green_fee IS 'Optional green fee amount for the tournament';
COMMENT ON COLUMN tournaments.has_green_fee IS 'Boolean flag indicating if tournament has a green fee';
