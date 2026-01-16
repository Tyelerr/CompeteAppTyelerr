/**
 * ============================================================================
 * GIVEAWAY ARCHIVAL SYSTEM - TEST SCRIPT
 * ============================================================================
 * This script tests the giveaway archival system functionality
 * Run with: node CompeteApp/test_giveaway_archival.js
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testArchivalTables() {
  console.log('\n📋 Testing Archive Tables...');

  try {
    // Test giveaways_archive table
    const { data: giveawaysArchive, error: giveawaysError } = await supabase
      .from('giveaways_archive')
      .select('*')
      .limit(1);

    if (giveawaysError) {
      console.error(
        '❌ giveaways_archive table error:',
        giveawaysError.message,
      );
    } else {
      console.log('✅ giveaways_archive table accessible');
    }

    // Test giveaway_entries_archive table
    const { data: entriesArchive, error: entriesError } = await supabase
      .from('giveaway_entries_archive')
      .select('*')
      .limit(1);

    if (entriesError) {
      console.error(
        '❌ giveaway_entries_archive table error:',
        entriesError.message,
      );
    } else {
      console.log('✅ giveaway_entries_archive table accessible');
    }
  } catch (error) {
    console.error('❌ Error testing archive tables:', error.message);
  }
}

async function testArchivalFunctions() {
  console.log('\n🔧 Testing Archival Functions...');

  try {
    // Test get_giveaway_archival_stats function
    const { data: stats, error: statsError } = await supabase.rpc(
      'get_giveaway_archival_stats',
    );

    if (statsError) {
      console.error(
        '❌ get_giveaway_archival_stats error:',
        statsError.message,
      );
    } else {
      console.log('✅ get_giveaway_archival_stats function works');
      console.log('   Stats:', stats);
    }
  } catch (error) {
    console.error('❌ Error testing archival functions:', error.message);
  }
}

async function testManualArchival() {
  console.log('\n🗂️  Testing Manual Archival...');

  try {
    // First, check if there are any active giveaways
    const { data: giveaways, error: fetchError } = await supabase
      .from('giveaways')
      .select('id, title, status')
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching giveaways:', fetchError.message);
      return;
    }

    if (!giveaways || giveaways.length === 0) {
      console.log('ℹ️  No active giveaways found to test archival');
      return;
    }

    console.log(`   Found ${giveaways.length} active giveaway(s)`);
    giveaways.forEach((g) => {
      console.log(`   - ${g.title} (${g.status})`);
    });

    console.log(
      '\n   Note: To test manual archival, use the archive_giveaway_manual function',
    );
    console.log(
      "   Example: SELECT archive_giveaway_manual('<giveaway_id>', '<admin_id>', 'test');",
    );
  } catch (error) {
    console.error('❌ Error testing manual archival:', error.message);
  }
}

async function testExpiredArchival() {
  console.log('\n⏰ Testing Expired Giveaway Archival...');

  try {
    // Check for expired giveaways
    const { data: expiredGiveaways, error: fetchError } = await supabase
      .from('giveaways')
      .select('id, title, status, end_at')
      .or('status.eq.ended,end_at.lt.' + new Date().toISOString());

    if (fetchError) {
      console.error('❌ Error fetching expired giveaways:', fetchError.message);
      return;
    }

    if (!expiredGiveaways || expiredGiveaways.length === 0) {
      console.log('ℹ️  No expired giveaways found');
      return;
    }

    console.log(`   Found ${expiredGiveaways.length} expired giveaway(s):`);
    expiredGiveaways.forEach((g) => {
      console.log(`   - ${g.title} (${g.status}, ends: ${g.end_at || 'N/A'})`);
    });

    // Test the archive_expired_giveaways function
    console.log('\n   Testing archive_expired_giveaways function...');
    const { data: result, error: archiveError } = await supabase.rpc(
      'archive_expired_giveaways',
    );

    if (archiveError) {
      console.error(
        '❌ archive_expired_giveaways error:',
        archiveError.message,
      );
    } else {
      const archiveResult = Array.isArray(result) ? result[0] : result;
      console.log('✅ archive_expired_giveaways function executed');
      console.log(
        `   Archived ${archiveResult.archived_giveaways_count} giveaway(s)`,
      );
      console.log(
        `   Archived ${archiveResult.archived_entries_count} entry/entries`,
      );
      if (archiveResult.error_message) {
        console.log(`   Error: ${archiveResult.error_message}`);
      }
    }
  } catch (error) {
    console.error('❌ Error testing expired archival:', error.message);
  }
}

async function displayArchivalStats() {
  console.log('\n📊 Archival Statistics...');

  try {
    const { data: stats, error } = await supabase.rpc(
      'get_giveaway_archival_stats',
    );

    if (error) {
      console.error('❌ Error fetching stats:', error.message);
      return;
    }

    const result = Array.isArray(stats) ? stats[0] : stats;

    console.log(
      '   Total Archived Giveaways:',
      result.total_archived_giveaways,
    );
    console.log('   Total Archived Entries:', result.total_archived_entries);
    console.log('   Expired Giveaways:', result.expired_giveaways);
    console.log('   Admin Deleted:', result.admin_deleted_giveaways);
    console.log('   Manual Archived:', result.manual_archived_giveaways);
    console.log(
      '   Total Prize Value:',
      `$${result.total_archived_prize_value}`,
    );
    console.log('   Oldest Archive:', result.oldest_archived_date || 'N/A');
    console.log('   Newest Archive:', result.newest_archived_date || 'N/A');
  } catch (error) {
    console.error('❌ Error displaying stats:', error.message);
  }
}

async function displayArchivedGiveaways() {
  console.log('\n📦 Archived Giveaways...');

  try {
    const { data: archived, error } = await supabase
      .from('giveaways_archive')
      .select('id, title, removal_reason, removal_date')
      .order('removal_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching archived giveaways:', error.message);
      return;
    }

    if (!archived || archived.length === 0) {
      console.log('   No archived giveaways found');
      return;
    }

    console.log(`   Found ${archived.length} archived giveaway(s):`);
    archived.forEach((g) => {
      const date = new Date(g.removal_date).toLocaleDateString();
      console.log(`   - ${g.title}`);
      console.log(`     Reason: ${g.removal_reason}, Date: ${date}`);
    });
  } catch (error) {
    console.error('❌ Error displaying archived giveaways:', error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log(
    '╔════════════════════════════════════════════════════════════════╗',
  );
  console.log(
    '║     GIVEAWAY ARCHIVAL SYSTEM - TEST SUITE                     ║',
  );
  console.log(
    '╚════════════════════════════════════════════════════════════════╝',
  );

  await testArchivalTables();
  await testArchivalFunctions();
  await displayArchivalStats();
  await displayArchivedGiveaways();
  await testManualArchival();
  await testExpiredArchival();

  console.log(
    '\n╔════════════════════════════════════════════════════════════════╗',
  );
  console.log(
    '║     TEST SUITE COMPLETE                                        ║',
  );
  console.log(
    '╚════════════════════════════════════════════════════════════════╝\n',
  );
}

// Run the tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
