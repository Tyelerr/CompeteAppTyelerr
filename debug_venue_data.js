const { supabase } = require('./ApiSupabase/supabase.tsx');

async function checkVenueData() {
  console.log('=== CHECKING VENUE DATA ===');

  // Check if venues table has city/state data
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id, venue, city, state, address')
    .limit(5);

  console.log('Sample venues data:', venues);
  console.log('Venues error:', venuesError);

  // Check tournaments with venues join
  const { data: tournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, venue, venues(id, venue, city, state)')
    .limit(5);

  console.log('Sample tournaments with venues:', tournaments);
  console.log('Tournaments error:', tournamentsError);

  // Check if any venues have city data
  const { data: venuesWithCity, error: cityError } = await supabase
    .from('venues')
    .select('id, venue, city, state')
    .not('city', 'is', null)
    .not('city', 'eq', '')
    .limit(3);

  console.log('Venues with city data:', venuesWithCity);
  console.log('City error:', cityError);

  // Check total venues count
  const { count: totalVenues } = await supabase
    .from('venues')
    .select('id', { count: 'exact' });

  console.log('Total venues count:', totalVenues);

  // Check total tournaments count
  const { count: totalTournaments } = await supabase
    .from('tournaments')
    .select('id', { count: 'exact' })
    .eq('status', 'active');

  console.log('Total active tournaments count:', totalTournaments);
}

checkVenueData()
  .then(() => process.exit(0))
  .catch(console.error);
