const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilters() {
  console.log('=== TESTING TOURNAMENT FILTERS ===\n');

  // Test 1: Get all active tournaments
  console.log('TEST 1: Fetching all active tournaments...');
  const { data: allTournaments, error: allError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, game_type, format, equipment, table_size')
    .eq('status', 'active')
    .limit(5);

  if (allError) {
    console.error('❌ Error:', allError);
  } else {
    console.log(`✅ Found ${allTournaments.length} tournaments:`);
    allTournaments.forEach((t) => {
      console.log(`   - ${t.tournament_name}`);
      console.log(`     game_type: "${t.game_type}"`);
      console.log(`     format: "${t.format}"`);
      console.log(`     equipment: "${t.equipment}"`);
      console.log(`     table_size: "${t.table_size}"`);
    });
  }

  console.log('\n---\n');

  // Test 2: Filter by game_type using ilike
  console.log('TEST 2: Filtering by game_type = "9-Ball" using ilike...');
  const { data: gameTypeTest, error: gameTypeError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, game_type')
    .eq('status', 'active')
    .ilike('game_type', '9-Ball');

  if (gameTypeError) {
    console.error('❌ Error:', gameTypeError);
  } else {
    console.log(
      `✅ Found ${gameTypeTest.length} tournaments with game_type "9-Ball"`,
    );
    gameTypeTest.forEach((t) => {
      console.log(`   - ${t.tournament_name} (game_type: "${t.game_type}")`);
    });
  }

  console.log('\n---\n');

  // Test 3: Filter by format using ilike
  console.log('TEST 3: Filtering by format = "Chip Tournament" using ilike...');
  const { data: formatTest, error: formatError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, format')
    .eq('status', 'active')
    .ilike('format', 'Chip Tournament');

  if (formatError) {
    console.error('❌ Error:', formatError);
  } else {
    console.log(
      `✅ Found ${formatTest.length} tournaments with format "Chip Tournament"`,
    );
    formatTest.forEach((t) => {
      console.log(`   - ${t.tournament_name} (format: "${t.format}")`);
    });
  }

  console.log('\n---\n');

  // Test 4: Filter by equipment using ilike
  console.log(
    'TEST 4: Filtering by equipment = "Diamond Tables" using ilike...',
  );
  const { data: equipmentTest, error: equipmentError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, equipment')
    .eq('status', 'active')
    .ilike('equipment', 'Diamond Tables');

  if (equipmentError) {
    console.error('❌ Error:', equipmentError);
  } else {
    console.log(
      `✅ Found ${equipmentTest.length} tournaments with equipment "Diamond Tables"`,
    );
    equipmentTest.forEach((t) => {
      console.log(`   - ${t.tournament_name} (equipment: "${t.equipment}")`);
    });
  }

  console.log('\n---\n');

  // Test 5: Filter by table_size using ilike
  console.log('TEST 5: Filtering by table_size = "7ft" using ilike...');
  const { data: tableSizeTest, error: tableSizeError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, table_size')
    .eq('status', 'active')
    .ilike('table_size', '7ft');

  if (tableSizeError) {
    console.error('❌ Error:', tableSizeError);
  } else {
    console.log(
      `✅ Found ${tableSizeTest.length} tournaments with table_size "7ft"`,
    );
    tableSizeTest.forEach((t) => {
      console.log(`   - ${t.tournament_name} (table_size: "${t.table_size}")`);
    });
  }

  console.log('\n---\n');

  // Test 6: Combined filters
  console.log(
    'TEST 6: Combined filters (game_type="9-Ball" AND format="Chip Tournament")...',
  );
  const { data: combinedTest, error: combinedError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, game_type, format')
    .eq('status', 'active')
    .ilike('game_type', '9-Ball')
    .ilike('format', 'Chip Tournament');

  if (combinedError) {
    console.error('❌ Error:', combinedError);
  } else {
    console.log(
      `✅ Found ${combinedTest.length} tournaments matching both filters`,
    );
    combinedTest.forEach((t) => {
      console.log(`   - ${t.tournament_name}`);
      console.log(`     game_type: "${t.game_type}"`);
      console.log(`     format: "${t.format}"`);
    });
  }

  console.log('\n=== FILTER TESTING COMPLETE ===');
}

testFilters().catch(console.error);
