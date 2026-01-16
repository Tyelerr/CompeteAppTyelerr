// Test script for automatic tournament archival
// This script tests the updated archival function that archives tournaments on their date (same day)

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://ybgdxqjjkqtjkqxkqjkq.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAutomaticTournamentArchival() {
  console.log('🧪 Testing Automatic Tournament Archival System');
  console.log('================================================');

  try {
    // 1. Check current active tournaments
    console.log('\n1. Checking current active tournaments...');
    const { data: activeTournaments, error: activeError } = await supabase
      .from('tournaments')
      .select('id_unique_number, tournament_name, start_date, status')
      .eq('status', 'active')
      .order('start_date', { ascending: true });

    if (activeError) {
      console.error('❌ Error fetching active tournaments:', activeError);
      return;
    }

    console.log(
      `📊 Found ${activeTournaments?.length || 0} active tournaments`,
    );

    if (activeTournaments && activeTournaments.length > 0) {
      console.log('\nActive tournaments:');
      activeTournaments.forEach((tournament) => {
        const tournamentDate = new Date(tournament.start_date);
        const today = new Date();
        const isToday = tournamentDate.toDateString() === today.toDateString();
        const isPast = tournamentDate < today;

        console.log(
          `  - ID ${tournament.id_unique_number}: ${tournament.tournament_name}`,
        );
        console.log(
          `    Date: ${tournament.start_date} ${
            isToday ? '(TODAY)' : isPast ? '(PAST)' : '(FUTURE)'
          }`,
        );
      });
    }

    // 2. Check tournaments that should be archived (tournaments on or before today)
    console.log('\n2. Checking tournaments that should be archived...');
    const today = new Date().toISOString().split('T')[0];

    const { data: shouldBeArchived, error: shouldBeArchivedError } =
      await supabase
        .from('tournaments')
        .select('id_unique_number, tournament_name, start_date, status')
        .lte('start_date', today)
        .eq('status', 'active');

    if (shouldBeArchivedError) {
      console.error(
        '❌ Error checking tournaments to archive:',
        shouldBeArchivedError,
      );
      return;
    }

    console.log(
      `📋 Found ${
        shouldBeArchived?.length || 0
      } tournaments that should be archived`,
    );

    if (shouldBeArchived && shouldBeArchived.length > 0) {
      console.log('\nTournaments that should be archived:');
      shouldBeArchived.forEach((tournament) => {
        console.log(
          `  - ID ${tournament.id_unique_number}: ${tournament.tournament_name} (${tournament.start_date})`,
        );
      });
    }

    // 3. Run the archival maintenance function
    console.log('\n3. Running automatic tournament archival...');
    const { data: maintenanceResult, error: maintenanceError } =
      await supabase.rpc('archive_expired_tournaments');

    if (maintenanceError) {
      console.error(
        '❌ Error running tournament maintenance:',
        maintenanceError,
      );
      return;
    }

    const result = maintenanceResult?.[0];
    if (result) {
      console.log('✅ Tournament maintenance completed successfully!');
      console.log(`📦 Tournaments archived: ${result.archived_count}`);
      console.log(
        `🔄 Recurring tournaments generated: ${result.recurring_generated_count}`,
      );

      if (result.error_message) {
        console.log(`⚠️  Error message: ${result.error_message}`);
      }
    } else {
      console.log('❌ No result returned from maintenance function');
    }

    // 4. Check active tournaments after archival
    console.log('\n4. Checking active tournaments after archival...');
    const { data: activeTournamentsAfter, error: activeAfterError } =
      await supabase
        .from('tournaments')
        .select('id_unique_number, tournament_name, start_date, status')
        .eq('status', 'active')
        .order('start_date', { ascending: true });

    if (activeAfterError) {
      console.error(
        '❌ Error fetching active tournaments after archival:',
        activeAfterError,
      );
      return;
    }

    console.log(
      `📊 Active tournaments after archival: ${
        activeTournamentsAfter?.length || 0
      }`,
    );

    if (activeTournamentsAfter && activeTournamentsAfter.length > 0) {
      console.log('\nRemaining active tournaments:');
      activeTournamentsAfter.forEach((tournament) => {
        const tournamentDate = new Date(tournament.start_date);
        const today = new Date();
        const isToday = tournamentDate.toDateString() === today.toDateString();
        const isFuture = tournamentDate > today;

        console.log(
          `  - ID ${tournament.id_unique_number}: ${tournament.tournament_name}`,
        );
        console.log(
          `    Date: ${tournament.start_date} ${
            isToday
              ? '(TODAY - should be archived!)'
              : isFuture
              ? '(FUTURE)'
              : '(PAST - should be archived!)'
          }`,
        );
      });
    }

    // 5. Check tournaments_history table
    console.log('\n5. Checking tournaments_history table...');
    const { data: archivedTournaments, error: archivedError } = await supabase
      .from('tournaments_history')
      .select(
        'id_unique_number, tournament_name, start_date, archived_reason, archived_at',
      )
      .order('archived_at', { ascending: false })
      .limit(10);

    if (archivedError) {
      console.error('❌ Error fetching archived tournaments:', archivedError);
      return;
    }

    console.log(
      `📚 Recent archived tournaments: ${archivedTournaments?.length || 0}`,
    );

    if (archivedTournaments && archivedTournaments.length > 0) {
      console.log('\nRecent archived tournaments:');
      archivedTournaments.forEach((tournament) => {
        console.log(
          `  - ID ${tournament.id_unique_number}: ${tournament.tournament_name}`,
        );
        console.log(`    Tournament Date: ${tournament.start_date}`);
        console.log(
          `    Archived: ${tournament.archived_at} (Reason: ${tournament.archived_reason})`,
        );
      });
    }

    // 6. Get archival statistics
    console.log('\n6. Getting archival statistics...');
    const { data: stats, error: statsError } = await supabase.rpc(
      'get_tournament_archival_stats',
    );

    if (statsError) {
      console.error('❌ Error getting archival stats:', statsError);
      return;
    }

    const statsResult = stats?.[0];
    if (statsResult) {
      console.log('📈 Tournament Archival Statistics:');
      console.log(`  - Total archived: ${statsResult.total_archived}`);
      console.log(`  - Expired (auto-archived): ${statsResult.expired_count}`);
      console.log(`  - Deleted (manual): ${statsResult.deleted_count}`);
      console.log(`  - Manual archival: ${statsResult.manual_count}`);
      console.log(`  - Active tournaments: ${statsResult.active_tournaments}`);
      console.log(
        `  - Recurring series: ${statsResult.recurring_series_count}`,
      );
    }

    console.log('\n✅ Automatic tournament archival test completed!');
    console.log('\n📝 Summary:');
    console.log(
      `  - Tournaments archived in this run: ${result?.archived_count || 0}`,
    );
    console.log(
      `  - Recurring tournaments generated: ${
        result?.recurring_generated_count || 0
      }`,
    );
    console.log(
      `  - Total active tournaments remaining: ${
        activeTournamentsAfter?.length || 0
      }`,
    );
  } catch (error) {
    console.error('❌ Unexpected error during archival test:', error);
  }
}

// Run the test
testAutomaticTournamentArchival();
