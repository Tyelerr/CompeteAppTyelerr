// Complete venue geocoding script for your Supabase database
// This will update your actual venues with latitude and longitude coordinates

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error(
    'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Geocoding function using OpenStreetMap
async function geocodeAddress(address) {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CompeteApp/1.0 (venue-geocoding)',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', address, error.message);
    return null;
  }
}

// Fetch venues that need geocoding
async function fetchVenuesNeedingGeocoding() {
  try {
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, venue, address, latitude, longitude')
      .or('latitude.is.null,longitude.is.null');

    if (error) {
      console.error('Error fetching venues:', error);
      return [];
    }

    return venues || [];
  } catch (error) {
    console.error('Exception fetching venues:', error);
    return [];
  }
}

// Update venue with coordinates
async function updateVenueCoordinates(venueId, latitude, longitude) {
  try {
    const { data, error } = await supabase
      .from('venues')
      .update({ latitude, longitude })
      .eq('id', venueId)
      .select();

    if (error) {
      console.error('Error updating venue:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating venue:', error);
    return false;
  }
}

// Get geocoding statistics
async function getGeocodingStats() {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('latitude, longitude');

    if (error) {
      throw error;
    }

    const total = data.length;
    const withCoordinates = data.filter(
      (v) => v.latitude !== null && v.longitude !== null,
    ).length;
    const needingCoordinates = total - withCoordinates;

    return {
      total_venues: total,
      venues_with_coordinates: withCoordinates,
      venues_needing_coordinates: needingCoordinates,
      completion_percentage:
        total > 0 ? Math.round((withCoordinates / total) * 100) : 0,
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      total_venues: 0,
      venues_with_coordinates: 0,
      venues_needing_coordinates: 0,
      completion_percentage: 0,
    };
  }
}

// Main geocoding process
async function runVenueGeocoding() {
  console.log('🚀 Starting venue coordinate update process...\n');

  try {
    // Step 1: Check current status
    console.log('📊 Checking current venue status...');
    const initialStats = await getGeocodingStats();
    console.log(`📍 Total venues: ${initialStats.total_venues}`);
    console.log(
      `✅ Venues with coordinates: ${initialStats.venues_with_coordinates}`,
    );
    console.log(
      `❓ Venues needing coordinates: ${initialStats.venues_needing_coordinates}`,
    );
    console.log(`📈 Completion: ${initialStats.completion_percentage}%\n`);

    if (initialStats.venues_needing_coordinates === 0) {
      console.log('🎉 All venues already have coordinates!');
      return;
    }

    // Step 2: Fetch venues needing geocoding
    console.log('🔍 Fetching venues that need coordinates...');
    const venues = await fetchVenuesNeedingGeocoding();
    console.log(`Found ${venues.length} venues to process\n`);

    if (venues.length === 0) {
      console.log('✅ No venues need geocoding');
      return;
    }

    // Step 3: Process each venue
    console.log('🌍 Starting geocoding process...');
    console.log(
      '⏱️  Rate limited to 1 request per second (respectful API usage)\n',
    );

    let successful = 0;
    let failed = 0;
    const results = [];

    for (let i = 0; i < venues.length; i++) {
      const venue = venues[i];

      console.log(`[${i + 1}/${venues.length}] Processing: ${venue.venue}`);
      console.log(`   Address: ${venue.address}`);

      // Rate limiting: wait 1 second between requests
      if (i > 0) {
        console.log('   ⏳ Waiting 1 second (rate limiting)...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      try {
        // Geocode the address
        const geocodeResult = await geocodeAddress(venue.address);

        if (geocodeResult) {
          // Update database
          const updateSuccess = await updateVenueCoordinates(
            venue.id,
            geocodeResult.latitude,
            geocodeResult.longitude,
          );

          if (updateSuccess) {
            console.log(
              `   ✅ Success: ${geocodeResult.latitude}, ${geocodeResult.longitude}`,
            );
            successful++;
            results.push({
              venue: venue.venue,
              success: true,
              coordinates: {
                lat: geocodeResult.latitude,
                lng: geocodeResult.longitude,
              },
            });
          } else {
            console.log(`   ❌ Failed to update database`);
            failed++;
            results.push({
              venue: venue.venue,
              success: false,
              error: 'Database update failed',
            });
          }
        } else {
          console.log(`   ❌ Could not geocode address`);
          failed++;
          results.push({
            venue: venue.venue,
            success: false,
            error: 'Geocoding failed',
          });
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failed++;
        results.push({
          venue: venue.venue,
          success: false,
          error: error.message,
        });
      }

      console.log(''); // Empty line for readability
    }

    // Step 4: Final results
    console.log('🎯 Geocoding Process Complete!\n');
    console.log('📊 Final Results:');
    console.log(`✅ Successfully geocoded: ${successful} venues`);
    console.log(`❌ Failed to geocode: ${failed} venues`);
    console.log(`📍 Total processed: ${venues.length} venues\n`);

    // Step 5: Updated statistics
    const finalStats = await getGeocodingStats();
    console.log('📈 Updated Statistics:');
    console.log(`📍 Total venues: ${finalStats.total_venues}`);
    console.log(
      `✅ Venues with coordinates: ${finalStats.venues_with_coordinates}`,
    );
    console.log(
      `❓ Venues still needing coordinates: ${finalStats.venues_needing_coordinates}`,
    );
    console.log(`🎯 Completion: ${finalStats.completion_percentage}%\n`);

    // Step 6: Show detailed results
    if (results.length > 0) {
      console.log('📋 Detailed Results:');
      results.forEach((result, index) => {
        if (result.success && result.coordinates) {
          console.log(
            `${index + 1}. ✅ ${result.venue}: ${result.coordinates.lat}, ${
              result.coordinates.lng
            }`,
          );
        } else {
          console.log(
            `${index + 1}. ❌ ${result.venue}: ${
              result.error || 'Unknown error'
            }`,
          );
        }
      });
      console.log('');
    }

    console.log(
      '🎉 Your venues have been updated with latitude and longitude coordinates!',
    );
    console.log('🌍 Location-based features are now ready to use!');
  } catch (error) {
    console.error('💥 Fatal error during geocoding:', error);
    console.error('Please check your Supabase connection and try again.');
  }
}

// Run the geocoding process
runVenueGeocoding().catch(console.error);
