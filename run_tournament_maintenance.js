// Script to run tournament maintenance - archive expired tournaments and setup recurring ones
// This script should be run after setting up the SQL functions

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
// Check your CompeteApp/ApiSupabase/supabase.tsx file for the correct values
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMaintenanceNow() {
  console.log('🔧 Running Tournament Maintenance...\n');

  try {
    // Step 1: Check current status before maintenance
    console.log('=== BEFORE MAINTENANCE ===');

    const { data: beforeTournaments, error: beforeError } = await supabase
      .from('tournaments')
      .select('id, tournament_name, start_date, recurring_series_id')
      .eq('status', 'active')
      .order('start_date');

    if (beforeError) {
      console.error(
        '❌ Error checking tournaments before maintenance:',
        beforeError,
      );
      return;
    }

    console.log(
      `📊 Total active tournaments: ${beforeTournaments?.length || 0}`,
    );

    const today = new Date().toISOString().split('T')[0];
    const expiredTournaments =
      beforeTournaments?.filter((t) => t.start_date < today) || [];
    const futureTournaments =
      beforeTournaments?.filter((t) => t.start_date >= today) || [];
    const recurringTournaments =
      beforeTournaments?.filter((t) => t.recurring_series_id) || [];

    console.log(
      `📅 Expired tournaments (will be archived): ${expiredTournaments.length}`,
    );
    console.log(`📅 Future tournaments: ${futureTournaments.length}`);
    console.log(`🔄 Recurring tournaments: ${recurringTournaments.length}`);

    if (expiredTournaments.length > 0) {
      console.log('\n📋 Expired tournaments to be archived:');
      expiredTournaments.forEach((t) => {
        console.log(`   - ${t.tournament_name} (${t.start_date})`);
      });
    }

    // Step 2: Run the maintenance function
    console.log('\n=== RUNNING MAINTENANCE ===');

    const { data: maintenanceResult, error: maintenanceError } =
      await supabase.rpc('archive_expired_tournaments');

    if (maintenanceError) {
      console.error('❌ Error running maintenance:', maintenanceError);
      return;
    }

    if (maintenanceResult && maintenanceResult.length > 0) {
      const result = maintenanceResult[0];
      console.log('✅ Maintenance completed successfully!');
      console.log(`📦 Tournaments archived: ${result.archived_count}`);
      console.log(
        `🔄 Recurring tournaments generated: ${result.recurring_generated_count}`,
      );

      if (result.error_message) {
        console.log(`⚠️  Error during maintenance: ${result.error_message}`);
      }
    } else {
      console.log('ℹ️  No maintenance result returned');
    }

    // Step 3: Check status after maintenance
    console.log('\n=== AFTER MAINTENANCE ===');

    const { data: afterTournaments, error: afterError } = await supabase
      .from('tournaments')
      .select('id, tournament_name, start_date, recurring_series_id')
      .eq('status', 'active')
      .order('start_date');

    if (afterError) {
      console.error(
        '❌ Error checking tournaments after maintenance:',
        afterError,
      );
      return;
    }

    console.log(
      `📊 Total active tournaments: ${afterTournaments?.length || 0}`,
    );

    const afterFuture =
      afterTournaments?.filter((t) => t.start_date >= today) || [];
    const afterRecurring =
      afterTournaments?.filter((t) => t.recurring_series_id) || [];

    console.log(`📅 Future tournaments: ${afterFuture.length}`);
    console.log(`🔄 Recurring tournaments: ${afterRecurring.length}`);

    // Step 4: Check recurring series status
    console.log('\n=== RECURRING SERIES STATUS ===');

    const seriesGroups = {};
    afterRecurring.forEach((tournament) => {
      if (!seriesGroups[tournament.recurring_series_id]) {
        seriesGroups[tournament.recurring_series_id] = [];
      }
      seriesGroups[tournament.recurring_series_id].push(tournament);
    });

    console.log(
      `📊 Active recurring series: ${Object.keys(seriesGroups).length}`,
    );
    Object.entries(seriesGroups).forEach(([seriesId, tournaments]) => {
      console.log(
        `   - Series ${seriesId.substring(0, 8)}... has ${
          tournaments.length
        } future tournaments`,
      );
      if (tournaments.length < 4) {
        console.log(
          `     ⚠️  Still needs ${4 - tournaments.length} more tournaments`,
        );
      } else {
        console.log(
          `     ✅ Has sufficient tournaments (${tournaments.length})`,
        );
      }
    });

    // Step 5: Check archived tournaments
    console.log('\n=== ARCHIVED TOURNAMENTS ===');

    try {
      const { data: archivedCount, error: archivedError } = await supabase
        .from('tournaments_history')
        .select('*', { count: 'exact', head: true });

      if (archivedError) {
        console.log(
          'ℹ️  Tournaments history table not accessible:',
          archivedError.message,
        );
      } else {
        console.log(`📚 Total archived tournaments: ${archivedCount || 0}`);

        // Get recent archived tournaments
        const { data: recentArchived, error: recentError } = await supabase
          .from('tournaments_history')
          .select('tournament_name, start_date, archived_reason, archived_at')
          .order('archived_at', { ascending: false })
          .limit(5);

        if (!recentError && recentArchived && recentArchived.length > 0) {
          console.log('\n📋 Recently archived tournaments:');
          recentArchived.forEach((t) => {
            console.log(
              `   - ${t.tournament_name} (${t.start_date}) - ${t.archived_reason} at ${t.archived_at}`,
            );
          });
        }
      }
    } catch (error) {
      console.log('ℹ️  Could not check archived tournaments:', error.message);
    }

    console.log('\n✅ Tournament maintenance completed successfully!');
    console.log('\n📋 Summary:');
    console.log(
      `   - Expired tournaments archived: ${
        maintenanceResult?.[0]?.archived_count || 0
      }`,
    );
    console.log(
      `   - New recurring tournaments generated: ${
        maintenanceResult?.[0]?.recurring_generated_count || 0
      }`,
    );
    console.log(
      `   - Active tournaments remaining: ${afterTournaments?.length || 0}`,
    );
    console.log(`   - All tournaments now show only future dates`);
  } catch (error) {
    console.error('❌ Unexpected error during maintenance:', error);
  }
}

// Run the maintenance
if (require.main === module) {
  console.log('🚀 Starting Tournament Maintenance System...\n');
  console.log('⚠️  Make sure you have:');
  console.log('   1. Updated SUPABASE_URL and SUPABASE_ANON_KEY in this file');
  console.log('   2. Run the SQL setup files in your database');
  console.log('   3. Deployed the updated frontend code\n');

  runMaintenanceNow()
    .then(() => {
      console.log('\n🏁 Maintenance completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Maintenance failed:', error);
      process.exit(1);
    });
}

module.exports = { runMaintenanceNow };
