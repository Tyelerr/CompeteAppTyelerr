// Debug script to test the billiard count fix
const { FetchTournaments_Filters } = require('./ApiSupabase/CrudTournament');

async function testBilliardCountFix() {
  console.log('=== TESTING BILLIARD COUNT FIX ===');

  // Test with a simple filter that might trigger radius filtering
  const testFilters = {
    zip_code: '85051', // Phoenix, AZ (from the screenshot)
    radius: 25,
    state: 'AZ',
  };

  console.log('Testing with filters:', JSON.stringify(testFilters, null, 2));

  try {
    const result = await FetchTournaments_Filters(testFilters, 0);

    console.log('=== RESULT ===');
    console.log('Data length:', result.data ? result.data.length : 'null');
    console.log('Error:', result.error);
    console.log(
      'Total count:',
      result.dataTotalCount ? result.dataTotalCount[0].totalcount : 'null',
    );

    if (result.data && result.dataTotalCount) {
      const actualCount = result.data.length;
      const reportedCount = result.dataTotalCount[0].totalcount;

      console.log('=== COUNT COMPARISON ===');
      console.log('Actual tournaments returned:', actualCount);
      console.log('Reported total count:', reportedCount);
      console.log(
        'Match:',
        actualCount === reportedCount ? '✅ FIXED' : '❌ STILL BROKEN',
      );
    }
  } catch (error) {
    console.error('Error testing:', error);
  }
}

// Run the test
testBilliardCountFix();
