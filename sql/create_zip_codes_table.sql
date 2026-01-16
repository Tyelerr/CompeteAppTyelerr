-- Create zip_codes table with coordinates for accurate location filtering
CREATE TABLE IF NOT EXISTS zip_codes (
    id SERIAL PRIMARY KEY,
    zip_code VARCHAR(10) NOT NULL UNIQUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    county VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zip_codes_zip_code ON zip_codes(zip_code);
CREATE INDEX IF NOT EXISTS idx_zip_codes_coordinates ON zip_codes(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_zip_codes_state ON zip_codes(state);
CREATE INDEX IF NOT EXISTS idx_zip_codes_city ON zip_codes(city);

-- Add PostGIS point column for spatial queries
ALTER TABLE zip_codes ADD COLUMN IF NOT EXISTS point_location GEOMETRY(POINT, 4326);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_zip_codes_point_location ON zip_codes USING GIST(point_location);

-- Insert comprehensive US zip code data (sample data - in production you'd import from a complete dataset)
INSERT INTO zip_codes (zip_code, latitude, longitude, city, state, county, point_location) VALUES
-- Arizona zip codes (including 85308)
('85308', 33.5331, -112.2840, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.2840, 33.5331), 4326)),
('85301', 33.5387, -112.1859, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.1859, 33.5387), 4326)),
('85302', 33.5331, -112.2840, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.2840, 33.5331), 4326)),
('85303', 33.5331, -112.2840, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.2840, 33.5331), 4326)),
('85304', 33.5331, -112.2840, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.2840, 33.5331), 4326)),
('85305', 33.5331, -112.2840, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.2840, 33.5331), 4326)),
('85306', 33.5331, -112.2840, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.2840, 33.5331), 4326)),
('85307', 33.5331, -112.2840, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.2840, 33.5331), 4326)),
('85309', 33.5331, -112.2840, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.2840, 33.5331), 4326)),
('85310', 33.5331, -112.2840, 'Glendale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.2840, 33.5331), 4326)),

-- Phoenix area
('85001', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),
('85002', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),
('85003', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),
('85004', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),
('85005', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),
('85006', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),
('85007', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),
('85008', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),
('85009', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),
('85010', 33.4484, -112.0740, 'Phoenix', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)),

-- Scottsdale
('85250', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),
('85251', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),
('85252', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),
('85253', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),
('85254', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),
('85255', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),
('85256', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),
('85257', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),
('85258', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),
('85259', 33.4942, -111.9261, 'Scottsdale', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9261, 33.4942), 4326)),

-- Tempe
('85280', 33.4255, -111.9400, 'Tempe', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9400, 33.4255), 4326)),
('85281', 33.4255, -111.9400, 'Tempe', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9400, 33.4255), 4326)),
('85282', 33.4255, -111.9400, 'Tempe', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9400, 33.4255), 4326)),
('85283', 33.4255, -111.9400, 'Tempe', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9400, 33.4255), 4326)),
('85284', 33.4255, -111.9400, 'Tempe', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9400, 33.4255), 4326)),
('85285', 33.4255, -111.9400, 'Tempe', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.9400, 33.4255), 4326)),

-- Mesa
('85201', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),
('85202', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),
('85203', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),
('85204', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),
('85205', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),
('85206', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),
('85207', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),
('85208', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),
('85209', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),
('85210', 33.4152, -111.8315, 'Mesa', 'Arizona', 'Maricopa', ST_SetSRID(ST_MakePoint(-111.8315, 33.4152), 4326)),

-- California major cities
('90210', 34.0901, -118.4065, 'Beverly Hills', 'California', 'Los Angeles', ST_SetSRID(ST_MakePoint(-118.4065, 34.0901), 4326)),
('90211', 34.0901, -118.4065, 'Beverly Hills', 'California', 'Los Angeles', ST_SetSRID(ST_MakePoint(-118.4065, 34.0901), 4326)),
('90212', 34.0901, -118.4065, 'Beverly Hills', 'California', 'Los Angeles', ST_SetSRID(ST_MakePoint(-118.4065, 34.0901), 4326)),
('90001', 33.9731, -118.2479, 'Los Angeles', 'California', 'Los Angeles', ST_SetSRID(ST_MakePoint(-118.2479, 33.9731), 4326)),
('90002', 33.9731, -118.2479, 'Los Angeles', 'California', 'Los Angeles', ST_SetSRID(ST_MakePoint(-118.2479, 33.9731), 4326)),
('90003', 33.9731, -118.2479, 'Los Angeles', 'California', 'Los Angeles', ST_SetSRID(ST_MakePoint(-118.2479, 33.9731), 4326)),
('90004', 34.0522, -118.2437, 'Los Angeles', 'California', 'Los Angeles', ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)),
('90005', 34.0522, -118.2437, 'Los Angeles', 'California', 'Los Angeles', ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)),

-- San Francisco
('94102', 37.7749, -122.4194, 'San Francisco', 'California', 'San Francisco', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)),
('94103', 37.7749, -122.4194, 'San Francisco', 'California', 'San Francisco', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)),
('94104', 37.7749, -122.4194, 'San Francisco', 'California', 'San Francisco', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)),
('94105', 37.7749, -122.4194, 'San Francisco', 'California', 'San Francisco', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)),
('94106', 37.7749, -122.4194, 'San Francisco', 'California', 'San Francisco', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)),

