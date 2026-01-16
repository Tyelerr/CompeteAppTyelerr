// Debug script to check filter matching issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://yfqkqhqnzqhxjqfqxqhq.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key',
);

async function debugFilterIssue() {
  console.log('=== DEBUGGING FILTER ISSUE ===\n');

  // 1. Check what game_type values exist in the database
  console.log('1. Checking game_type values in database...');
  const { data: allTournaments, error: allError } = await supabase
    .from('tournaments')
    .select('id_unique_number, tournament_name, game_type, format')
    .eq('status', 'active')
    .limit(20);

  if (allError) {
    console.error('Error fetching tournaments:', allError);
    return;
  }

  console.log(`\nFound ${allTournaments.length} active tournaments:`);
  allTournaments.forEach((t) => {
    console.log(`  #${t.id_unique_number}: "${t.tournament_name}"`);
    console.log(
      `    game_type: "${t.game_type}" (type: ${typeof t.game_type})`,
    );
    console.log(`    format: "${t.format}" (type: ${typeof t.format})`);
  });

  // 2. Get unique game_type values
  console.log('\n2. Unique game_type values in database:');
  const uniqueGameTypes = [...new Set(allTournaments.map((t) => t.game_type))];
  uniqueGameTypes.forEach((gt) => {
    console.log(`  - "${gt}"`);
  });

  // 3. Get unique format values
  console.log('\n3. Unique format values in database:');
  const uniqueFormats = [...new Set(allTournaments.map((t) => t.format))];
  uniqueFormats.forEach((f) => {
    console.log(`  - "${f}"`);
  });

  // 4. Test filter with exact match
  console.log('\n4. Testing filter with "8-Ball" (exact match)...');
  const { data: exactMatch, error: exactError } = await supabase
    .from('tournaments')
    .select('id_unique_number, tournament_name, game_type')
    .eq('status', 'active')
    .eq('game_type', '8-Ball')
    .limit(5);

  if (exactError) {
    console.error('Error with exact match:', exactError);
  } else {
    console.log(`  Found ${exactMatch.length} tournaments with exact match`);
    exactMatch.forEach((t) => {
      console.log(
        `    #${t.id_unique_number}: ${t.tournament_name} - "${t.game_type}"`,
      );
    });
  }

  // 5. Test filter with ilike (case-insensitive)
  console.log(
    '\n5. Testing filter with "8-Ball" (ilike - case insensitive)...',
  );
  const { data: ilikeMatch, error: ilikeError } = await supabase
    .from('tournaments')
    .select('id_unique_number, tournament_name, game_type')
    .eq('status', 'active')
    .ilike('game_type', '8-Ball')
    .limit(5);

  if (ilikeError) {
    console.error('Error with ilike match:', ilikeError);
  } else {
    console.log(`  Found ${ilikeMatch.length} tournaments with ilike match`);
    ilikeMatch.forEach((t) => {
      console.log(
        `    #${t.id_unique_number}: ${t.tournament_name} - "${t.game_type}"`,
      );
    });
  }

  // 6. Test with different variations
  console.log('\n6. Testing different game_type variations...');
  const variations = ['8-ball', '8-Ball', '8 Ball', '8ball'];

  for (const variation of variations) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id_unique_number, game_type')
      .eq('status', 'active')
      .ilike('game_type', variation)
      .limit(1);

    if (!error && data) {
      console.log(`  "${variation}": ${data.length} matches`);
    }
  }

  // 7. Check if there are any empty or null game_type values
  console.log('\n7. Checking for empty/null game_type values...');
  const { data: emptyGameType, error: emptyError } = await supabase
    .from('tournaments')
    .select('id_unique_number, tournament_name, game_type')
    .eq('status', 'active')
    .or('game_type.is.null,game_type.eq.')
    .limit(5);

  if (!emptyError && emptyGameType) {
    console.log(
      `  Found ${emptyGameType.length} tournaments with empty/null game_type`,
    );
    emptyGameType.forEach((t) => {
      console.log(
        `    #${t.id_unique_number}: ${t.tournament_name} - game_type: "${t.game_type}"`,
      );
    });
  }

  console.log('\n=== DEBUG COMPLETE ===');
}

debugFilterIssue().catch(console.error);
