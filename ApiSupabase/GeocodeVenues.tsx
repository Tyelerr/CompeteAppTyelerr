import { supabase } from './supabase';
import { updateVenue } from './CrudVenues';
import GeoapifyService, { GeoapifyGeocodeResult } from './GeoapifyService';

// Interface for geocoding response (updated to match Geoapify)
interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  confidence?: number;
}

// Interface for venue that needs geocoding
interface VenueToGeocode {
  id: number;
  venue: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Fetch all venues that need geocoding (missing latitude or longitude)
 */
export const fetchVenuesNeedingGeocoding = async (): Promise<
  VenueToGeocode[]
> => {
  try {
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, venue, address, latitude, longitude')
      .or('latitude.is.null,longitude.is.null');

    if (error) {
      console.error('Error fetching venues needing geocoding:', error);
      return [];
    }

    return venues || [];
  } catch (error) {
    console.error('Exception fetching venues needing geocoding:', error);
    return [];
  }
};

/**
 * Geocode an address using Geoapify API with fallback to Nominatim
 */
export const geocodeAddress = async (
  address: string,
): Promise<GeocodeResult | null> => {
  try {
    console.log(`Attempting to geocode address: ${address}`);

    // First, try Geoapify (primary service)
    const geoapifyResult = await GeoapifyService.geocodeAddress(address, {
      limit: 1,
      countryCode: 'us', // Assuming US-focused app, remove if international
    });

    if (geoapifyResult) {
      console.log(`Geoapify geocoding successful for: ${address}`);
      return {
        latitude: geoapifyResult.latitude,
        longitude: geoapifyResult.longitude,
        formatted_address: geoapifyResult.formatted_address,
        city: geoapifyResult.city,
        state: geoapifyResult.state,
        country: geoapifyResult.country,
        postcode: geoapifyResult.postcode,
        confidence: geoapifyResult.confidence,
      };
    }

    console.log(`Geoapify failed, falling back to Nominatim for: ${address}`);

    // Fallback to Nominatim (OpenStreetMap) - free but has rate limits
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CompeteApp/1.0 (venue-geocoding)', // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      console.log(`Nominatim geocoding successful for: ${address}`);
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
        confidence: 0.5, // Lower confidence for fallback service
      };
    }

    console.log(`Both geocoding services failed for: ${address}`);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', address, error);
    return null;
  }
};

/**
 * Enhanced geocode function with additional options
 */
export const geocodeAddressEnhanced = async (
  address: string,
  options?: {
    preferredService?: 'geoapify' | 'nominatim';
    countryCode?: string;
    bias?: { lat: number; lon: number };
  },
): Promise<GeocodeResult | null> => {
  const preferredService = options?.preferredService || 'geoapify';

  if (preferredService === 'geoapify') {
    return geocodeAddress(address);
  } else {
    // Use only Nominatim if specifically requested
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CompeteApp/1.0 (venue-geocoding)',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formatted_address: result.display_name,
          confidence: 0.5,
        };
      }

      return null;
    } catch (error) {
      console.error('Error with Nominatim geocoding:', error);
      return null;
    }
  }
};

/**
 * Geocode a single venue and update its coordinates
 */
export const geocodeAndUpdateVenue = async (
  venue: VenueToGeocode,
): Promise<boolean> => {
  try {
    console.log(`Geocoding venue: ${venue.venue} - ${venue.address}`);

    const geocodeResult = await geocodeAddress(venue.address);

    if (!geocodeResult) {
      console.warn(`Could not geocode venue: ${venue.venue}`);
      return false;
    }

    // Update the venue with coordinates
    const updatedVenue = await updateVenue(venue.id, {
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
    });

    if (updatedVenue) {
      console.log(
        `Successfully updated coordinates for ${venue.venue}: ${geocodeResult.latitude}, ${geocodeResult.longitude}`,
      );
      return true;
    } else {
      console.error(`Failed to update venue ${venue.venue} in database`);
      return false;
    }
  } catch (error) {
    console.error(`Error geocoding venue ${venue.venue}:`, error);
    return false;
  }
};

/**
 * Geocode all venues that need coordinates
 * Includes rate limiting to respect API limits
 */
export const geocodeAllVenues = async (): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    venue: string;
    success: boolean;
    coordinates?: { lat: number; lng: number };
  }>;
}> => {
  const venues = await fetchVenuesNeedingGeocoding();
  const results: Array<{
    venue: string;
    success: boolean;
    coordinates?: { lat: number; lng: number };
  }> = [];

  let successful = 0;
  let failed = 0;

  console.log(`Found ${venues.length} venues needing geocoding`);

  for (const venue of venues) {
    try {
      // Rate limiting: wait 1 second between requests to respect API limits
      if (results.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const success = await geocodeAndUpdateVenue(venue);

      if (success) {
        // Fetch the updated venue to get the coordinates
        const { data: updatedVenue } = await supabase
          .from('venues')
          .select('latitude, longitude')
          .eq('id', venue.id)
          .single();

        results.push({
          venue: venue.venue,
          success: true,
          coordinates: updatedVenue
            ? {
                lat: updatedVenue.latitude,
                lng: updatedVenue.longitude,
              }
            : undefined,
        });
        successful++;
      } else {
        results.push({
          venue: venue.venue,
          success: false,
        });
        failed++;
      }
    } catch (error) {
      console.error(`Error processing venue ${venue.venue}:`, error);
      results.push({
        venue: venue.venue,
        success: false,
      });
      failed++;
    }
  }

  return {
    total: venues.length,
    successful,
    failed,
    results,
  };
};

/**
 * Get geocoding statistics
 */
export const getGeocodingStats = async (): Promise<{
  total_venues: number;
  venues_with_coordinates: number;
  venues_needing_coordinates: number;
  completion_percentage: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('latitude, longitude');

    if (error) {
      throw error;
    }

    const total = data.length;
    const withCoordinates = data.filter(
      (v) => v.latitude !== null && v.longitude !== null,
    ).length;
    const needingCoordinates = total - withCoordinates;

    return {
      total_venues: total,
      venues_with_coordinates: withCoordinates,
      venues_needing_coordinates: needingCoordinates,
      completion_percentage:
        total > 0 ? Math.round((withCoordinates / total) * 100) : 0,
    };
  } catch (error) {
    console.error('Error getting geocoding stats:', error);
    return {
      total_venues: 0,
      venues_with_coordinates: 0,
      venues_needing_coordinates: 0,
      completion_percentage: 0,
    };
  }
};

// Example usage function for testing
export const testGeocoding = async () => {
  console.log('Starting venue geocoding process...');

  // Get initial stats
  const initialStats = await getGeocodingStats();
  console.log('Initial stats:', initialStats);

  // Geocode all venues
  const results = await geocodeAllVenues();
  console.log('Geocoding results:', results);

  // Get final stats
  const finalStats = await getGeocodingStats();
  console.log('Final stats:', finalStats);

  return results;
};
