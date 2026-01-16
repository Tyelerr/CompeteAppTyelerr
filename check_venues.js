const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL || 'your-url',
  process.env.SUPABASE_ANON_KEY || 'your-key',
);

async function checkVenues() {
  console.log('=== CHECKING VENUES IN DATABASE ===');

  // Check total venues
  const { data: venues, error } = await supabase
    .from('venues')
    .select(
      'id, name, address, city, state, zip_code, latitude, longitude, point_location',
    )
    .limit(10);

  if (error) {
    console.error('Error fetching venues:', error);
    return;
  }

  console.log('Total venues found:', venues?.length || 0);

  if (venues && venues.length > 0) {
    console.log('\n=== SAMPLE VENUES ===');
    venues.forEach((venue, index) => {
      console.log(`${index + 1}. ${venue.name}`);
      console.log(
        `   Address: ${venue.address}, ${venue.city}, ${venue.state} ${venue.zip_code}`,
      );
      console.log(
        `   Coordinates: lat=${venue.latitude}, lng=${venue.longitude}`,
      );
      console.log(`   Point Location: ${venue.point_location}`);
      console.log('');
    });

    // Check for venues near ZIP 85308 coordinates
    console.log('\n=== CHECKING VENUES NEAR ZIP 85308 ===');
    const targetLat = 33.65975187461158;
    const targetLng = -112.18056109837289;

    const { data: nearbyVenues, error: nearbyError } = await supabase
      .from('venues')
      .select('id, name, address, city, state, zip_code, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (nearbyError) {
      console.error('Error fetching nearby venues:', nearbyError);
      return;
    }

    console.log('Venues with coordinates:', nearbyVenues?.length || 0);

    if (nearbyVenues && nearbyVenues.length > 0) {
      nearbyVenues.forEach((venue, index) => {
        const distance = calculateDistance(
          targetLat,
          targetLng,
          venue.latitude,
          venue.longitude,
        );
        console.log(
          `${index + 1}. ${venue.name} - Distance: ${distance.toFixed(
            2,
          )} miles`,
        );
        console.log(
          `   ${venue.address}, ${venue.city}, ${venue.state} ${venue.zip_code}`,
        );
        console.log(
          `   Coordinates: lat=${venue.latitude}, lng=${venue.longitude}`,
        );
        console.log('');
      });
    }
  } else {
    console.log('No venues found in database');
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

checkVenues().catch(console.error);
