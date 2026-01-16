/**
 * Simple test script for Geoapify integration
 * Tests the API directly using fetch
 */

const GEOAPIFY_API_KEY = '565afe04bae14c469a4095cf5fd7b9af';
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1';

async function testGeoapifyAPI() {
  console.log('🧪 Testing Geoapify API Integration...\n');

  // Test 1: API Key Validation with Forward Geocoding
  console.log('1️⃣ Testing API Key & Forward Geocoding...');
  try {
    const testAddress = 'Times Square, New York, NY';
    const encodedAddress = encodeURIComponent(testAddress);
    const url = `${GEOAPIFY_BASE_URL}/geocode/search?text=${encodedAddress}&apiKey=${GEOAPIFY_API_KEY}&limit=1`;

    console.log(`   Testing: ${testAddress}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const coords = feature.geometry.coordinates;
      const props = feature.properties;

      console.log(`   ✅ API Key Valid & Geocoding Works!`);
      console.log(`   📍 Coordinates: ${coords[1]}, ${coords[0]}`);
      console.log(`   📧 Address: ${props.formatted}`);
      console.log(`   🏙️ City: ${props.city}, State: ${props.state}`);
    } else {
      console.log(`   ❌ No results found`);
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Forward Geocoding Failed: ${error.message}\n`);
  }

  // Test 2: Reverse Geocoding
  console.log('2️⃣ Testing Reverse Geocoding...');
  try {
    const lat = 40.758;
    const lon = -73.9855;
    const url = `${GEOAPIFY_BASE_URL}/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`;

    console.log(`   Testing coordinates: ${lat}, ${lon}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const props = data.features[0].properties;
      console.log(`   ✅ Reverse Geocoding Works!`);
      console.log(`   📧 Address: ${props.formatted}`);
    } else {
      console.log(`   ❌ No address found`);
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Reverse Geocoding Failed: ${error.message}\n`);
  }

  // Test 3: Autocomplete
  console.log('3️⃣ Testing Autocomplete...');
  try {
    const query = 'New York';
    const encodedQuery = encodeURIComponent(query);
    const url = `${GEOAPIFY_BASE_URL}/geocode/autocomplete?text=${encodedQuery}&apiKey=${GEOAPIFY_API_KEY}&limit=3`;

    console.log(`   Testing query: "${query}"`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      console.log(
        `   ✅ Autocomplete Works! Found ${data.features.length} suggestions:`,
      );
      data.features.forEach((feature, index) => {
        console.log(`      ${index + 1}. ${feature.properties.formatted}`);
      });
    } else {
      console.log(`   ❌ No suggestions found`);
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Autocomplete Failed: ${error.message}\n`);
  }

  console.log('🎉 Geoapify API Test Complete!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   ✅ If all tests passed, your Geoapify integration is ready!');
  console.log(
    '   ✅ Your existing venue geocoding will now use Geoapify with Nominatim fallback',
  );
  console.log(
    '   ✅ You can use the new GeoapifyAddressAutocomplete component',
  );
  console.log('   ✅ Enhanced venue creation modal is available');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('   1. Replace address inputs with GeoapifyAddressAutocomplete');
  console.log('   2. Test the enhanced venue creation modal');
  console.log('   3. Run your existing venue geocoding to see improvements');
}

// Run the test
testGeoapifyAPI().catch(console.error);