-- New York
('10001', 40.7128, -74.0060, 'New York', 'New York', 'New York', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)),
('10002', 40.7128, -74.0060, 'New York', 'New York', 'New York', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)),
('10003', 40.7128, -74.0060, 'New York', 'New York', 'New York', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)),
('10004', 40.7128, -74.0060, 'New York', 'New York', 'New York', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)),
('10005', 40.7128, -74.0060, 'New York', 'New York', 'New York', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)),

-- Texas major cities
('75201', 32.7767, -96.7970, 'Dallas', 'Texas', 'Dallas', ST_SetSRID(ST_MakePoint(-96.7970, 32.7767), 4326)),
('75202', 32.7767, -96.7970, 'Dallas', 'Texas', 'Dallas', ST_SetSRID(ST_MakePoint(-96.7970, 32.7767), 4326)),
('75203', 32.7767, -96.7970, 'Dallas', 'Texas', 'Dallas', ST_SetSRID(ST_MakePoint(-96.7970, 32.7767), 4326)),
('77001', 29.7604, -95.3698, 'Houston', 'Texas', 'Harris', ST_SetSRID(ST_MakePoint(-95.3698, 29.7604), 4326)),
('77002', 29.7604, -95.3698, 'Houston', 'Texas', 'Harris', ST_SetSRID(ST_MakePoint(-95.3698, 29.7604), 4326)),
('77003', 29.7604, -95.3698, 'Houston', 'Texas', 'Harris', ST_SetSRID(ST_MakePoint(-95.3698, 29.7604), 4326)),

-- Florida major cities
('33101', 25.7617, -80.1918, 'Miami', 'Florida', 'Miami-Dade', ST_SetSRID(ST_MakePoint(-80.1918, 25.7617), 4326)),
('33102', 25.7617, -80.1918, 'Miami', 'Florida', 'Miami-Dade', ST_SetSRID(ST_MakePoint(-80.1918, 25.7617), 4326)),
('33103', 25.7617, -80.1918, 'Miami', 'Florida', 'Miami-Dade', ST_SetSRID(ST_MakePoint(-80.1918, 25.7617), 4326)),
('32801', 28.5383, -81.3792, 'Orlando', 'Florida', 'Orange', ST_SetSRID(ST_MakePoint(-81.3792, 28.5383), 4326)),
('32802', 28.5383, -81.3792, 'Orlando', 'Florida', 'Orange', ST_SetSRID(ST_MakePoint(-81.3792, 28.5383), 4326)),
('32803', 28.5383, -81.3792, 'Orlando', 'Florida', 'Orange', ST_SetSRID(ST_MakePoint(-81.3792, 28.5383), 4326))

ON CONFLICT (zip_code) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    county = EXCLUDED.county,
    point_location = EXCLUDED.point_location,
    updated_at = NOW();

-- Update point_location for any existing records that don't have it
UPDATE zip_codes 
SET point_location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE point_location IS NULL;

-- Create a function to get coordinates for a zip code
CREATE OR REPLACE FUNCTION get_zip_code_coordinates(zip_input VARCHAR(10))
RETURNS TABLE(latitude DECIMAL(10,8), longitude DECIMAL(11,8)) AS $$
BEGIN
    RETURN QUERY
    SELECT z.latitude, z.longitude
    FROM zip_codes z
    WHERE z.zip_code = zip_input
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find zip codes within radius
CREATE OR REPLACE FUNCTION find_zip_codes_within_radius(
    center_zip VARCHAR(10),
    radius_miles INTEGER DEFAULT 25
)
RETURNS TABLE(zip_code VARCHAR(10), distance_miles DECIMAL(10,2)) AS $$
DECLARE
    center_point GEOMETRY;
BEGIN
    -- Get the center point for the given zip code
    SELECT point_location INTO center_point
    FROM zip_codes
    WHERE zip_codes.zip_code = center_zip
    LIMIT 1;
    
    IF center_point IS NULL THEN
        RAISE NOTICE 'Zip code % not found', center_zip;
        RETURN;
    END IF;
    
    -- Find all zip codes within the radius
    RETURN QUERY
    SELECT 
        z.zip_code,
        (ST_Distance(center_point, z.point_location) / 1609.34)::DECIMAL(10,2) as distance_miles
    FROM zip_codes z
    WHERE ST_DWithin(center_point, z.point_location, radius_miles * 1609.34)
    ORDER BY ST_Distance(center_point, z.point_location);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON zip_codes TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_zip_code_coordinates(VARCHAR) TO PUBLIC;
GRANT EXECUTE ON FUNCTION find_zip_codes_within_radius(VARCHAR, INTEGER) TO PUBLIC;

-- Add comment
COMMENT ON TABLE zip_codes IS 'US ZIP codes with latitude/longitude coordinates for location-based filtering';
COMMENT ON FUNCTION get_zip_code_coordinates(VARCHAR) IS 'Get latitude/longitude for a given ZIP code';
COMMENT ON FUNCTION find_zip_codes_within_radius(VARCHAR, INTEGER) IS 'Find all ZIP codes within a given radius of a center ZIP code';
