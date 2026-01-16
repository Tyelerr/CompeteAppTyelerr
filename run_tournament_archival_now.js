// Simple script to run tournament archival and see what happens
// This will help debug why tournaments aren't being moved to tournaments_history

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl =
  process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTournamentArchival() {
  console.log('🔧 Running Tournament Archival Test');
  console.log('===================================');

  try {
    // 1. Check current date and tournaments that should be archived
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today's date: ${today}`);

    // 2. Check active tournaments that should be archived
    console.log('\n📋 Checking tournaments that should be archived...');
    const { data: shouldBeArchived, error: checkError } = await supabase
      .from('tournaments')
      .select('id, id_unique_number, tournament_name, start_date, status')
      .lte('start_date', today)
      .eq('status', 'active');

    if (checkError) {
      console.error('❌ Error checking tournaments:', checkError);
      return;
    }

    console.log(
      `Found ${
        shouldBeArchived?.length || 0
      } tournaments that should be archived:`,
    );
    if (shouldBeArchived && shouldBeArchived.length > 0) {
      shouldBeArchived.forEach((tournament) => {
        console.log(
          `  - ID ${tournament.id_unique_number}: ${tournament.tournament_name} (${tournament.start_date})`,
        );
      });
    } else {
      console.log('  No tournaments found that need archival');
    }

    // 3. Check if tournaments_history table exists and has the right structure
    console.log('\n🗃️ Checking tournaments_history table...');
    const { data: historyCheck, error: historyError } = await supabase
      .from('tournaments_history')
      .select(
        'id, id_unique_number, tournament_name, archived_reason, archived_at',
      )
      .limit(5);

    if (historyError) {
      console.error(
        '❌ Error accessing tournaments_history table:',
        historyError,
      );
      console.log(
        'The tournaments_history table may not exist or have permission issues',
      );
      return;
    } else {
      console.log('✅ tournaments_history table is accessible');
      console.log(`Current archived tournaments: ${historyCheck?.length || 0}`);
    }

    // 4. Try to run the archival function
    console.log('\n🚀 Running archive_expired_tournaments() function...');
    const { data: result, error: functionError } = await supabase.rpc(
      'archive_expired_tournaments',
    );

    if (functionError) {
      console.error('❌ Error running archival function:', functionError);
      console.log('The function may not exist or have permission issues');
      return;
    }

    const archivalResult = result?.[0];
    if (archivalResult) {
      console.log('✅ Archival function executed successfully!');
      console.log(`📦 Tournaments archived: ${archivalResult.archived_count}`);
      console.log(
        `🔄 Recurring tournaments generated: ${archivalResult.recurring_generated_count}`,
      );

      if (archivalResult.error_message) {
        console.log(`⚠️ Error message: ${archivalResult.error_message}`);
      }
    } else {
      console.log('❌ No result returned from archival function');
    }

    // 5. Check active tournaments after archival
    console.log('\n📊 Checking active tournaments after archival...');
    const { data: activeAfter, error: activeAfterError } = await supabase
      .from('tournaments')
      .select('id, id_unique_number, tournament_name, start_date, status')
      .eq('status', 'active')
      .order('start_date', { ascending: true });

    if (activeAfterError) {
      console.error(
        '❌ Error checking active tournaments after archival:',
        activeAfterError,
      );
      return;
    }

    console.log(`Active tournaments remaining: ${activeAfter?.length || 0}`);
    if (activeAfter && activeAfter.length > 0) {
      console.log('Remaining active tournaments:');
      activeAfter.forEach((tournament) => {
        const tournamentDate = new Date(tournament.start_date);
        const todayDate = new Date(today);
        const isPast = tournamentDate <= todayDate;

        console.log(
          `  - ID ${tournament.id_unique_number}: ${
            tournament.tournament_name
          } (${tournament.start_date}) ${
            isPast ? '⚠️ SHOULD BE ARCHIVED' : '✅ FUTURE'
          }`,
        );
      });
    }

    // 6. Check tournaments_history after archival
    console.log('\n📚 Checking tournaments_history after archival...');
    const { data: historyAfter, error: historyAfterError } = await supabase
      .from('tournaments_history')
      .select(
        'id, id_unique_number, tournament_name, start_date, archived_reason, archived_at',
      )
      .order('archived_at', { ascending: false })
      .limit(10);

    if (historyAfterError) {
      console.error(
        '❌ Error checking tournaments_history after archival:',
        historyAfterError,
      );
      return;
    }

    console.log(`Recent archived tournaments: ${historyAfter?.length || 0}`);
    if (historyAfter && historyAfter.length > 0) {
      console.log('Recent archived tournaments:');
      historyAfter.forEach((tournament) => {
        console.log(
          `  - ID ${tournament.id_unique_number}: ${tournament.tournament_name}`,
        );
        console.log(
          `    Tournament Date: ${tournament.start_date}, Archived: ${tournament.archived_at} (${tournament.archived_reason})`,
        );
      });
    }

    console.log('\n✅ Tournament archival test completed!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
runTournamentArchival();
