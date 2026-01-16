// Simple geocoding script that works with Node.js
const https = require('https');

// Mock Supabase client for demonstration
// In a real scenario, you would need to set up your Supabase connection
console.log('🚀 Starting venue coordinate population...\n');

// Function to simulate geocoding
async function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    // Using OpenStreetMap Nominatim API (free)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address,
    )}&limit=1`;

    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'CompeteApp/1.0 (venue-geocoding)',
          },
        },
        (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const results = JSON.parse(data);
              if (results && results.length > 0) {
                const result = results[0];
                resolve({
                  latitude: parseFloat(result.lat),
                  longitude: parseFloat(result.lon),
                  formatted_address: result.display_name,
                });
              } else {
                resolve(null);
              }
            } catch (error) {
              reject(error);
            }
          });
        },
      )
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Test function
async function testGeocoding() {
  console.log('📍 Testing geocoding functionality...\n');

  // Test addresses
  const testAddresses = [
    '1600 Amphitheatre Parkway, Mountain View, CA',
    'Times Square, New York, NY',
    'Golden Gate Bridge, San Francisco, CA',
  ];

  for (let i = 0; i < testAddresses.length; i++) {
    const address = testAddresses[i];
    console.log(`Testing address ${i + 1}: ${address}`);

    try {
      const result = await geocodeAddress(address);
      if (result) {
        console.log(`✅ Success: ${result.latitude}, ${result.longitude}`);
        console.log(`   Address: ${result.formatted_address}\n`);
      } else {
        console.log(`❌ Could not geocode address\n`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }

    // Rate limiting - wait 1 second between requests
    if (i < testAddresses.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log('🎉 Geocoding test complete!\n');
  console.log('📋 Next Steps:');
  console.log(
    '1. Set up your Supabase connection in the GeocodeVenues.tsx file',
  );
  console.log('2. Run the full geocoding process using your React Native app');
  console.log('3. Or integrate the geocoding functions into your admin panel');
  console.log(
    '\n💡 The geocoding system is ready to update your venue coordinates!',
  );
}

// Run the test
testGeocoding().catch(console.error);
