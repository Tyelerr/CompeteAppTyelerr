const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL || 'your-url',
  process.env.SUPABASE_ANON_KEY || 'your-key',
);

async function checkTournamentVenueRelationships() {
  console.log('=== CHECKING TOURNAMENT VENUE RELATIONSHIPS ===');

  // Check tournaments and their venue relationships
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, id_unique_number, venue_id, venue, venue_lat, venue_lng')
    .limit(10);

  if (error) {
    console.error('Error fetching tournaments:', error);
    return;
  }

  console.log('Total tournaments found:', tournaments?.length || 0);

  if (tournaments && tournaments.length > 0) {
    console.log('\n=== TOURNAMENT VENUE RELATIONSHIPS ===');
    tournaments.forEach((tournament, index) => {
      console.log(
        `${index + 1}. Tournament ID: ${tournament.id_unique_number}`,
      );
      console.log(`   venue_id: ${tournament.venue_id}`);
      console.log(`   venue: ${tournament.venue}`);
      console.log(`   venue_lat: ${tournament.venue_lat}`);
      console.log(`   venue_lng: ${tournament.venue_lng}`);
      console.log('');
    });

    // Check how many tournaments have venue_id set
    const withVenueId = tournaments.filter(
      (t) => t.venue_id && t.venue_id !== null && t.venue_id !== -1,
    );
    console.log(
      `Tournaments with venue_id set: ${withVenueId.length}/${tournaments.length}`,
    );

    // Check venues table
    const { data: venues, error: venueError } = await supabase
      .from('venues')
      .select('id, name, address, city, state, zip_code, latitude, longitude')
      .limit(10);

    if (!venueError && venues) {
      console.log('\n=== VENUES IN DATABASE ===');
      venues.forEach((venue, index) => {
        console.log(`${index + 1}. Venue ID: ${venue.id}`);
        console.log(`   Name: ${venue.name}`);
        console.log(
          `   Address: ${venue.address}, ${venue.city}, ${venue.state} ${venue.zip_code}`,
        );
        console.log(
          `   Coordinates: lat=${venue.latitude}, lng=${venue.longitude}`,
        );
        console.log('');
      });

      // Check if tournament venue_ids match venue ids
      console.log('\n=== VENUE ID MATCHING ===');
      const tournamentVenueIds = [
        ...new Set(withVenueId.map((t) => t.venue_id)),
      ];
      const venueIds = venues.map((v) => v.id);

      console.log('Tournament venue_ids:', tournamentVenueIds);
      console.log('Available venue ids:', venueIds);

      const matchingIds = tournamentVenueIds.filter((id) =>
        venueIds.includes(id),
      );
      console.log('Matching venue ids:', matchingIds);
    }
  } else {
    console.log('No tournaments found in database');
  }
}

checkTournamentVenueRelationships().catch(console.error);
