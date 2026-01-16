# Latitude and Longitude Implementation for Venues

This document outlines the implementation of precise location coordinates (latitude and longitude) for venues in the CompeteApp system.

## Overview

The system now supports storing and retrieving precise GPS coordinates for venues, enabling accurate location-based features and mapping functionality.

## Database Changes

### SQL Migration: `add_latitude_longitude_to_venues.sql`

**New Columns Added to `venues` table:**

- `latitude` - DECIMAL(10, 8) - Stores latitude coordinates (-90 to 90)
- `longitude` - DECIMAL(11, 8) - Stores longitude coordinates (-180 to 180)

**Features:**

- ✅ Proper data types with appropriate precision for GPS coordinates
- ✅ Check constraints to ensure valid coordinate ranges
- ✅ Indexed for efficient geospatial queries
- ✅ Nullable fields (existing venues won't break)
- ✅ Includes distance calculation function using Haversine formula

**Database Objects Created:**

1. **Columns**: `latitude`, `longitude`
2. **Constraints**: Range validation for coordinates
3. **Index**: `idx_venues_coordinates` for location-based queries
4. **Function**: `calculate_distance_km()` for distance calculations between venues

## TypeScript Interface Updates

### `IVenue` Interface (`InterfacesGlobal.tsx`)

```typescript
export interface IVenue {
  id: number;
  venue: string;
  address: string;
  venue_lat: string; // Legacy field (kept for compatibility)
  venue_lng: string; // Legacy field (kept for compatibility)
  point_location: string; // Legacy field (kept for compatibility)
  profile_id: number;
  phone: string;
  latitude?: number | null; // NEW: Precise latitude coordinate
  longitude?: number | null; // NEW: Precise longitude coordinate
  tables?: IVenueTable[];
}
```

## API Updates

### `CrudVenues.tsx` Changes

**1. Enhanced `ICreateVenueParams` Interface:**

```typescript
interface ICreateVenueParams {
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  barowner_id?: number;
  latitude?: number | null; // NEW
  longitude?: number | null; // NEW
  tables?: Omit<IVenueTable, 'id' | 'venue_id' | 'created_at' | 'updated_at'>[];
}
```

**2. Updated `createVenue()` Function:**

- Now accepts latitude and longitude parameters
- Stores coordinates in database during venue creation
- Maintains backward compatibility with existing code

**3. Enhanced `updateVenue()` Function:**

- Supports updating venue coordinates
- Allows partial updates (can update coordinates independently)
- Maintains existing functionality for other venue fields

## Usage Examples

### Creating a Venue with Coordinates

```typescript
const newVenue = await createVenue({
  name: 'Downtown Pool Hall',
  address: '123 Main St, City, State',
  phone: '555-0123',
  latitude: 40.7128, // NYC latitude
  longitude: -74.006, // NYC longitude
  barowner_id: 123,
  tables: [
    { table_size: ETableSizes.TableSize_9ft, table_brand: 'Diamond', count: 4 },
  ],
});
```

### Updating Venue Coordinates

```typescript
const updatedVenue = await updateVenue(venueId, {
  latitude: 40.7589, // Updated latitude
  longitude: -73.9851, // Updated longitude
});
```

### Fetching Venues (coordinates included automatically)

```typescript
const venues = await fetchVenues('pool hall');
// Each venue now includes latitude/longitude if available
venues.forEach((venue) => {
  if (venue.latitude && venue.longitude) {
    console.log(
      `${venue.venue} is located at: ${venue.latitude}, ${venue.longitude}`,
    );
  }
});
```

## Database Distance Calculations

The implementation includes a `calculate_distance_km()` function for calculating distances between venues:

```sql
-- Calculate distance between two venues
SELECT calculate_distance_km(
  venue1.latitude, venue1.longitude,
  venue2.latitude, venue2.longitude
) as distance_km
FROM venues venue1, venues venue2
WHERE venue1.id = 1 AND venue2.id = 2;
```

## Migration Instructions

1. **Run the SQL Migration:**

   ```sql
   -- Execute the migration file
   \i CompeteApp/sql/add_latitude_longitude_to_venues.sql
   ```

2. **Update Application Code:**

   - The TypeScript interfaces are already updated
   - The API functions are backward compatible
   - Existing venues will have NULL coordinates until updated

3. **Populate Existing Venues (Optional):**
   - Use geocoding services to convert addresses to coordinates
   - Update venues individually or in batch operations

## Benefits

1. **Precise Location Data**: GPS coordinates are more accurate than address-based location
2. **Mapping Integration**: Easy integration with mapping services (Google Maps, etc.)
3. **Distance Calculations**: Built-in function for calculating distances between venues
4. **Location-Based Features**: Enables radius searches, nearest venue finding, etc.
5. **Backward Compatibility**: Existing code continues to work unchanged

## Future Enhancements

- **Geocoding Integration**: Automatically populate coordinates from addresses
- **Radius Search**: Find venues within X kilometers of a location
- **Map Visualization**: Display venues on interactive maps
- **Location-Based Filtering**: Filter tournaments/venues by proximity
- **Route Planning**: Calculate routes between venues

## Notes

- Coordinates are optional (nullable) to maintain compatibility
- Legacy location fields (`venue_lat`, `venue_lng`, `point_location`) are preserved
- The system supports both old and new location data formats
- Database constraints ensure coordinate validity
- Indexed for efficient location-based queries
