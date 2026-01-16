/**
 * Debug script to diagnose why count query returns 0 when tournaments exist
 * Run this to see what's happening with the count query
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function debugCountIssue() {
  console.log('=== DEBUGGING COUNT QUERY ISSUE ===\n');

  // Test 1: Get total tournaments in database
  console.log('TEST 1: Total tournaments in database');
  const { data: allTournaments, error: allError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, status, start_date, is_recurring_master');

  console.log('Total tournaments:', allTournaments?.length || 0);
  if (allError) console.error('Error:', allError);
  console.log('');

  // Test 2: Count with is_recurring_master exclusion using .not()
  console.log(
    'TEST 2: Count excluding is_recurring_master = true (using .not())',
  );
  const { count: countNot, error: errorNot } = await supabase
    .from('tournaments')
    .select('id', { count: 'exact' })
    .not('is_recurring_master', 'eq', true);

  console.log('Count result:', countNot);
  if (errorNot) console.error('Error:', errorNot);
  console.log('');

  // Test 3: Get actual data with .not() filter
  console.log('TEST 3: Actual data with .not() filter');
  const { data: dataNot, error: dataNotError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, is_recurring_master')
    .not('is_recurring_master', 'eq', true);

  console.log('Data count:', dataNot?.length || 0);
  if (dataNotError) console.error('Error:', dataNotError);
  if (dataNot && dataNot.length > 0) {
    console.log('Sample records:');
    dataNot.slice(0, 3).forEach((t) => {
      console.log(
        `  - ${t.tournament_name} (is_recurring_master: ${t.is_recurring_master})`,
      );
    });
  }
  console.log('');

  // Test 4: Count active tournaments from today onwards
  const today = new Date().toISOString().split('T')[0];
  console.log(`TEST 4: Count active tournaments from ${today} onwards`);
  const { count: countActive, error: errorActive } = await supabase
    .from('tournaments')
    .select('id', { count: 'exact' })
    .not('is_recurring_master', 'eq', true)
    .eq('status', 'active')
    .gte('start_date', today);

  console.log('Count result:', countActive);
  if (errorActive) console.error('Error:', errorActive);
  console.log('');

  // Test 5: Get actual active tournaments
  console.log('TEST 5: Actual active tournaments data');
  const { data: activeData, error: activeDataError } = await supabase
    .from('tournaments')
    .select('id, tournament_name, status, start_date, is_recurring_master')
    .not('is_recurring_master', 'eq', true)
    .eq('status', 'active')
    .gte('start_date', today);

  console.log('Data count:', activeData?.length || 0);
  if (activeDataError) console.error('Error:', activeDataError);
  if (activeData && activeData.length > 0) {
    console.log('Sample records:');
    activeData.slice(0, 5).forEach((t) => {
      console.log(`  - ${t.tournament_name}`);
      console.log(
        `    Status: ${t.status}, Date: ${t.start_date}, is_master: ${t.is_recurring_master}`,
      );
    });
  }
  console.log('');

  // Test 6: Check if issue is with count vs data
  console.log('TEST 6: Compare count query vs data query');
  const { count: testCount } = await supabase
    .from('tournaments')
    .select('id', { count: 'exact' })
    .not('is_recurring_master', 'eq', true)
    .eq('status', 'active')
    .gte('start_date', today);

  const { data: testData } = await supabase
    .from('tournaments')
    .select('id')
    .not('is_recurring_master', 'eq', true)
    .eq('status', 'active')
    .gte('start_date', today);

  console.log('Count query result:', testCount);
  console.log('Data query result:', testData?.length || 0);
  console.log('MISMATCH:', testCount !== testData?.length);
  console.log('');

  // Test 7: Check is_recurring_master values
  console.log('TEST 7: Check is_recurring_master values in database');
  const { data: masterCheck } = await supabase
    .from('tournaments')
    .select('id, tournament_name, is_recurring_master')
    .limit(20);

  if (masterCheck) {
    const trueCount = masterCheck.filter(
      (t) => t.is_recurring_master === true,
    ).length;
    const falseCount = masterCheck.filter(
      (t) => t.is_recurring_master === false,
    ).length;
    const nullCount = masterCheck.filter(
      (t) => t.is_recurring_master === null,
    ).length;

    console.log(`is_recurring_master = true: ${trueCount}`);
    console.log(`is_recurring_master = false: ${falseCount}`);
    console.log(`is_recurring_master = null: ${nullCount}`);
  }
  console.log('');

  console.log('=== DEBUG COMPLETE ===');
  console.log('\nNEXT STEPS:');
  console.log(
    '1. Check if count query returns 0 but data query returns records',
  );
  console.log('2. If yes, the issue is with Supabase count() function');
  console.log('3. Solution: Use data.length instead of count for totalCount');
}

debugCountIssue().catch(console.error);
