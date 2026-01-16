const { createClient } = require('@supabase/supabase-js');

// Use environment variables or fallback values
const supabaseUrl = process.env.SUPABASE_URL || 'your-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCityFilterIssue() {
  console.log('=== DEBUGGING CITY FILTER ISSUE ===');

  try {
    // 1. Check venues table structure and data
    console.log('\n1. CHECKING VENUES TABLE:');
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('*')
      .limit(3);

    if (venuesError) {
      console.error('Venues error:', venuesError);
    } else {
      console.log('Sample venues:', venues);
      if (venues && venues.length > 0) {
        console.log('Venue fields:', Object.keys(venues[0]));
      }
    }

    // 2. Check tournaments table structure and venue relationship
    console.log('\n2. CHECKING TOURNAMENTS TABLE:');
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, tournament_name, venue, venue_id, status')
      .eq('status', 'active')
      .limit(3);

    if (tournamentsError) {
      console.error('Tournaments error:', tournamentsError);
    } else {
      console.log('Sample tournaments:', tournaments);
      if (tournaments && tournaments.length > 0) {
        console.log('Tournament fields:', Object.keys(tournaments[0]));
      }
    }

    // 3. Check tournaments with venues join
    console.log('\n3. CHECKING TOURNAMENTS WITH VENUES JOIN:');
    const { data: tournamentsWithVenues, error: joinError } = await supabase
      .from('tournaments')
      .select(
        `
        id, 
        tournament_name, 
        venue, 
        venue_id,
        venues(*)
      `,
      )
      .eq('status', 'active')
      .not('venue_id', 'is', null)
      .limit(3);

    if (joinError) {
      console.error('Join error:', joinError);
    } else {
      console.log('Tournaments with venues join:', tournamentsWithVenues);
    }

    // 4. Check if venues have city/state data
    console.log('\n4. CHECKING VENUES WITH CITY DATA:');
    const { data: venuesWithCity, error: cityError } = await supabase
      .from('venues')
      .select('id, name, venue, city, state')
      .not('city', 'is', null)
      .not('city', 'eq', '')
      .limit(5);

    if (cityError) {
      console.error('City error:', cityError);
    } else {
      console.log('Venues with city data:', venuesWithCity);
    }

    // 5. Test the exact query that's failing
    console.log('\n5. TESTING CITY FILTER QUERY:');
    const testCity =
      venuesWithCity && venuesWithCity.length > 0
        ? venuesWithCity[0].city
        : 'Phoenix';
    console.log('Testing with city:', testCity);

    const { data: filteredTournaments, error: filterError } = await supabase
      .from('tournaments')
      .select(
        `
        *,
        profiles(*),
        venues(*)
      `,
      )
      .eq('status', 'active')
      .eq('venues.city', testCity)
      .limit(5);

    if (filterError) {
      console.error('Filter error:', filterError);
    } else {
      console.log('Filtered tournaments result:', filteredTournaments);
      console.log(
        'Filtered tournaments count:',
        filteredTournaments?.length || 0,
      );
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

debugCityFilterIssue()
  .then(() => {
    console.log('\n=== DEBUG COMPLETE ===');
    process.exit(0);
  })
  .catch(console.error);
