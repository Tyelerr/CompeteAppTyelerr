// Script to populate latitude/longitude coordinates for existing venues
// Run this in your React Native/Node.js environment

import {
  geocodeAllVenues,
  getGeocodingStats,
  fetchVenuesNeedingGeocoding,
} from '../ApiSupabase/GeocodeVenues';

// Option 1: Automatic geocoding for all venues
export const populateAllVenueCoordinates = async () => {
  console.log('🌍 Starting automatic venue geocoding...');

  try {
    // Check current status
    const initialStats = await getGeocodingStats();
    console.log(
      `📊 Initial Status: ${initialStats.venues_needing_coordinates} venues need coordinates`,
    );

    if (initialStats.venues_needing_coordinates === 0) {
      console.log('✅ All venues already have coordinates!');
      return;
    }

    // Run automatic geocoding
    const results = await geocodeAllVenues();

    console.log('📈 Geocoding Results:');
    console.log(`✅ Successfully geocoded: ${results.successful} venues`);
    console.log(`❌ Failed to geocode: ${results.failed} venues`);
    console.log(`📍 Total processed: ${results.total} venues`);

    // Show detailed results
    console.log('\n📋 Detailed Results:');
    results.results.forEach((result) => {
      if (result.success && result.coordinates) {
        console.log(
          `✅ ${result.venue}: ${result.coordinates.lat}, ${result.coordinates.lng}`,
        );
      } else {
        console.log(`❌ ${result.venue}: Could not geocode (check address)`);
      }
    });

    // Final stats
    const finalStats = await getGeocodingStats();
    console.log(
      `\n🎯 Final Status: ${finalStats.completion_percentage}% complete`,
    );

    return results;
  } catch (error) {
    console.error('❌ Error during geocoding:', error);
    throw error;
  }
};

// Option 2: Check which venues need coordinates
export const checkVenuesNeedingCoordinates = async () => {
  console.log('🔍 Checking venues that need coordinates...');

  try {
    const venues = await fetchVenuesNeedingGeocoding();

    console.log(`📊 Found ${venues.length} venues needing coordinates:`);
    venues.forEach((venue) => {
      console.log(
        `- ID: ${venue.id}, Name: ${venue.venue}, Address: ${venue.address}`,
      );
    });

    return venues;
  } catch (error) {
    console.error('❌ Error checking venues:', error);
    throw error;
  }
};

// Option 3: Get current statistics
export const showGeocodingStats = async () => {
  try {
    const stats = await getGeocodingStats();

    console.log('📊 Venue Geocoding Statistics:');
    console.log(`📍 Total venues: ${stats.total_venues}`);
    console.log(`✅ Venues with coordinates: ${stats.venues_with_coordinates}`);
    console.log(
      `❌ Venues needing coordinates: ${stats.venues_needing_coordinates}`,
    );
    console.log(`📈 Completion percentage: ${stats.completion_percentage}%`);

    return stats;
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    throw error;
  }
};

// Main function - run this to populate coordinates
export const runVenueGeocoding = async () => {
  console.log('🚀 Starting venue coordinate population...\n');

  try {
    // Step 1: Show current status
    await showGeocodingStats();
    console.log('\n');

    // Step 2: Show venues that need coordinates
    await checkVenuesNeedingCoordinates();
    console.log('\n');

    // Step 3: Populate coordinates automatically
    const results = await populateAllVenueCoordinates();

    console.log('\n🎉 Venue coordinate population complete!');
    return results;
  } catch (error) {
    console.error('💥 Failed to populate venue coordinates:', error);
    throw error;
  }
};

// Export for easy usage
export default {
  populateAllVenueCoordinates,
  checkVenuesNeedingCoordinates,
  showGeocodingStats,
  runVenueGeocoding,
};

// Usage examples:
/*
// Import and run in your app:
import venueGeocoding from './scripts/populate_venue_coordinates';

// Option A: Run everything automatically
venueGeocoding.runVenueGeocoding();

// Option B: Just populate coordinates
venueGeocoding.populateAllVenueCoordinates();

// Option C: Check status first
venueGeocoding.showGeocodingStats();
*/
