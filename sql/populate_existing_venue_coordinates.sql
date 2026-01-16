-- SQL script to populate latitude and longitude for existing venues
-- This script identifies venues that need coordinates and provides a framework for updating them

-- First, let's see which venues need coordinates
SELECT 
    id,
    venue,
    address,
    latitude,
    longitude,
    CASE 
        WHEN latitude IS NULL OR longitude IS NULL THEN 'NEEDS_COORDINATES'
        ELSE 'HAS_COORDINATES'
    END as coordinate_status
FROM venues
ORDER BY id;

-- Count venues that need coordinates
SELECT 
    COUNT(*) as total_venues,
    COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as venues_needing_coordinates,
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as venues_with_coordinates
FROM venues;

-- Example manual updates for specific venues (replace with actual coordinates)
-- You can use online geocoding services to get coordinates for each address

-- Template for updating individual venues:
-- UPDATE venues 
-- SET latitude = [LATITUDE], longitude = [LONGITUDE] 
-- WHERE id = [VENUE_ID];

-- Example updates (replace with real coordinates):
/*
UPDATE venues SET latitude = 40.7128, longitude = -74.0060 WHERE venue = 'Downtown Pool Hall';
UPDATE venues SET latitude = 34.0522, longitude = -118.2437 WHERE venue = 'LA Billiards';
UPDATE venues SET latitude = 41.8781, longitude = -87.6298 WHERE venue = 'Chicago Cue Club';
*/

-- Verify updates
-- SELECT id, venue, address, latitude, longitude 
-- FROM venues 
-- WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
