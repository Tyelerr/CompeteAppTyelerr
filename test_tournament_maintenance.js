// Test script for tournament maintenance system
// This script tests the tournament archival and recurring generation functions

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTournamentMaintenance() {
  console.log('🧪 Testing Tournament Maintenance System...\n');

  try {
    // Test 1: Check if maintenance is needed
    console.log('=== Test 1: Check Maintenance Needs ===');

    const { data: expiredTournaments, error: expiredError } = await supabase
      .from('tournaments')
      .select('id, tournament_name, start_date')
      .lt('start_date', new Date().toISOString().split('T')[0])
      .eq('status', 'active')
      .limit(5);

    if (expiredError) {
      console.error('❌ Error checking expired tournaments:', expiredError);
    } else {
      console.log(
        `📊 Found ${expiredTournaments?.length || 0} expired tournaments:`,
      );
      expiredTournaments?.forEach((tournament) => {
        console.log(
          `   - ${tournament.tournament_name} (${tournament.start_date})`,
        );
      });
    }

    // Test 2: Check recurring series status
    console.log('\n=== Test 2: Check Recurring Series Status ===');

    const { data: recurringSeries, error: recurringError } = await supabase
      .from('tournaments')
      .select('recurring_series_id, start_date, tournament_name')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .eq('status', 'active')
      .not('recurring_series_id', 'is', null)
      .order('recurring_series_id')
      .order('start_date');

    if (recurringError) {
      console.error('❌ Error checking recurring series:', recurringError);
    } else {
      // Group by series
      const seriesGroups = {};
      recurringSeries?.forEach((tournament) => {
        if (!seriesGroups[tournament.recurring_series_id]) {
          seriesGroups[tournament.recurring_series_id] = [];
        }
        seriesGroups[tournament.recurring_series_id].push(tournament);
      });

      console.log(
        `📊 Found ${Object.keys(seriesGroups).length} recurring series:`,
      );
      Object.entries(seriesGroups).forEach(([seriesId, tournaments]) => {
        console.log(
          `   - Series ${seriesId.substring(0, 8)}... has ${
            tournaments.length
          } future tournaments`,
        );
        if (tournaments.length < 4) {
          console.log(
            `     ⚠️  Needs ${4 - tournaments.length} more tournaments`,
          );
        }
      });
    }

    // Test 3: Get current archival statistics
    console.log('\n=== Test 3: Current Archival Statistics ===');

    try {
      const { data: stats, error: statsError } = await supabase.rpc(
        'get_tournament_archival_stats',
      );

      if (statsError) {
        console.error('❌ Error getting archival stats:', statsError);
      } else if (stats && stats.length > 0) {
        const stat = stats[0];
        console.log('📊 Current Statistics:');
        console.log(`   - Total archived tournaments: ${stat.total_archived}`);
        console.log(`   - Expired tournaments archived: ${stat.expired_count}`);
        console.log(`   - Deleted tournaments archived: ${stat.deleted_count}`);
        console.log(`   - Manually archived tournaments: ${stat.manual_count}`);
        console.log(`   - Active tournaments: ${stat.active_tournaments}`);
        console.log(
          `   - Recurring series count: ${stat.recurring_series_count}`,
        );
      } else {
        console.log(
          'ℹ️  No archival statistics available (functions may not be installed)',
        );
      }
    } catch (error) {
      console.log(
        'ℹ️  Archival statistics function not available:',
        error.message,
      );
    }

    // Test 4: Test maintenance function (if available)
    console.log('\n=== Test 4: Test Maintenance Function ===');

    try {
      const { data: maintenanceResult, error: maintenanceError } =
        await supabase.rpc('archive_expired_tournaments');

      if (maintenanceError) {
        console.error('❌ Error running maintenance:', maintenanceError);
      } else if (maintenanceResult && maintenanceResult.length > 0) {
        const result = maintenanceResult[0];
        console.log('✅ Maintenance completed successfully:');
        console.log(`   - Tournaments archived: ${result.archived_count}`);
        console.log(
          `   - Recurring tournaments generated: ${result.recurring_generated_count}`,
        );
        if (result.error_message) {
          console.log(`   - Error: ${result.error_message}`);
        }
      } else {
        console.log('ℹ️  No maintenance result returned');
      }
    } catch (error) {
      console.log('ℹ️  Maintenance function not available:', error.message);
      console.log(
        "   This is expected if the SQL functions haven't been installed yet.",
      );
    }

    // Test 5: Check tournaments history table
    console.log('\n=== Test 5: Check Tournaments History ===');

    try {
      const { data: historyCount, error: historyError } = await supabase
        .from('tournaments_history')
        .select('*', { count: 'exact', head: true });

      if (historyError) {
        console.log(
          'ℹ️  Tournaments history table not available:',
          historyError.message,
        );
      } else {
        console.log(
          `📊 Tournaments history table contains ${historyCount} records`,
        );

        // Get recent history entries
        const { data: recentHistory, error: recentError } = await supabase
          .from('tournaments_history')
          .select('tournament_name, archived_reason, archived_at')
          .order('archived_at', { ascending: false })
          .limit(5);

        if (!recentError && recentHistory && recentHistory.length > 0) {
          console.log('   Recent archived tournaments:');
          recentHistory.forEach((entry) => {
            console.log(
              `   - ${entry.tournament_name} (${entry.archived_reason}) - ${entry.archived_at}`,
            );
          });
        }
      }
    } catch (error) {
      console.log(
        'ℹ️  Tournaments history table not available:',
        error.message,
      );
    }

    console.log('\n✅ Tournament maintenance system test completed!');
    console.log('\n📋 Next Steps:');
    console.log(
      '1. Run the SQL files to create the history table and functions:',
    );
    console.log('   - CompeteApp/sql/create_tournaments_history_table.sql');
    console.log('   - CompeteApp/sql/tournament_maintenance_functions.sql');
    console.log(
      '2. Set up a daily cron job or scheduled task to run the maintenance',
    );
    console.log('3. Test the system with some expired tournaments');
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
if (require.main === module) {
  testTournamentMaintenance()
    .then(() => {
      console.log('\n🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testTournamentMaintenance };
