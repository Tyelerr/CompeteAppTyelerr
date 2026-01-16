import { supabase } from './supabase';
import GeoapifyService from './GeoapifyService';

export interface LocationOrigin {
  latitude: number;
  longitude: number;
  source: 'zip_db' | 'venue_db' | 'geoapify' | 'user_coords' | 'device_coords';
  cached?: boolean;
}

export interface LocationFilters {
  zip_code?: string;
  radius?: number;
  lat?: string | number;
  lng?: string | number;
  userCoordinates?: { latitude: number; longitude: number };
  deviceCoordinates?: { latitude: number; longitude: number };
}

/**
 * Comprehensive location origin resolver that follows the priority:
 * 1. ZIP code → Database lookup → Geoapify fallback
 * 2. User/device coordinates as fallback
 * 3. Caches ZIP geocodes for performance
 */
export class LocationOriginResolver {
  private static zipCodeCache = new Map<string, LocationOrigin>();

  /**
   * Resolves an origin point for radius filtering
   * Priority: ZIP → DB → Geoapify → User coords → Device coords
   */
  static async resolveOrigin(
    filters: LocationFilters,
  ): Promise<LocationOrigin | null> {
    console.log(
      '[LocationOriginResolver] Resolving origin with filters:',
      filters,
    );

    // Priority 1: ZIP code resolution
    if (filters.zip_code && filters.zip_code.trim() !== '') {
      const zipOrigin = await this.resolveZipCodeOrigin(
        filters.zip_code.trim(),
      );
      if (zipOrigin) {
        console.log(
          `[LocationOriginResolver] Resolved ZIP ${filters.zip_code} to origin:`,
          zipOrigin,
        );
        return zipOrigin;
      }
    }

    // Priority 2: Direct lat/lng coordinates (legacy support)
    if (filters.lat && filters.lng) {
      const lat =
        typeof filters.lat === 'string' ? parseFloat(filters.lat) : filters.lat;
      const lng =
        typeof filters.lng === 'string' ? parseFloat(filters.lng) : filters.lng;

      if (!isNaN(lat) && !isNaN(lng)) {
        console.log(
          '[LocationOriginResolver] Using provided lat/lng coordinates',
        );
        return {
          latitude: lat,
          longitude: lng,
          source: 'user_coords',
        };
      }
    }

    // Priority 3: User coordinates
    if (filters.userCoordinates) {
      console.log('[LocationOriginResolver] Using user coordinates');
      return {
        latitude: filters.userCoordinates.latitude,
        longitude: filters.userCoordinates.longitude,
        source: 'user_coords',
      };
    }

    // Priority 4: Device coordinates
    if (filters.deviceCoordinates) {
      console.log('[LocationOriginResolver] Using device coordinates');
      return {
        latitude: filters.deviceCoordinates.latitude,
        longitude: filters.deviceCoordinates.longitude,
        source: 'device_coords',
      };
    }

    console.log('[LocationOriginResolver] No origin could be resolved');
    return null;
  }

