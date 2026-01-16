// Test script to verify geocoding works with your actual Supabase database
// This will test the full workflow with your real venue data

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

// Geocoding function
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

// Test functions
async function testDatabaseConnection() {
  console.log('🔗 Testing Supabase connection...');

  try {
    const { data, error } = await supabase
      .from('venues')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
}

async function testVenueTableSchema() {
  console.log('📋 Testing venue table schema...');

  try {
    const { data, error } = await supabase
      .from('venues')
      .select('id, venue, address, latitude, longitude')
      .limit(1);

    if (error) {
      console.log('❌ Schema test failed:', error.message);
      if (error.message.includes('column "latitude" does not exist')) {
        console.log(
          '💡 Run the database migration: sql/add_latitude_longitude_to_venues.sql',
        );
      }
      return false;
    }

    console.log(
      '✅ Venue table schema is correct (has latitude/longitude columns)',
    );
    return true;
  } catch (error) {
    console.log('❌ Schema test error:', error.message);
    return false;
  }
}

async function getVenueStats() {
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

    const stats = {
      total_venues: total,
      venues_with_coordinates: withCoordinates,
      venues_needing_coordinates: needingCoordinates,
      completion_percentage: completionPercentage,
    };

    console.log(`📍 Total venues: ${stats.total_venues}`);
    console.log(`✅ Venues with coordinates: ${stats.venues_with_coordinates}`);
    console.log(
      `❓ Venues needing coordinates: ${stats.venues_needing_coordinates}`,
    );
    console.log(`📈 Completion: ${stats.completion_percentage}%`);

    return stats;
  } catch (error) {
    console.log('❌ Stats error:', error.message);
    return null;
  }
}

async function getVenuesNeedingGeocoding(limit = 5) {
  console.log(`🔍 Getting venues that need geocoding (limit ${limit})...`);

  try {
    const { data, error } = await supabase
      .from('venues')
      .select('id, venue, address, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')
      .limit(limit);

    if (error) {
      console.log('❌ Failed to fetch venues:', error.message);
      return [];
    }

    console.log(`📋 Found ${data.length} venues needing geocoding:`);
    data.forEach((venue, index) => {
      console.log(`  ${index + 1}. ${venue.venue} - ${venue.address}`);
    });

    return data;
  } catch (error) {
    console.log('❌ Fetch venues error:', error.message);
    return [];
  }
}

async function testGeocodingOneVenue(venue) {
  console.log(`🌍 Testing geocoding for: ${venue.venue}`);
  console.log(`   Address: ${venue.address}`);

  try {
    const result = await geocodeAddress(venue.address);

    if (result) {
      console.log(`✅ Geocoding successful:`);
      console.log(`   Coordinates: ${result.latitude}, ${result.longitude}`);
      console.log(`   Formatted: ${result.formatted_address}`);
      return result;
    } else {
      console.log(`❌ Could not geocode address`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Geocoding error: ${error.message}`);
    return null;
  }
}

async function testDatabaseUpdate(venue, coordinates) {
  console.log(`💾 Testing database update for: ${venue.venue}`);

  try {
    const { data, error } = await supabase
      .from('venues')
      .update({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      })
      .eq('id', venue.id)
      .select();

    if (error) {
      console.log(`❌ Database update failed: ${error.message}`);
      return false;
    }

    console.log(`✅ Database update successful`);
    return true;
  } catch (error) {
    console.log(`❌ Database update error: ${error.message}`);
    return false;
  }
}

// Main test function
async function runDatabaseTests() {
  console.log('🚀 Starting database geocoding tests...\n');

  // Test 1: Database connection
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed without database connection');
    return;
  }

  console.log('');

  // Test 2: Table schema
  const schemaOk = await testVenueTableSchema();
  if (!schemaOk) {
    console.log('\n❌ Cannot proceed without proper table schema');
    return;
  }

  console.log('');

  // Test 3: Get venue statistics
  const stats = await getVenueStats();
  if (!stats) {
    console.log('\n❌ Cannot get venue statistics');
    return;
  }

  console.log('');

  // Test 4: Get venues needing geocoding
  const venues = await getVenuesNeedingGeocoding(3);
  if (venues.length === 0) {
    console.log('🎉 All venues already have coordinates!');
    return;
  }

  console.log('');

  // Test 5: Test geocoding and database update for first venue
  if (venues.length > 0) {
    const testVenue = venues[0];
    console.log(`🧪 Testing full workflow with: ${testVenue.venue}`);

    // Geocode the venue
    const coordinates = await testGeocodingOneVenue(testVenue);

    if (coordinates) {
      console.log('');

      // Test database update
      const updateSuccess = await testDatabaseUpdate(testVenue, coordinates);

      if (updateSuccess) {
        console.log('\n🎉 Full workflow test successful!');
        console.log('✅ Your geocoding system is ready to update all venues');
      } else {
        console.log('\n❌ Database update failed - check permissions');
      }
    } else {
      console.log(
        '\n⚠️  Geocoding failed for test venue - may need address cleanup',
      );
    }
  }

  console.log('\n📋 Test Summary:');
  console.log(`✅ Database connection: ${connectionOk ? 'OK' : 'FAILED'}`);
  console.log(`✅ Table schema: ${schemaOk ? 'OK' : 'FAILED'}`);
  console.log(`✅ Venue statistics: ${stats ? 'OK' : 'FAILED'}`);
  console.log(`✅ Venues found: ${venues.length > 0 ? 'OK' : 'ALL GEOCODED'}`);

  if (venues.length > 0) {
    console.log('\n🚀 Ready to geocode your venues!');
    console.log('Run the geocoding process using:');
    console.log('1. The React Native admin panel component');
    console.log('2. The GeocodeVenues.tsx functions directly');
    console.log('3. The provided scripts and guides');
  }
}

// Run the tests
runDatabaseTests().catch(console.error);
