import { GEOAPIFY_API_KEY, GEOAPIFY_BASE_URL } from '../hooks/constants';

// Interfaces for Geoapify API responses
export interface GeoapifyGeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  confidence?: number;
}

export interface GeoapifyAutocompleteResult {
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  lat?: number;
  lon?: number;
  place_id?: string;
}

export interface GeoapifyReverseGeocodeResult {
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/**
 * Geoapify Service Class
 * Provides geocoding, reverse geocoding, and autocomplete functionality
 */
export class GeoapifyService {
  private static apiKey = GEOAPIFY_API_KEY;
  private static baseUrl = GEOAPIFY_BASE_URL;

  /**
   * Forward geocoding - Convert address to coordinates
   */
  static async geocodeAddress(
    address: string,
    options?: {
      limit?: number;
      countryCode?: string;
      bias?: { lat: number; lon: number; radius?: number };
    },
  ): Promise<GeoapifyGeocodeResult | null> {
    try {
      const params = new URLSearchParams({
        text: address,
        apiKey: this.apiKey,
        limit: (options?.limit || 1).toString(),
      });

      if (options?.countryCode) {
        params.append('filter', `countrycode:${options.countryCode}`);
      }

      if (options?.bias) {
        const { lat, lon, radius = 10000 } = options.bias;
        params.append('bias', `proximity:${lon},${lat}`);
        params.append('filter', `circle:${lon},${lat},${radius}`);
      }

      const url = `${this.baseUrl}/geocode/search?${params.toString()}`;

      console.log(
        'Geoapify geocoding request:',
        url.replace(this.apiKey, 'API_KEY_HIDDEN'),
      );

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Geoapify API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const { geometry, properties } = feature;

        return {
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0],
          formatted_address:
            properties.formatted || properties.address_line1 || address,
          city: properties.city,
          state: properties.state,
          country: properties.country,
          postcode: properties.postcode,
          confidence: properties.confidence || 0,
        };
      }

      return null;
    } catch (error) {
      console.error('Error in Geoapify geocoding:', error);
      return null;
    }
  }

  /**
   * Reverse geocoding - Convert coordinates to address
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<GeoapifyReverseGeocodeResult | null> {
    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        apiKey: this.apiKey,
      });

      const url = `${this.baseUrl}/geocode/reverse?${params.toString()}`;

      console.log(
        'Geoapify reverse geocoding request:',
        url.replace(this.apiKey, 'API_KEY_HIDDEN'),
      );

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geoapify reverse geocoding error: ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const properties = data.features[0].properties;

        return {
          formatted:
            properties.formatted ||
            properties.address_line1 ||
            'Unknown location',
          address_line1: properties.address_line1,
          address_line2: properties.address_line2,
          city: properties.city,
          state: properties.state,
          postcode: properties.postcode,
          country: properties.country,
        };
      }

      return null;
    } catch (error) {
      console.error('Error in Geoapify reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Address autocomplete - Get suggestions as user types
   */
  static async autocomplete(
    text: string,
    options?: {
      limit?: number;
      countryCode?: string;
      bias?: { lat: number; lon: number };
      type?:
        | 'amenity'
        | 'building'
        | 'street'
        | 'postcode'
        | 'city'
        | 'state'
        | 'country';
    },
  ): Promise<GeoapifyAutocompleteResult[]> {
    try {
      if (!text || text.trim().length < 2) {
        return [];
      }

      const params = new URLSearchParams({
        text: text.trim(),
        apiKey: this.apiKey,
        limit: (options?.limit || 5).toString(),
      });

      if (options?.countryCode) {
        params.append('filter', `countrycode:${options.countryCode}`);
      }

      if (options?.bias) {
        const { lat, lon } = options.bias;
        params.append('bias', `proximity:${lon},${lat}`);
      }

      if (options?.type) {
        params.append('type', options.type);
      }

      const url = `${this.baseUrl}/geocode/autocomplete?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geoapify autocomplete error: ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features.map((feature: any) => ({
          formatted:
            feature.properties.formatted || feature.properties.address_line1,
          address_line1: feature.properties.address_line1,
          address_line2: feature.properties.address_line2,
          city: feature.properties.city,
          state: feature.properties.state,
          postcode: feature.properties.postcode,
          country: feature.properties.country,
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
          place_id: feature.properties.place_id,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error in Geoapify autocomplete:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points using Geoapify routing API
   */
  static async calculateDistance(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number },
    mode: 'drive' | 'walk' | 'bicycle' = 'drive',
  ): Promise<{ distance: number; duration: number } | null> {
    try {
      const params = new URLSearchParams({
        waypoints: `${from.lon},${from.lat}|${to.lon},${to.lat}`,
        mode: mode,
        apiKey: this.apiKey,
      });

      const url = `${this.baseUrl}/routing?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geoapify routing error: ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const properties = data.features[0].properties;
        return {
          distance: properties.distance || 0, // in meters
          duration: properties.time || 0, // in seconds
        };
      }

      return null;
    } catch (error) {
      console.error('Error calculating distance with Geoapify:', error);
      return null;
    }
  }

  /**
   * Get places within radius (for venue discovery)
   */
  static async getPlacesInRadius(
    center: { lat: number; lon: number },
    radius: number, // in meters
    categories?: string[], // e.g., ['entertainment.activity', 'sport']
    limit: number = 20,
  ): Promise<GeoapifyAutocompleteResult[]> {
    try {
      const params = new URLSearchParams({
        filter: `circle:${center.lon},${center.lat},${radius}`,
        limit: limit.toString(),
        apiKey: this.apiKey,
      });

      if (categories && categories.length > 0) {
        params.append('categories', categories.join(','));
      }

      const url = `${this.baseUrl}/places?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geoapify places error: ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features.map((feature: any) => ({
          formatted: feature.properties.name || feature.properties.formatted,
          address_line1: feature.properties.address_line1,
          address_line2: feature.properties.address_line2,
          city: feature.properties.city,
          state: feature.properties.state,
          postcode: feature.properties.postcode,
          country: feature.properties.country,
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
          place_id: feature.properties.place_id,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting places in radius:', error);
      return [];
    }
  }

  /**
   * Validate API key
   */
  static async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.geocodeAddress('New York, NY', { limit: 1 });
      return response !== null;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
}

// Utility functions for common use cases
export const geoapifyUtils = {
  /**
   * Format address for display
   */
  formatAddress: (
    result: GeoapifyGeocodeResult | GeoapifyReverseGeocodeResult,
  ): string => {
    if ('formatted_address' in result) {
      return result.formatted_address;
    }
    return result.formatted;
  },

  /**
   * Extract city and state from geocoding result
   */
  extractCityState: (
    result: GeoapifyGeocodeResult,
  ): { city?: string; state?: string } => {
    return {
      city: result.city,
      state: result.state,
    };
  },

  /**
   * Calculate straight-line distance between two points (Haversine formula)
   */
  calculateStraightLineDistance: (
    point1: { lat: number; lon: number },
    point2: { lat: number; lon: number },
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLon = ((point2.lon - point1.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  },

  /**
   * Convert kilometers to miles
   */
  kmToMiles: (km: number): number => km * 0.621371,

  /**
   * Convert miles to kilometers
   */
  milesToKm: (miles: number): number => miles / 0.621371,
};

export default GeoapifyService;