  /**
   * Resolves ZIP code to coordinates with caching
   * Priority: Cache → zip_codes table → venues table → Geoapify
   */
  private static async resolveZipCodeOrigin(
    zipCode: string,
  ): Promise<LocationOrigin | null> {
    // Check cache first
    if (this.zipCodeCache.has(zipCode)) {
      const cached = this.zipCodeCache.get(zipCode)!;
      console.log(
        `[LocationOriginResolver] Found cached coordinates for ZIP ${zipCode}`,
      );
      return { ...cached, cached: true };
    }

    try {
      // Step 1: Check zip_codes table
      const { data: zipData, error: zipError } = await supabase
        .from('zip_codes')
        .select('latitude, longitude')
        .eq('zip_code', zipCode)
        .limit(1);

      if (!zipError && zipData && zipData.length > 0) {
        const origin: LocationOrigin = {
          latitude: zipData[0].latitude,
          longitude: zipData[0].longitude,
          source: 'zip_db',
        };
        this.zipCodeCache.set(zipCode, origin);
        console.log(
          `[LocationOriginResolver] Found ZIP ${zipCode} in zip_codes table`,
        );
        return origin;
      }

      // Step 2: Check venues table
      console.log(
        `[LocationOriginResolver] ZIP ${zipCode} not in zip_codes table, checking venues...`,
      );
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('latitude, longitude')
        .eq('zip_code', zipCode)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(1);

      if (!venueError && venueData && venueData.length > 0) {
        const origin: LocationOrigin = {
          latitude: venueData[0].latitude,
          longitude: venueData[0].longitude,
          source: 'venue_db',
        };
        this.zipCodeCache.set(zipCode, origin);
        console.log(
          `[LocationOriginResolver] Found ZIP ${zipCode} in venues table`,
        );
        return origin;
      }

      // Step 3: Geoapify fallback
      console.log(
        `[LocationOriginResolver] ZIP ${zipCode} not in database, trying Geoapify...`,
      );
      const geoapifyResult = await GeoapifyService.geocodeAddress(zipCode, {
        limit: 1,
        countryCode: 'us',
      });

      if (geoapifyResult) {
        const origin: LocationOrigin = {
          latitude: geoapifyResult.latitude,
          longitude: geoapifyResult.longitude,
          source: 'geoapify',
        };

        // Cache the result
        this.zipCodeCache.set(zipCode, origin);

        // Optionally save to database for future use
        try {
          await supabase.from('zip_codes').upsert({
            zip_code: zipCode,
            latitude: geoapifyResult.latitude,
            longitude: geoapifyResult.longitude,
            city: geoapifyResult.city,
            state: geoapifyResult.state,
            country: geoapifyResult.country,
          });
          console.log(
            `[LocationOriginResolver] Saved Geoapify result for ZIP ${zipCode} to database`,
          );
        } catch (saveError) {
          console.warn(
            `[LocationOriginResolver] Failed to save ZIP ${zipCode} to database:`,
            saveError,
          );
        }

        console.log(
          `[LocationOriginResolver] Geoapify resolved ZIP ${zipCode}`,
        );
        return origin;
      }

      console.log(
        `[LocationOriginResolver] Could not resolve ZIP ${zipCode} via any method`,
      );
      return null;
    } catch (error) {
      console.error(
        `[LocationOriginResolver] Error resolving ZIP ${zipCode}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Applies radius filter to a query using resolved origin
   */
  static applyRadiusFilter(
    query: any,
    origin: LocationOrigin,
    radius: number,
    locationField: string = 'point_location',
  ) {
    const radiusInMeters = radius * 1609.34; // Convert miles to meters
    console.log(
      `[LocationOriginResolver] Applying radius filter: ${radius} miles (${radiusInMeters}m) from ${origin.latitude}, ${origin.longitude}`,
    );

    // Handle 0 radius case - use a very small radius instead of 0
    const effectiveRadius = radius === 0 ? 0.001 : radiusInMeters; // 0.001 meters ≈ 0.000621 miles

    return query.filter(
      locationField,
      'dwithin',
      `POINT(${origin.longitude} ${origin.latitude}), ${effectiveRadius}`,
    );
  }

  /**
   * Client-side distance calculation for immediate verification
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Client-side radius filtering for immediate results
   */
  static filterByRadius<
    T extends {
      latitude?: number;
      longitude?: number;
      venue_lat?: string;
      venue_lng?: string;
    },
  >(items: T[], origin: LocationOrigin, radius: number): T[] {
    return items.filter((item) => {
      let lat: number | undefined;
      let lng: number | undefined;

      // Handle different coordinate field formats
      if (item.latitude !== undefined && item.longitude !== undefined) {
        lat = item.latitude;
        lng = item.longitude;
      } else if (item.venue_lat && item.venue_lng) {
        lat = parseFloat(item.venue_lat);
        lng = parseFloat(item.venue_lng);
      }

      if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
        return false;
      }

      const distance = this.calculateDistance(
        origin.latitude,
        origin.longitude,
        lat,
        lng,
      );
      return distance <= radius;
    });
  }

  /**
   * Clear the ZIP code cache (useful for testing or memory management)
   */
  static clearCache(): void {
    this.zipCodeCache.clear();
    console.log('[LocationOriginResolver] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.zipCodeCache.size,
      entries: Array.from(this.zipCodeCache.keys()),
    };
  }
}
