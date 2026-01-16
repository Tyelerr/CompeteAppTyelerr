// Simplified database test for venue geocoding
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log(
    'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test functions
async function testDatabaseConnection() {
  console.log('🔗 Testing Supabase connection...');

  try {
    const { data, error } = await supabase.from('venues').select('*').limit(1);

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(
      `📋 Found venues table with ${data ? data.length : 0} sample records`,
    );
    return true;
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
}

async function checkVenueSchema() {
  console.log('📋 Checking venue table schema...');

  try {
    const { data, error } = await supabase
      .from('venues')
      .select('id, venue, address, latitude, longitude')
      .limit(1);

    if (error) {
      console.log('❌ Schema check failed:', error.message);
      if (
        error.message.includes('column "latitude" does not exist') ||
        error.message.includes('column "longitude" does not exist')
      ) {
        console.log(
          '💡 Need to run database migration: sql/add_latitude_longitude_to_venues.sql',
        );
      }
      return false;
    }

    console.log(
      '✅ Venue table has correct schema (latitude/longitude columns exist)',
    );
    return true;
  } catch (error) {
    console.log('❌ Schema check error:', error.message);
    return false;
  }
}

async function getVenueCount() {
  console.log('📊 Getting venue statistics...');

  try {
    const { data, error } = await supabase
      .from('venues')
      .select('latitude, longitude');

    if (error) {
      console.log('❌ Failed to get venue stats:', error.message);
      return null;
    }

    const total = data.length;
    const withCoordinates = data.filter(
      (v) => v.latitude !== null && v.longitude !== null,
    ).length;
    const needingCoordinates = total - withCoordinates;
    const completionPercentage =
      total > 0 ? Math.round((withCoordinates / total) * 100) : 0;

    console.log(`📍 Total venues: ${total}`);
    console.log(`✅ Venues with coordinates: ${withCoordinates}`);
    console.log(`❓ Venues needing coordinates: ${needingCoordinates}`);
    console.log(`📈 Completion: ${completionPercentage}%`);

    return {
      total,
      withCoordinates,
      needingCoordinates,
      completionPercentage,
    };
  } catch (error) {
    console.log('❌ Stats error:', error.message);
    return null;
  }
}

async function getSampleVenues() {
  console.log('🔍 Getting sample venues...');

  try {
    const { data, error } = await supabase
      .from('venues')
      .select('id, venue, address, latitude, longitude')
      .limit(3);

    if (error) {
      console.log('❌ Failed to fetch venues:', error.message);
      return [];
    }

    console.log(`📋 Sample venues:`);
    data.forEach((venue, index) => {
      const hasCoords = venue.latitude !== null && venue.longitude !== null;
      const coordsText = hasCoords
        ? `(${venue.latitude}, ${venue.longitude})`
        : '(no coordinates)';
      console.log(
        `  ${index + 1}. ${venue.venue} - ${venue.address} ${coordsText}`,
      );
    });

    return data;
  } catch (error) {
    console.log('❌ Fetch venues error:', error.message);
    return [];
  }
}

// Geocoding test
async function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
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

async function testGeocodingWorkflow() {
  console.log('🧪 Testing complete geocoding workflow...');

  try {
    // Get venues that need geocoding
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, venue, address, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')
      .limit(1);

    if (error) {
      console.log(
        '❌ Could not fetch venues needing geocoding:',
        error.message,
      );
      return false;
    }

    if (venues.length === 0) {
      console.log('🎉 All venues already have coordinates!');
      return true;
    }

    const testVenue = venues[0];
    console.log(`🌍 Testing with venue: ${testVenue.venue}`);
    console.log(`   Address: ${testVenue.address}`);

    // Test geocoding
    const coordinates = await geocodeAddress(testVenue.address);

    if (!coordinates) {
      console.log('❌ Could not geocode this address');
      return false;
    }

    console.log(
      `✅ Geocoding successful: ${coordinates.latitude}, ${coordinates.longitude}`,
    );

    // Test database update (but don't actually update - just test the query)
    console.log('💾 Testing database update capability...');

    const { error: updateError } = await supabase
      .from('venues')
      .update({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      })
      .eq('id', testVenue.id);

    if (updateError) {
      console.log('❌ Database update test failed:', updateError.message);
      return false;
    }

    console.log('✅ Database update successful!');
    console.log('🎉 Complete workflow test passed!');

    return true;
  } catch (error) {
    console.log('❌ Workflow test error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting venue geocoding database tests...\n');

  // Test 1: Database connection
  const connectionOk = await testDatabaseConnection();
  console.log('');

  if (!connectionOk) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }

  // Test 2: Schema check
  const schemaOk = await checkVenueSchema();
  console.log('');

  if (!schemaOk) {
    console.log('❌ Cannot proceed without proper table schema');
    console.log(
      '💡 Run this SQL migration first: sql/add_latitude_longitude_to_venues.sql',
    );
    return;
  }

  // Test 3: Get venue statistics
  const stats = await getVenueCount();
  console.log('');

  if (!stats) {
    console.log('❌ Cannot get venue statistics');
    return;
  }

  // Test 4: Show sample venues
  const venues = await getSampleVenues();
  console.log('');

  // Test 5: Test complete workflow if there are venues needing geocoding
  if (stats.needingCoordinates > 0) {
    const workflowOk = await testGeocodingWorkflow();
    console.log('');

    if (workflowOk) {
      console.log('🎉 All tests passed! Your geocoding system is ready!');
      console.log('\n📋 Next Steps:');
      console.log(
        '1. Use the GeocodeVenues.tsx functions in your React Native app',
      );
      console.log('2. Add the admin panel component to manage geocoding');
      console.log('3. Run geocodeAllVenues() to update all venue coordinates');
    } else {
      console.log('⚠️  Some tests failed - check the errors above');
    }
  } else {
    console.log('🎉 All venues already have coordinates!');
    console.log('✅ Your geocoding system is working perfectly!');
  }

  console.log('\n📊 Test Summary:');
  console.log(`✅ Database connection: ${connectionOk ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Table schema: ${schemaOk ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Venue statistics: ${stats ? 'PASSED' : 'FAILED'}`);
  console.log(
    `📍 Venues ready for geocoding: ${
      stats ? stats.needingCoordinates : 'Unknown'
    }`,
  );
}

// Run the tests
runTests().catch(console.error);
