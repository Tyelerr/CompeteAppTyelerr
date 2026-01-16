// Test Script for Horizon-Based Recurring Tournament Generation
// This script tests the new recurring tournament system

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error(
    'Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecurringTournamentSystem() {
  console.log('🧪 Testing Horizon-Based Recurring Tournament System\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Check if unique constraint exists
    console.log('\n📋 Test 1: Checking unique constraint...');
    const { data: constraints, error: constraintError } = await supabase.rpc(
      'execute_sql',
      {
        query: `
                    SELECT conname, pg_get_constraintdef(oid) as definition
                    FROM pg_constraint
                    WHERE conname = 'unique_recurring_series_date'
                `,
      },
    );

    if (constraintError) {
      console.log('⚠️  Could not verify constraint (may need admin access)');
    } else if (constraints && constraints.length > 0) {
      console.log('✅ Unique constraint exists:', constraints[0].conname);
    } else {
      console.log('❌ Unique constraint not found - needs to be added');
    }

    // Test 2: Check for parent_recurring_tournament_uuid column
    console.log(
      '\n📋 Test 2: Checking parent_recurring_tournament_uuid column...',
    );
    const { data: columns, error: columnError } = await supabase.rpc(
      'execute_sql',
      {
        query: `
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = 'tournaments'
                    AND column_name IN ('parent_recurring_tournament_id', 'parent_recurring_tournament_uuid')
                    ORDER BY column_name
                `,
      },
    );

    if (columnError) {
      console.log('⚠️  Could not verify columns (may need admin access)');
    } else if (columns) {
      console.log(
        '✅ Found columns:',
        columns.map((c) => `${c.column_name} (${c.data_type})`).join(', '),
      );
    }

    // Test 3: Check for recurring master tournaments
    console.log('\n📋 Test 3: Checking recurring master tournaments...');
    const { data: masters, error: mastersError } = await supabase
      .from('tournaments')
      .select('id, tournament_name, recurring_series_id, start_date')
      .eq('is_recurring_master', true)
      .eq('is_recurring', true)
      .eq('status', 'active');

    if (mastersError) {
      console.log('❌ Error fetching masters:', mastersError.message);
    } else {
      console.log(`✅ Found ${masters.length} recurring master tournament(s)`);
      masters.forEach((m) => {
        console.log(
          `   - ${m.tournament_name} (Series: ${m.recurring_series_id})`,
        );
      });
    }

    // Test 4: Check child tournaments for each series
    if (masters && masters.length > 0) {
      console.log('\n📋 Test 4: Checking child tournaments...');
      for (const master of masters) {
        const { data: children, error: childrenError } = await supabase
          .from('tournaments')
          .select('id, start_date, status')
          .eq('recurring_series_id', master.recurring_series_id)
          .eq('is_recurring_master', false)
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true });

        if (childrenError) {
          console.log(
            `   ❌ Error for ${master.tournament_name}:`,
            childrenError.message,
          );
        } else {
          console.log(
            `   ✅ ${master.tournament_name}: ${children.length} future tournaments`,
          );
          if (children.length > 0) {
            const dates = children.map((c) => c.start_date).join(', ');
            console.log(`      Dates: ${dates}`);
          }
        }
      }
    }

    // Test 5: Test the horizon generation function
    console.log('\n📋 Test 5: Testing horizon generation function...');
    const { data: genResult, error: genError } = await supabase.rpc(
      'generate_recurring_tournaments_horizon',
    );

    if (genError) {
      console.log('❌ Error calling generation function:', genError.message);
      console.log(
        "   This is expected if the function hasn't been deployed yet",
      );
    } else {
      console.log('✅ Generation function executed successfully');
      if (genResult && genResult.length > 0) {
        genResult.forEach((r) => {
          if (r.tournaments_created > 0) {
            console.log(`   ✅ ${r.message}`);
          } else {
            console.log(`   ℹ️  ${r.message}`);
          }
        });
      }
    }

    // Test 6: Check for duplicates
    console.log('\n📋 Test 6: Checking for duplicate tournaments...');
    const { data: duplicates, error: dupError } = await supabase.rpc(
      'execute_sql',
      {
        query: `
                    SELECT recurring_series_id, start_date, COUNT(*) as count
                    FROM tournaments
                    WHERE is_recurring = true
                    AND recurring_series_id IS NOT NULL
                    GROUP BY recurring_series_id, start_date
                    HAVING COUNT(*) > 1
                `,
      },
    );

    if (dupError) {
      console.log('⚠️  Could not check for duplicates (may need admin access)');
    } else if (duplicates && duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate(s):`);
      duplicates.forEach((d) => {
        console.log(
          `   - Series ${d.recurring_series_id} on ${d.start_date}: ${d.count} entries`,
        );
      });
    } else {
      console.log('✅ No duplicates found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Testing complete!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the tests
testRecurringTournamentSystem()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
