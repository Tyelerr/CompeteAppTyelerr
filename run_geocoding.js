// Simple Node.js script to run geocoding
// This will work with your React Native/TypeScript setup

import {
  testGeocoding,
  getGeocodingStats,
  geocodeAllVenues,
} from './ApiSupabase/GeocodeVenues.tsx';

async function runGeocodingProcess() {
  console.log('🚀 Starting venue coordinate population...\n');

  try {
    // Step 1: Check current status
    console.log('📊 Checking current venue status...');
    const initialStats = await getGeocodingStats();
    console.log(`Total venues: ${initialStats.total_venues}`);
    console.log(
      `Venues with coordinates: ${initialStats.venues_with_coordinates}`,
    );
    console.log(
      `Venues needing coordinates: ${initialStats.venues_needing_coordinates}`,
    );
    console.log(`Completion: ${initialStats.completion_percentage}%\n`);

    if (initialStats.venues_needing_coordinates === 0) {
      console.log('✅ All venues already have coordinates!');
      return;
    }

    // Step 2: Run automatic geocoding
    console.log('🌍 Starting automatic geocoding...');
    console.log(
      'This may take a few minutes depending on the number of venues...\n',
    );

    const results = await geocodeAllVenues();

    console.log('📈 Geocoding Results:');
    console.log(`✅ Successfully geocoded: ${results.successful} venues`);
    console.log(`❌ Failed to geocode: ${results.failed} venues`);
    console.log(`📍 Total processed: ${results.total} venues\n`);

    // Step 3: Show detailed results
    console.log('📋 Detailed Results:');
    results.results.forEach((result, index) => {
      if (result.success && result.coordinates) {
        console.log(
          `${index + 1}. ✅ ${result.venue}: ${result.coordinates.lat}, ${
            result.coordinates.lng
          }`,
        );
      } else {
        console.log(
          `${index + 1}. ❌ ${result.venue}: Could not geocode (check address)`,
        );
      }
    });

    // Step 4: Final status
    const finalStats = await getGeocodingStats();
    console.log(
      `\n🎯 Final Status: ${finalStats.completion_percentage}% complete`,
    );
    console.log(
      `📍 ${finalStats.venues_with_coordinates} of ${finalStats.total_venues} venues now have coordinates\n`,
    );

    console.log('🎉 Venue coordinate population complete!');
    console.log(
      'Your venues table has been updated with latitude and longitude coordinates.',
    );
  } catch (error) {
    console.error('💥 Error during geocoding:', error);
    console.error(
      'Make sure your Supabase connection is working and the venues table exists.',
    );
  }
}

// Run the geocoding process
runGeocodingProcess();
