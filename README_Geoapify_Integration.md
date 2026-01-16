# Geoapify Integration Guide

This guide explains how Geoapify has been integrated into your CompeteApp to provide enhanced location services.

## 🚀 What's Been Added

### 1. **GeoapifyService.tsx** - Core Service

- **Location**: `CompeteApp/ApiSupabase/GeoapifyService.tsx`
- **Purpose**: Main service class for all Geoapify API interactions
- **Features**:
  - Forward geocoding (address → coordinates)
  - Reverse geocoding (coordinates → address)
  - Address autocomplete
  - Distance calculations
  - Places search within radius
  - API key validation

### 2. **Enhanced GeocodeVenues.tsx** - Updated Venue Geocoding

- **Location**: `CompeteApp/ApiSupabase/GeocodeVenues.tsx`
- **Changes**: Now uses Geoapify as primary service with Nominatim fallback
- **Benefits**: Better accuracy, faster responses, more reliable

### 3. **GeoapifyAddressAutocomplete.tsx** - Smart Address Input

- **Location**: `CompeteApp/components/LocationFilters/GeoapifyAddressAutocomplete.tsx`
- **Purpose**: Autocomplete component for address inputs
- **Features**:
  - Real-time address suggestions
  - Debounced API calls (300ms)
  - Loading indicators
  - Error handling
  - Customizable styling

### 4. **API Configuration** - Secure Key Management

- **Location**: `CompeteApp/hooks/constants.tsx`
- **Added**: Geoapify API key and base URL constants

## 🔧 How to Use

### Basic Geocoding

```typescript
import GeoapifyService from '../ApiSupabase/GeoapifyService';

// Forward geocoding
const result = await GeoapifyService.geocodeAddress(
  '1600 Amphitheatre Parkway, Mountain View, CA',
);
if (result) {
  console.log(`Coordinates: ${result.latitude}, ${result.longitude}`);
  console.log(`Formatted: ${result.formatted_address}`);
}

// Reverse geocoding
const address = await GeoapifyService.reverseGeocode(37.4224764, -122.0842499);
if (address) {
  console.log(`Address: ${address.formatted}`);
}
```

### Address Autocomplete Component

```tsx
import GeoapifyAddressAutocomplete from '../components/LocationFilters/GeoapifyAddressAutocomplete';

<GeoapifyAddressAutocomplete
  label="Venue Address"
  placeholder="Enter venue address..."
  onAddressSelect={(address) => {
    console.log('Selected:', address);
    // Use address.lat, address.lon, address.formatted, etc.
  }}
  countryCode="us"
/>;
```

### Enhanced Venue Geocoding

```typescript
import {
  geocodeAddress,
  geocodeAddressEnhanced,
} from '../ApiSupabase/GeocodeVenues';

// Standard geocoding (Geoapify + Nominatim fallback)
const result = await geocodeAddress('123 Main St, Chicago, IL');

// Enhanced geocoding with options
const result = await geocodeAddressEnhanced('123 Main St', {
  preferredService: 'geoapify',
  countryCode: 'us',
  bias: { lat: 41.8781, lon: -87.6298 }, // Chicago coordinates for better results
});
```

## 🧪 Testing

### Run Integration Tests

```bash
cd CompeteApp
node test_geoapify_integration.js
```

This will test:

- API key validation
- Forward geocoding
- Reverse geocoding
- Autocomplete functionality
- Distance calculations

### Test Your Existing Venues

Your existing venue geocoding will now automatically use Geoapify:

```bash
cd CompeteApp
node run_geocoding.js
```

## 🎯 Integration Points

### 1. **Venue Creation Forms**

Replace standard address inputs with `GeoapifyAddressAutocomplete`:

```tsx
// Before
<LFInput
  typeInput="default"
  placeholder="Enter address"
  label="Address"
  value={address}
  onChangeText={setAddress}
/>

// After
<GeoapifyAddressAutocomplete
  label="Address"
  placeholder="Enter venue address..."
  value={address}
  onAddressSelect={(selectedAddress) => {
    setAddress(selectedAddress.formatted);
    setLatitude(selectedAddress.lat);
    setLongitude(selectedAddress.lon);
    setCity(selectedAddress.city);
    setState(selectedAddress.state);
  }}
/>
```

### 2. **Location Filters Enhancement**

Your existing `LocationFilters_Final.tsx` can be enhanced with autocomplete:

```tsx
// Add to state/city dropdowns
<GeoapifyAddressAutocomplete
  label="Search Location"
  placeholder="Search by address, city, or venue..."
  onAddressSelect={(address) => {
    // Auto-populate state, city, zip based on selection
    if (address.state) setState(address.state);
    if (address.city) setCity(address.city);
    if (address.postcode) setZipCode(address.postcode);
  }}
/>
```

### 3. **Distance-Based Search**

Enhance tournament/venue searches with accurate distance calculations:

```typescript
// Calculate distances for radius-based filtering
const userLocation = { lat: userLat, lon: userLon };
const venues = await fetchVenues();

const venuesWithDistance = await Promise.all(
  venues.map(async (venue) => {
    const distance = await GeoapifyService.calculateDistance(
      userLocation,
      { lat: venue.latitude, lon: venue.longitude },
      'drive',
    );
    return {
      ...venue,
      distance: distance ? distance.distance / 1000 : null, // km
      duration: distance ? distance.duration / 60 : null, // minutes
    };
  }),
);
```

## 🔒 Security Notes

1. **API Key**: Your Geoapify API key is stored in `constants.tsx`. For production:

   - Consider using environment variables
   - Implement server-side proxy for sensitive operations
   - Monitor API usage to prevent abuse

2. **Rate Limiting**: Geoapify has generous rate limits, but consider:
   - Implementing client-side caching
   - Debouncing autocomplete requests (already implemented)
   - Fallback to Nominatim for non-critical operations

## 📊 Benefits Over Previous Implementation

### Accuracy Improvements

- **Geoapify**: Professional-grade geocoding with high accuracy
- **Nominatim**: Free but less accurate, now used as fallback
- **Result**: Best of both worlds - accuracy when possible, free fallback when needed

### User Experience Enhancements

- **Autocomplete**: Users get suggestions as they type
- **Faster Results**: Geoapify typically responds faster than Nominatim
- **Better Formatting**: More consistent address formatting
- **Additional Data**: City, state, postal code automatically extracted

### Developer Experience

- **Comprehensive Service**: One service class for all location needs
- **TypeScript Support**: Full type definitions for all responses
- **Error Handling**: Robust error handling with fallbacks
- **Testing**: Built-in test suite for validation

## 🚀 Next Steps

1. **Update Venue Creation Forms**: Replace address inputs with autocomplete
2. **Enhance Location Filters**: Add autocomplete to search functionality
3. **Implement Distance Search**: Use accurate distance calculations
4. **Add Venue Discovery**: Use places API to suggest nearby venues
5. **Monitor Usage**: Track API usage and optimize as needed

## 📞 Support

If you encounter any issues:

1. Check the test file: `node test_geoapify_integration.js`
2. Verify API key in browser network tab
3. Check console logs for detailed error messages
4. Ensure internet connectivity for API calls

The integration maintains backward compatibility - your existing geocoding will continue to work but now with enhanced accuracy and features!
