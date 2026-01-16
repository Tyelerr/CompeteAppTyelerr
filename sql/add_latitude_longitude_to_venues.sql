-- SQL migration to add latitude and longitude columns to venues table
-- This will enable precise location storage for venues

-- Add latitude and longitude columns to venues table
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments to document the columns
COMMENT ON COLUMN venues.latitude IS 'Latitude coordinate for precise venue location (-90 to 90)';
COMMENT ON COLUMN venues.longitude IS 'Longitude coordinate for precise venue location (-180 to 180)';

-- Add check constraints to ensure valid coordinate ranges
ALTER TABLE venues 
ADD CONSTRAINT chk_venues_latitude 
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE venues 
ADD CONSTRAINT chk_venues_longitude 
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Create index for geospatial queries (useful for location-based searches)
CREATE INDEX IF NOT EXISTS idx_venues_coordinates ON venues(latitude, longitude);

-- Update existing venues with NULL coordinates (they can be populated later via API)
-- No need to update existing records as they will default to NULL

-- Optional: Create a function to calculate distance between venues (for future use)
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DECIMAL(10,8), 
    lon1 DECIMAL(11,8), 
    lat2 DECIMAL(10,8), 
    lon2 DECIMAL(11,8)
) RETURNS DECIMAL(10,3) AS $$
DECLARE
    earth_radius CONSTANT DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Handle NULL inputs
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Convert degrees to radians and calculate differences
    dlat := RADIANS(lat2 - lat1);
    dlon := RADIANS(lon2 - lon1);
    
    -- Haversine formula
    a := SIN(dlat/2) * SIN(dlat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dlon/2) * SIN(dlon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment to the distance function
COMMENT ON FUNCTION calculate_distance_km IS 'Calculate distance in kilometers between two coordinate points using Haversine formula';
