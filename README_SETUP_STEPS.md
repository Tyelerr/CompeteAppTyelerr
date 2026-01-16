# Setup Steps for Latitude/Longitude Implementation

## You're Right - Here's the Exact Order:

### Step 1: Run the SQL Migration First ⚠️ REQUIRED

You need to run this SQL file to add the latitude/longitude columns to your venues table:

```sql
-- Execute this in your database console/SQL editor
\i CompeteApp/sql/add_latitude_longitude_to_venues.sql
```

**OR copy and paste the contents directly:**

```sql
-- Add latitude and longitude columns to venues table
ALTER TABLE venues
ADD COLUMN latitude DECIMAL(10,8) NULL,
ADD COLUMN longitude DECIMAL(11,8) NULL;

-- Add constraints to ensure valid coordinate ranges
ALTER TABLE venues
ADD CONSTRAINT check_latitude_range
CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE venues
ADD CONSTRAINT check_longitude_range
CHECK (longitude >= -180 AND longitude <= 180);

-- Create index for efficient location-based queries
CREATE INDEX idx_venues_coordinates ON venues(latitude, longitude);

-- Create function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DECIMAL(10,8),
    lng1 DECIMAL(11,8),
    lat2 DECIMAL(10,8),
    lng2 DECIMAL(11,8)
) RETURNS DECIMAL(10,3) AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Convert degrees to radians
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);

    -- Haversine formula
    a := SIN(dlat/2) * SIN(dlat/2) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dlng/2) * SIN(dlng/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));

    -- Return distance in kilometers
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;
```

### Step 2: Verify the Columns Were Added

After running the migration, check that the columns exist:

```sql
-- Check if columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'venues'
AND column_name IN ('latitude', 'longitude');

-- View your venues table structure
\d venues;

-- See your venues with the new columns (they'll be NULL initially)
SELECT id, venue, address, latitude, longitude FROM venues LIMIT 5;
```

### Step 3: Populate Coordinates for Existing Venues

**Only AFTER the columns exist**, run the geocoding to populate coordinates:

```typescript
// Add this to your app or run as a script
import { testGeocoding } from './ApiSupabase/GeocodeVenues';

const populateCoordinates = async () => {
  console.log('Starting geocoding...');
  const results = await testGeocoding();
  console.log('Geocoding complete:', results);
};

populateCoordinates();
```

## Why You Don't See Updates Yet:

1. **Columns don't exist yet** - You need to run the SQL migration first
2. **Coordinates are NULL** - After migration, all existing venues will have NULL coordinates
3. **Geocoding populates them** - The TypeScript geocoding function fills in the coordinates

## Quick Check:

Run this to see if the columns exist:

```sql
SELECT COUNT(*) as venues_with_columns
FROM information_schema.columns
WHERE table_name = 'venues'
AND column_name IN ('latitude', 'longitude');
```

If it returns `2`, the columns exist. If it returns `0`, you need to run the migration first.

## After Migration Success:

You'll see:

```sql
SELECT id, venue, latitude, longitude FROM venues;
-- Results will show:
-- id | venue | latitude | longitude
-- 1  | Hall1 | NULL     | NULL
-- 2  | Hall2 | NULL     | NULL
```

Then after geocoding:

```sql
-- Results will show:
-- id | venue | latitude  | longitude
-- 1  | Hall1 | 40.7128   | -74.0060
-- 2  | Hall2 | 34.0522   | -118.2437
```
