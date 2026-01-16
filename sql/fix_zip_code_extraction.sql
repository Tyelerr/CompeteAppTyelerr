-- Fix ZIP code extraction specifically
-- This script focuses only on extracting ZIP codes from venue addresses

-- First, let's see what addresses we have and their current zip_code status
SELECT 
  id, 
  venue,
  address,
  zip_code,
  -- Show what ZIP patterns exist in the addresses
  CASE 
    WHEN address ~ '\d{5}-\d{4}$' THEN 'ZIP+4 at end'
    WHEN address ~ '\d{5}$' THEN '5-digit ZIP at end'
    WHEN address ~ '[A-Z]{2} \d{5}-\d{4}' THEN 'ZIP+4 after state'
    WHEN address ~ '[A-Z]{2} \d{5}' THEN '5-digit ZIP after state'
    WHEN address ~ '\d{5}' THEN 'ZIP somewhere in address'
    ELSE 'No ZIP pattern found'
  END as zip_pattern
FROM venues 
WHERE address IS NOT NULL AND address != ''
ORDER BY zip_pattern, id
LIMIT 20;

-- Clear existing zip_code data to re-extract
UPDATE venues SET zip_code = NULL;

-- Extract ZIP codes with multiple patterns, in order of specificity

-- Pattern 1: ZIP+4 at the very end (most specific)
UPDATE venues 
SET zip_code = substring(address FROM '(\d{5}-\d{4})$')
WHERE zip_code IS NULL 
  AND address ~ '\d{5}-\d{4}$';

-- Pattern 2: 5-digit ZIP at the very end
UPDATE venues 
SET zip_code = substring(address FROM '(\d{5})$')
WHERE zip_code IS NULL 
  AND address ~ '\d{5}$';

-- Pattern 3: ZIP+4 after state abbreviation
UPDATE venues 
SET zip_code = substring(address FROM '[A-Z]{2} (\d{5}-\d{4})')
WHERE zip_code IS NULL 
  AND address ~ '[A-Z]{2} \d{5}-\d{4}';

-- Pattern 4: 5-digit ZIP after state abbreviation  
UPDATE venues 
SET zip_code = substring(address FROM '[A-Z]{2} (\d{5})')
WHERE zip_code IS NULL 
  AND address ~ '[A-Z]{2} \d{5}';

-- Pattern 5: Any 5-digit number that looks like a ZIP (fallback)
UPDATE venues 
SET zip_code = substring(address FROM '(\d{5})')
WHERE zip_code IS NULL 
  AND address ~ '\d{5}';

-- Show results after ZIP extraction
SELECT 
  'ZIP Extraction Results' as status,
  COUNT(*) as total_venues,
  COUNT(zip_code) as venues_with_zip,
  COUNT(CASE WHEN zip_code ~ '^\d{5}$' THEN 1 END) as five_digit_zips,
  COUNT(CASE WHEN zip_code ~ '^\d{5}-\d{4}$' THEN 1 END) as zip_plus_four
FROM venues;

-- Show sample results with ZIP codes
SELECT 
  id,
  venue,
  address,
  zip_code
FROM venues 
WHERE address IS NOT NULL AND address != ''
ORDER BY 
  CASE WHEN zip_code IS NOT NULL THEN 1 ELSE 2 END,
  id
LIMIT 15;

-- Show addresses that still don't have ZIP codes extracted
SELECT 
  id,
  venue,
  address,
  'Missing ZIP' as issue
FROM venues 
WHERE address IS NOT NULL 
  AND address != ''
  AND zip_code IS NULL
ORDER BY id
LIMIT 10;
