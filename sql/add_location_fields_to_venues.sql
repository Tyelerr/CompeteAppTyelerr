-- Add city, state, and zip_code fields to venues table
-- This ensures venues have location data that can be used for filtering

-- Add the new columns if they don't exist
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(2),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_venues_state ON venues(state);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_zip_code ON venues(zip_code);
CREATE INDEX IF NOT EXISTS idx_venues_state_city ON venues(state, city);

-- Update existing venues by extracting city, state, and zip from address field
-- This is a best-effort extraction from existing address data
UPDATE venues 
SET 
  state = CASE 
    WHEN address ~ ', ([A-Z]{2}) \d{5}' THEN 
      (regexp_matches(address, ', ([A-Z]{2}) \d{5}'))[1]
    WHEN address ~ ', ([A-Z]{2})$' THEN 
      (regexp_matches(address, ', ([A-Z]{2})$'))[1]
    ELSE NULL
  END,
  zip_code = CASE 
    WHEN address ~ '\d{5}(-\d{4})?$' THEN 
      (regexp_matches(address, '(\d{5}(-\d{4})?)$'))[1]
    ELSE NULL
  END,
  city = CASE 
    WHEN address ~ '([^,]+), [A-Z]{2}( \d{5})?$' THEN 
      TRIM((regexp_matches(address, '([^,]+), [A-Z]{2}( \d{5})?$'))[1])
    WHEN address ~ '([^,]+), [A-Z]{2}$' THEN 
      TRIM((regexp_matches(address, '([^,]+), [A-Z]{2}$'))[1])
    ELSE NULL
  END
WHERE 
  (city IS NULL OR state IS NULL OR zip_code IS NULL) 
  AND address IS NOT NULL 
  AND address != '';

-- Add comments to document the new columns
COMMENT ON COLUMN venues.city IS 'City name extracted from address for filtering';
COMMENT ON COLUMN venues.state IS 'Two-letter state code (e.g., NV, CA) for filtering';
COMMENT ON COLUMN venues.zip_code IS 'ZIP code for radius-based filtering';

-- Display migration results
SELECT 
  COUNT(*) as total_venues,
  COUNT(state) as venues_with_state,
  COUNT(city) as venues_with_city,
  COUNT(zip_code) as venues_with_zip,
  COUNT(CASE WHEN state IS NOT NULL AND city IS NOT NULL AND zip_code IS NOT NULL THEN 1 END) as complete_location_data
FROM venues;
