// Quick script to update Metro Sportz Bar & Billiards with manual coordinates
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in environment variables');
  console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMetroSportz() {
  console.log(
    '🎯 Updating Metro Sportz Bar & Billiards with manual coordinates...',
  );

  // Coordinates from Google Maps: 33.57947616216805, -112.11875363780979
  const latitude = 33.57947616216805;
  const longitude = -112.11875363780979;

  try {
    // Update the venue
    const { data, error } = await supabase
      .from('venues')
      .update({
        latitude: latitude,
        longitude: longitude,
      })
      .eq('venue', 'Metro Sportz Bar & Billiards')
      .select();

    if (error) {
      console.error('❌ Error updating venue:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Successfully updated Metro Sportz Bar & Billiards!');
      console.log(`📍 Coordinates: ${latitude}, ${longitude}`);

      // Check final status
      const { data: allVenues, error: fetchError } = await supabase
        .from('venues')
        .select('id, venue, latitude, longitude');

      if (!fetchError && allVenues) {
        const withCoords = allVenues.filter(
          (v) => v.latitude !== null && v.longitude !== null,
        );
        console.log('\n📊 Final Status:');
        console.log(`📍 Total venues: ${allVenues.length}`);
        console.log(`✅ Venues with coordinates: ${withCoords.length}`);
        console.log(
          `🎯 Completion: ${Math.round(
            (withCoords.length / allVenues.length) * 100,
          )}%`,
        );

        console.log('\n📋 All Venues:');
        allVenues.forEach((venue, index) => {
          const hasCoords = venue.latitude !== null && venue.longitude !== null;
          const status = hasCoords ? '✅' : '❌';
          const coords = hasCoords
            ? `${venue.latitude}, ${venue.longitude}`
            : 'No coordinates';
          console.log(`${index + 1}. ${status} ${venue.venue}: ${coords}`);
        });
      }
    } else {
      console.log('⚠️ No venue found with name "Metro Sportz Bar & Billiards"');
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

updateMetroSportz();
