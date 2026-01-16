/**
 * Test script to verify pagination count fix
 * This tests that { count: 'exact' } is working correctly in tournament queries
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error(
    'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPaginationCountFix() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     TESTING PAGINATION COUNT FIX                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  // Test 1: Basic query with count
  console.log('📋 TEST 1: Basic tournament query with { count: "exact" }');
  console.log('─────────────────────────────────────────────────────────');

  const {
    data: basicData,
    count: basicCount,
    error: basicError,
  } = await supabase
    .from('tournaments')
    .select(
      `
        *,
        profiles(*),
        venues(*)
      `,
      { count: 'exact' },
    )
    .eq('status', 'active')
    .limit(10);

  if (basicError) {
    console.error('❌ Error in basic query:', basicError);
  } else {
    console.log('✅ Basic query successful');
    console.log(
      `   Data returned: ${basicData ? basicData.length : 0} tournaments`,
    );
    console.log(`   Count value: ${basicCount}`);
    console.log(`   Count is null: ${basicCount === null}`);
    console.log(`   Count is undefined: ${basicCount === undefined}`);

    if (basicCount === null || basicCount === undefined) {
      console.error('❌ FAILED: Count is still null/undefined!');
    } else {
      console.log('✅ PASSED: Count is properly returned');
    }
  }
  console.log('');

  // Test 2: Query with filters and count
  console.log('📋 TEST 2: Filtered query with { count: "exact" }');
  console.log('─────────────────────────────────────────────────────────');

  const today = new Date().toISOString().split('T')[0];

  const {
    data: filteredData,
    count: filteredCount,
    error: filteredError,
  } = await supabase
    .from('tournaments')
    .select(
      `
        *,
        profiles(*),
        venues(*)
      `,
      { count: 'exact' },
    )
    .eq('status', 'active')
    .gte('start_date', today)
    .not('is_recurring_master', 'eq', true)
    .order('start_date', { ascending: true })
    .range(0, 9);

  if (filteredError) {
    console.error('❌ Error in filtered query:', filteredError);
  } else {
    console.log('✅ Filtered query successful');
    console.log(
      `   Data returned: ${filteredData ? filteredData.length : 0} tournaments`,
    );
    console.log(`   Count value: ${filteredCount}`);
    console.log(`   Count is null: ${filteredCount === null}`);
    console.log(`   Count is undefined: ${filteredCount === undefined}`);

    if (filteredCount === null || filteredCount === undefined) {
      console.error('❌ FAILED: Count is still null/undefined!');
    } else {
      console.log('✅ PASSED: Count is properly returned');
      console.log(`   Total tournaments matching filters: ${filteredCount}`);
      console.log(
        `   Expected pages (10 per page): ${Math.ceil(filteredCount / 10)}`,
      );
    }
  }
  console.log('');

  // Test 3: Query without count (to show the difference)
  console.log('📋 TEST 3: Query WITHOUT { count: "exact" } (for comparison)');
  console.log('─────────────────────────────────────────────────────────');

  const {
    data: noCountData,
    count: noCount,
    error: noCountError,
  } = await supabase
    .from('tournaments')
    .select(
      `
        *,
        profiles(*),
        venues(*)
      `,
      // Note: No { count: 'exact' } parameter
    )
    .eq('status', 'active')
    .limit(10);

  if (noCountError) {
    console.error('❌ Error in no-count query:', noCountError);
  } else {
    console.log('✅ No-count query successful');
    console.log(
      `   Data returned: ${noCountData ? noCountData.length : 0} tournaments`,
    );
    console.log(`   Count value: ${noCount}`);
    console.log(`   Count is null: ${noCount === null}`);
    console.log(`   Count is undefined: ${noCount === undefined}`);

    if (noCount === null || noCount === undefined) {
      console.log(
        '✅ EXPECTED: Count is null when { count: "exact" } is not specified',
      );
    } else {
      console.warn(
        '⚠️  UNEXPECTED: Count returned even without { count: "exact" }',
      );
    }
  }
  console.log('');

  // Test 4: Pagination scenario
  console.log('📋 TEST 4: Pagination scenario (multiple pages)');
  console.log('─────────────────────────────────────────────────────────');

  const pageSize = 5;

  // Page 1
  const {
    data: page1Data,
    count: page1Count,
    error: page1Error,
  } = await supabase
    .from('tournaments')
    .select(
      `
        *,
        profiles(*),
        venues(*)
      `,
      { count: 'exact' },
    )
    .eq('status', 'active')
    .gte('start_date', today)
    .not('is_recurring_master', 'eq', true)
    .order('start_date', { ascending: true })
    .order('id', { ascending: true })
    .range(0, pageSize - 1);

  if (page1Error) {
    console.error('❌ Error in page 1 query:', page1Error);
  } else {
    console.log('✅ Page 1 query successful');
    console.log(
      `   Data returned: ${page1Data ? page1Data.length : 0} tournaments`,
    );
    console.log(`   Total count: ${page1Count}`);

    if (page1Count !== null && page1Count !== undefined) {
      const totalPages = Math.ceil(page1Count / pageSize);
      console.log(`   Total pages: ${totalPages}`);
      console.log('✅ PASSED: Count available for pagination calculation');

      // Page 2 (if exists)
      if (totalPages > 1) {
        const {
          data: page2Data,
          count: page2Count,
          error: page2Error,
        } = await supabase
          .from('tournaments')
          .select(
            `
              *,
              profiles(*),
              venues(*)
            `,
            { count: 'exact' },
          )
          .eq('status', 'active')
          .gte('start_date', today)
          .not('is_recurring_master', 'eq', true)
          .order('start_date', { ascending: true })
          .order('id', { ascending: true })
          .range(pageSize, pageSize * 2 - 1);

        if (page2Error) {
          console.error('❌ Error in page 2 query:', page2Error);
        } else {
          console.log('');
          console.log('✅ Page 2 query successful');
          console.log(
            `   Data returned: ${page2Data ? page2Data.length : 0} tournaments`,
          );
          console.log(`   Total count: ${page2Count}`);

          if (page1Count === page2Count) {
            console.log('✅ PASSED: Count is consistent across pages');
          } else {
            console.error('❌ FAILED: Count differs between pages!');
            console.error(`   Page 1 count: ${page1Count}`);
            console.error(`   Page 2 count: ${page2Count}`);
          }
        }
      } else {
        console.log('   ℹ️  Only 1 page of results, skipping page 2 test');
      }
    } else {
      console.error('❌ FAILED: Count is null/undefined!');
    }
  }
  console.log('');

  // Test 5: Empty result set
  console.log('📋 TEST 5: Empty result set (count should be 0, not null)');
  console.log('─────────────────────────────────────────────────────────');

  const {
    data: emptyData,
    count: emptyCount,
    error: emptyError,
  } = await supabase
    .from('tournaments')
    .select(
      `
        *,
        profiles(*),
        venues(*)
      `,
      { count: 'exact' },
    )
    .eq('status', 'active')
    .eq('tournament_name', 'THIS_TOURNAMENT_DOES_NOT_EXIST_12345');

  if (emptyError) {
    console.error('❌ Error in empty result query:', emptyError);
  } else {
    console.log('✅ Empty result query successful');
    console.log(
      `   Data returned: ${emptyData ? emptyData.length : 0} tournaments`,
    );
    console.log(`   Count value: ${emptyCount}`);
    console.log(`   Count is null: ${emptyCount === null}`);
    console.log(`   Count is undefined: ${emptyCount === undefined}`);

    if (emptyCount === 0) {
      console.log('✅ PASSED: Count is 0 for empty result set');
    } else if (emptyCount === null || emptyCount === undefined) {
      console.error('❌ FAILED: Count is null/undefined instead of 0');
    } else {
      console.warn(`⚠️  UNEXPECTED: Count is ${emptyCount} instead of 0`);
    }
  }
  console.log('');

  // Summary
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     TEST SUMMARY                                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('The fix adds { count: "exact" } to Supabase .select() calls.');
  console.log('This ensures Supabase returns the total count along with data.');
  console.log('');
  console.log('Key changes made:');
  console.log(
    '1. FetchTournaments_Filters: Added { count: "exact" } to main query',
  );
  console.log('2. FetchTournaments2: Added { count: "exact" } to main query');
  console.log('3. Removed duplicate console.log statements');
  console.log('4. Cleaned up duplicate comment lines');
  console.log('');
  console.log('Next steps:');
  console.log('- Test pagination in the app UI');
  console.log('- Verify Next/Previous buttons work correctly');
  console.log('- Check console logs show proper count values');
  console.log('- Test with various filters applied');
  console.log('');
}

testPaginationCountFix()
  .then(() => {
    console.log('✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
