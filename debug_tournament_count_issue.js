const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key',
);

async function debugTournamentCount() {
  console.log('=== DEBUGGING TOURNAMENT COUNT ISSUE ===\n');

  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`Today's date: ${today}\n`);

    // 1. Count ALL tournaments (no filters)
    const { count: totalAll } = await supabase
      .from('tournaments')
      .select('id', { count: 'exact', head: true });

    console.log(
      `📊 TOTAL tournaments in database (all statuses, all dates): ${totalAll}`,
    );

    // 2. Count ACTIVE tournaments (all dates)
    const { count: totalActive } = await supabase
      .from('tournaments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    console.log(`📊 ACTIVE tournaments (all dates): ${totalActive}`);

    // 3. Count ACTIVE FUTURE tournaments (what regular users see)
    const { count: totalActiveFuture } = await supabase
      .from('tournaments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('start_date', today);

    console.log(
      `📊 ACTIVE FUTURE tournaments (>= ${today}): ${totalActiveFuture}`,
    );

    // 4. Get sample of tournaments to see their statuses and dates
    const { data: sampleTournaments } = await supabase
      .from('tournaments')
      .select(
        'id, id_unique_number, tournament_name, status, start_date, is_recurring, recurring_template_status',
      )
      .order('start_date', { ascending: true })
      .limit(30);

    console.log(`\n📋 SAMPLE OF TOURNAMENTS (first 30, ordered by date):`);
    console.log('─'.repeat(120));
    sampleTournaments?.forEach((t, index) => {
      const isPast = t.start_date < today;
      const statusIcon = t.status === 'active' ? '✅' : '❌';
      const dateIcon = isPast ? '📅' : '📆';
      const recurringInfo = t.is_recurring
        ? ` [RECURRING: ${t.recurring_template_status || 'N/A'}]`
        : '';
      console.log(
        `${index + 1}. ${statusIcon} ${dateIcon} ID:${
          t.id_unique_number
        } | ${t.status.padEnd(10)} | ${t.start_date} | ${
          t.tournament_name
        }${recurringInfo}`,
      );
    });

    // 5. Count by status
    console.log(`\n📊 BREAKDOWN BY STATUS:`);
    const { data: statusBreakdown } = await supabase
      .from('tournaments')
      .select('status')
      .order('status');

    const statusCounts = {};
    statusBreakdown?.forEach((t) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // 6. Count by date (past vs future)
    const { count: pastCount } = await supabase
      .from('tournaments')
      .select('id', { count: 'exact', head: true })
      .lt('start_date', today);

    const { count: futureCount } = await supabase
      .from('tournaments')
      .select('id', { count: 'exact', head: true })
      .gte('start_date', today);

    console.log(`\n📊 BREAKDOWN BY DATE:`);
    console.log(`   Past tournaments (< ${today}): ${pastCount}`);
    console.log(`   Future tournaments (>= ${today}): ${futureCount}`);

    // 7. Check recurring template status
    const { count: templateCount } = await supabase
      .from('tournaments')
      .select('id', { count: 'exact', head: true })
      .eq('recurring_template_status', 'template');

    console.log(`\n📊 RECURRING TOURNAMENTS:`);
    console.log(
      `   Templates (recurring_template_status='template'): ${templateCount}`,
    );

    console.log('\n=== DIAGNOSIS ===');
    if (totalActiveFuture === 20 && totalAll > 20) {
      console.log(
        '⚠️  ISSUE CONFIRMED: There are more than 20 total tournaments, but only 20 active future ones.',
      );
      console.log(
        '   This means the count query is working correctly for regular users.',
      );
      console.log(
        "   If you're logged in as an ADMIN, the fix should show all tournaments.",
      );
      console.log('   Make sure to REBUILD the app with the new code changes.');
    } else if (totalAll === 20) {
      console.log(
        'ℹ️  There are exactly 20 tournaments total in the database.',
      );
      console.log(
        "   This is why no pagination arrows appear - there's only 1 page of results.",
      );
    } else if (totalActiveFuture > 20) {
      console.log('⚠️  There are MORE than 20 active future tournaments.');
      console.log(
        "   Pagination arrows SHOULD appear. If they don't, there may be a different issue.",
      );
    }

    console.log('\n=== END DEBUG ===');
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

debugTournamentCount();
