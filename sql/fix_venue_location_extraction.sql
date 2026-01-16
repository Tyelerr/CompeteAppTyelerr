-- Fix venue location extraction - improved regex patterns for city and zip
-- This script improves the extraction logic for city and zip_code fields

-- First, let's see what addresses we're working with
SELECT 
  id, 
  venue,
  address,
  city,
  state,
  zip_code
FROM venues 
WHERE address IS NOT NULL AND address != ''
ORDER BY id
LIMIT 10;

-- Clear existing city and zip data to re-extract with better patterns
UPDATE venues SET city = NULL, zip_code = NULL;

-- Extract state first (this was working)
UPDATE venues 
SET state = substring(address FROM ', ([A-Z]{2}) \d{5}')
WHERE state IS NULL 
  AND address IS NOT NULL 
  AND address != ''
  AND address ~ ', [A-Z]{2} \d{5}';

-- Extract state (2-letter code at end without zip)
UPDATE venues 
SET state = substring(address FROM ', ([A-Z]{2})$')
WHERE state IS NULL 
  AND address IS NOT NULL 
  AND address != ''
  AND address ~ ', [A-Z]{2}$';

-- Extract zip code - improved patterns
-- Pattern 1: 5 digits at end
UPDATE venues 
SET zip_code = substring(address FROM '(\d{5})$')
WHERE zip_code IS NULL 
  AND address IS NOT NULL 
  AND address != ''
  AND address ~ '\d{5}$';

-- Pattern 2: 5+4 digits at end  
UPDATE venues 
SET zip_code = substring(address FROM '(\d{5}-\d{4})$')
WHERE zip_code IS NULL 
  AND address IS NOT NULL 
  AND address != ''
  AND address ~ '\d{5}-\d{4}$';

-- Pattern 3: ZIP after state with comma
UPDATE venues 
SET zip_code = substring(address FROM '[A-Z]{2} (\d{5}(-\d{4})?)$')
WHERE zip_code IS NULL 
  AND address IS NOT NULL 
  AND address != ''
  AND address ~ '[A-Z]{2} \d{5}(-\d{4})?$';

-- Extract city - improved patterns
-- Pattern 1: City before ", STATE ZIP" format
UPDATE venues 
SET city = trim(substring(address FROM '([^,]+), [A-Z]{2} \d{5}'))
WHERE city IS NULL 
  AND address IS NOT NULL 
  AND address != ''
  AND address ~ '[^,]+, [A-Z]{2} \d{5}';

-- Pattern 2: City before ", STATE" format (no ZIP)
UPDATE venues 
SET city = trim(substring(address FROM '([^,]+), [A-Z]{2}$'))
WHERE city IS NULL 
  AND address IS NOT NULL 
  AND address != ''
  AND address ~ '[^,]+, [A-Z]{2}$';

-- Pattern 3: Handle addresses with multiple commas - get the part before the last comma with state
UPDATE venues 
SET city = trim(substring(address FROM '([^,]+), [^,]*, [A-Z]{2}'))
WHERE city IS NULL 
  AND address IS NOT NULL 
  AND address != ''
  AND address ~ '[^,]+, [^,]*, [A-Z]{2}';

-- Pattern 4: Simple city extraction - everything before first comma
UPDATE venues 
SET city = trim(substring(address FROM '^([^,]+)'))
WHERE city IS NULL 
  AND address IS NOT NULL 
  AND address != ''
  AND address ~ '^[^,]+,';

-- Show results after extraction
SELECT 
  'Extraction Results' as status,
  COUNT(*) as total_venues,
  COUNT(state) as venues_with_state,
  COUNT(city) as venues_with_city,
  COUNT(zip_code) as venues_with_zip,
  COUNT(CASE WHEN state IS NOT NULL AND city IS NOT NULL AND zip_code IS NOT NULL THEN 1 END) as complete_location_data
FROM venues;

-- Show sample results
SELECT 
  id,
  venue,
  address,
  city,
  state,
  zip_code
FROM venues 
WHERE address IS NOT NULL AND address != ''
ORDER BY 
  CASE WHEN city IS NOT NULL AND state IS NOT NULL AND zip_code IS NOT NULL THEN 1 ELSE 2 END,
  id
LIMIT 15;

-- Show addresses that still need manual review
SELECT 
  id,
  venue,
  address,
  city,
  state,
  zip_code
FROM venues 
WHERE address IS NOT NULL 
  AND address != ''
  AND (city IS NULL OR zip_code IS NULL)
ORDER BY id;
