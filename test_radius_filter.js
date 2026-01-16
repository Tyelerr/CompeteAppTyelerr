// Test script to verify radius filter functionality with Geoapify integration
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
const GEOAPIFY_API_KEY = '565afe04bae14c469a4095cf5fd7b9af';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test function to simulate the enhanced radius filtering
async function testRadiusFilter() {
  console.log('🧪 Testing Radius Filter with Geoapify Integration');
  console.log('================================================');

  // Test zip codes to try
  const testZipCodes = ['10001', '90210', '60601', '33101', '02101'];

  for (const zipCode of testZipCodes) {
    console.log(`\n📍 Testing zip code: ${zipCode}`);

    try {
      // Step 1: Check if coordinates exist in zip_codes table
      const { data: zipData, error: zipError } = await supabase
        .from('zip_codes')
        .select('latitude, longitude')
        .eq('zip_code', zipCode)
        .limit(1);

      if (!zipError && zipData && zipData.length > 0) {
        console.log(
          `✅ Found in zip_codes table: lat=${zipData[0].latitude}, lng=${zipData[0].longitude}`,
        );
        continue;
      }

      // Step 2: Check venues table
      console.log('🔍 Not found in zip_codes table, checking venues...');
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('latitude, longitude')
        .eq('zip_code', zipCode)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(1);

      if (!venueError && venueData && venueData.length > 0) {
        console.log(
          `✅ Found in venues table: lat=${venueData[0].latitude}, lng=${venueData[0].longitude}`,
        );
        continue;
      }

      // Step 3: Test Geoapify API
      console.log('🌐 Not found in database, testing Geoapify API...');
      const geoapifyUrl = `https://api.geoapify.com/v1/geocode/search?text=${zipCode}&apiKey=${GEOAPIFY_API_KEY}&limit=1&filter=countrycode:us`;

      const response = await fetch(geoapifyUrl);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const lat = feature.geometry.coordinates[1];
        const lng = feature.geometry.coordinates[0];
        console.log(`✅ Geoapify geocoding successful: lat=${lat}, lng=${lng}`);
        console.log(`📝 Address: ${feature.properties.formatted}`);
      } else {
        console.log(`❌ Geoapify could not geocode zip code: ${zipCode}`);
      }
    } catch (error) {
      console.log(`❌ Error testing zip code ${zipCode}:`, error.message);
    }
  }

  console.log('\n🎯 Testing radius filtering logic...');

  // Test PostGIS distance calculation
  const testLat = 40.7128; // New York City
  const testLng = -74.006;
  const testRadius = 25; // miles

  try {
    const { data: nearbyVenues, error: venueError } = await supabase
      .from('venues')
      .select('name, city, state, latitude, longitude')
      .filter(
        'point_location',
        'dwithin',
        `POINT(${testLng} ${testLat}), ${testRadius * 1609.34}`, // Convert miles to meters
      )
      .limit(5);

    if (!venueError && nearbyVenues) {
      console.log(
        `✅ Found ${nearbyVenues.length} venues within ${testRadius} miles of NYC:`,
      );
      nearbyVenues.forEach((venue, index) => {
        console.log(
          `   ${index + 1}. ${venue.name} - ${venue.city}, ${venue.state}`,
        );
      });
    } else {
      console.log('❌ Error testing radius filtering:', venueError);
    }
  } catch (error) {
    console.log('❌ Error in PostGIS distance calculation:', error.message);
  }

  console.log('\n✨ Radius filter test completed!');
}

// Run the test
if (require.main === module) {
  testRadiusFilter().catch(console.error);
}

module.exports = { testRadiusFilter };
