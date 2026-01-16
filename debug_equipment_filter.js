const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function debugEquipmentFilter() {
  console.log('=== DEBUGGING EQUIPMENT FILTER ===\n');

  // 1. Check what equipment values exist in the database
  console.log('1. Checking equipment values in database:');
  const { data: equipmentData, error: equipmentError } = await supabase
    .from('tournaments')
    .select('equipment, id_unique_number, tournament_name')
    .not('equipment', 'is', null)
    .neq('equipment', '')
    .limit(20);

  if (equipmentError) {
    console.error('Error fetching equipment:', equipmentError);
  } else {
    console.log(`Found ${equipmentData.length} tournaments with equipment:`);
    equipmentData.forEach((t) => {
      console.log(
        `  - ID ${t.id_unique_number}: "${t.equipment}" (${t.tournament_name})`,
      );
    });
  }

  console.log('\n2. Testing filter with "Diamond Tables":');
  const { data: diamondTest, error: diamondError } = await supabase
    .from('tournaments')
    .select('equipment, id_unique_number, tournament_name')
    .eq('equipment', 'Diamond Tables')
    .limit(10);

  if (diamondError) {
    console.error('Error:', diamondError);
  } else {
    console.log(
      `Found ${diamondTest.length} tournaments with exact match "Diamond Tables"`,
    );
    diamondTest.forEach((t) => {
      console.log(`  - ID ${t.id_unique_number}: "${t.equipment}"`);
    });
  }

  console.log('\n3. Testing filter with "diamond-tables":');
  const { data: diamondHyphenTest, error: diamondHyphenError } = await supabase
    .from('tournaments')
    .select('equipment, id_unique_number, tournament_name')
    .eq('equipment', 'diamond-tables')
    .limit(10);

  if (diamondHyphenError) {
    console.error('Error:', diamondHyphenError);
  } else {
    console.log(
      `Found ${diamondHyphenTest.length} tournaments with exact match "diamond-tables"`,
    );
    diamondHyphenTest.forEach((t) => {
      console.log(`  - ID ${t.id_unique_number}: "${t.equipment}"`);
    });
  }

  console.log('\n4. Testing case-insensitive filter with ilike:');
  const { data: ilikeTest, error: ilikeError } = await supabase
    .from('tournaments')
    .select('equipment, id_unique_number, tournament_name')
    .ilike('equipment', 'Diamond Tables')
    .limit(10);

  if (ilikeError) {
    console.error('Error:', ilikeError);
  } else {
    console.log(
      `Found ${ilikeTest.length} tournaments with ilike "Diamond Tables"`,
    );
    ilikeTest.forEach((t) => {
      console.log(`  - ID ${t.id_unique_number}: "${t.equipment}"`);
    });
  }

  console.log('\n=== DEBUG COMPLETE ===');
}

debugEquipmentFilter().catch(console.error);
