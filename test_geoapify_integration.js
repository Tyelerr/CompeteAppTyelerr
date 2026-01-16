/**
 * Test script for Geoapify integration
 * Run this to verify that the Geoapify API is working correctly
 */

const { GeoapifyService } = require('./ApiSupabase/GeoapifyService');

async function testGeoapifyIntegration() {
  console.log('🧪 Testing Geoapify Integration...\n');

  // Test 1: API Key Validation
  console.log('1️⃣ Testing API Key Validation...');
  try {
    const isValid = await GeoapifyService.validateApiKey();
    console.log(`✅ API Key Valid: ${isValid}\n`);
  } catch (error) {
    console.log(`❌ API Key Validation Failed: ${error.message}\n`);
  }

  // Test 2: Forward Geocoding
  console.log('2️⃣ Testing Forward Geocoding...');
  try {
    const testAddresses = [
      '1600 Amphitheatre Parkway, Mountain View, CA',
      'Times Square, New York, NY',
      '123 Main Street, Chicago, IL',
    ];

    for (const address of testAddresses) {
      console.log(`   Testing: ${address}`);
      const result = await GeoapifyService.geocodeAddress(address);
      if (result) {
        console.log(
          `   ✅ Result: ${result.latitude}, ${result.longitude} - ${result.formatted_address}`,
        );
      } else {
        console.log(`   ❌ No result found`);
      }
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Forward Geocoding Failed: ${error.message}\n`);
  }

  // Test 3: Reverse Geocoding
  console.log('3️⃣ Testing Reverse Geocoding...');
  try {
    const testCoordinates = [
      { lat: 37.4224764, lon: -122.0842499 }, // Google HQ
      { lat: 40.758, lon: -73.9855 }, // Times Square
    ];

    for (const coord of testCoordinates) {
      console.log(`   Testing: ${coord.lat}, ${coord.lon}`);
      const result = await GeoapifyService.reverseGeocode(coord.lat, coord.lon);
      if (result) {
        console.log(`   ✅ Result: ${result.formatted}`);
      } else {
        console.log(`   ❌ No result found`);
      }
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Reverse Geocoding Failed: ${error.message}\n`);
  }

  // Test 4: Autocomplete
  console.log('4️⃣ Testing Autocomplete...');
  try {
    const testQueries = ['New York', 'Los Angeles', 'Chicago'];

    for (const query of testQueries) {
      console.log(`   Testing: "${query}"`);
      const results = await GeoapifyService.autocomplete(query, { limit: 3 });
      if (results.length > 0) {
        console.log(`   ✅ Found ${results.length} suggestions:`);
        results.forEach((result, index) => {
          console.log(`      ${index + 1}. ${result.formatted}`);
        });
      } else {
        console.log(`   ❌ No suggestions found`);
      }
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Autocomplete Failed: ${error.message}\n`);
  }

  // Test 5: Distance Calculation
  console.log('5️⃣ Testing Distance Calculation...');
  try {
    const from = { lat: 37.4224764, lon: -122.0842499 }; // Google HQ
    const to = { lat: 37.7749, lon: -122.4194 }; // San Francisco

    console.log(`   From: ${from.lat}, ${from.lon}`);
    console.log(`   To: ${to.lat}, ${to.lon}`);

    const result = await GeoapifyService.calculateDistance(from, to, 'drive');
    if (result) {
      const distanceKm = (result.distance / 1000).toFixed(2);
      const durationMin = (result.duration / 60).toFixed(0);
      console.log(
        `   ✅ Distance: ${distanceKm} km, Duration: ${durationMin} minutes`,
      );
    } else {
      console.log(`   ❌ No route found`);
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Distance Calculation Failed: ${error.message}\n`);
  }

  console.log('🎉 Geoapify Integration Test Complete!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testGeoapifyIntegration().catch(console.error);
}

module.exports = { testGeoapifyIntegration };
