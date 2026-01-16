/**
 * ============================================================================
 * RUN GIVEAWAY ARCHIVAL NOW
 * ============================================================================
 * This script manually triggers the archival of expired giveaways
 * Run with: node CompeteApp/run_giveaway_archival_now.js
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error(
    '   Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runArchival() {
  console.log(
    '╔════════════════════════════════════════════════════════════════╗',
  );
  console.log(
    '║     GIVEAWAY ARCHIVAL - MANUAL EXECUTION                      ║',
  );
  console.log(
    '╚════════════════════════════════════════════════════════════════╝\n',
  );

  try {
    // Step 1: Check current stats before archival
    console.log('📊 Fetching current statistics...\n');

    const { data: beforeStats, error: beforeError } = await supabase.rpc(
      'get_giveaway_archival_stats',
    );

    if (beforeError) {
      console.error('❌ Error fetching stats:', beforeError.message);
    } else {
      const stats = Array.isArray(beforeStats) ? beforeStats[0] : beforeStats;
      console.log('   Current Archive Stats:');
      console.log(
        `   - Total Archived Giveaways: ${stats.total_archived_giveaways}`,
      );
      console.log(
        `   - Total Archived Entries: ${stats.total_archived_entries}`,
      );
      console.log(`   - Expired: ${stats.expired_giveaways}`);
      console.log(`   - Admin Deleted: ${stats.admin_deleted_giveaways}\n`);
    }

    // Step 2: Check for expired giveaways
    console.log('🔍 Checking for expired giveaways...\n');

    const { data: expiredGiveaways, error: fetchError } = await supabase
      .from('giveaways')
      .select('id, numeric_id, title, status, end_at')
      .or('status.eq.ended,end_at.lt.' + new Date().toISOString());

    if (fetchError) {
      console.error('❌ Error fetching expired giveaways:', fetchError.message);
      return;
    }

    if (!expiredGiveaways || expiredGiveaways.length === 0) {
      console.log('✅ No expired giveaways found. Nothing to archive.\n');
      return;
    }

    console.log(`   Found ${expiredGiveaways.length} expired giveaway(s):\n`);
    expiredGiveaways.forEach((g, index) => {
      console.log(`   ${index + 1}. ${g.title} (ID: ${g.numeric_id || g.id})`);
      console.log(`      Status: ${g.status}`);
      console.log(`      End Date: ${g.end_at || 'N/A'}\n`);
    });

    // Step 3: Run the archival function
    console.log('🗂️  Running archival process...\n');

    const { data: result, error: archiveError } = await supabase.rpc(
      'archive_expired_giveaways',
    );

    if (archiveError) {
      console.error('❌ Error during archival:', archiveError.message);
      console.error('   Details:', archiveError);
      return;
    }

    const archiveResult = Array.isArray(result) ? result[0] : result;

    if (archiveResult.error_message) {
      console.error('❌ Archival function returned an error:');
      console.error(`   ${archiveResult.error_message}\n`);
      return;
    }

    console.log('✅ Archival completed successfully!\n');
    console.log('   Results:');
    console.log(
      `   - Giveaways Archived: ${archiveResult.archived_giveaways_count}`,
    );
    console.log(
      `   - Entries Archived: ${archiveResult.archived_entries_count}\n`,
    );

    // Step 4: Show updated stats
    console.log('📊 Updated statistics...\n');

    const { data: afterStats, error: afterError } = await supabase.rpc(
      'get_giveaway_archival_stats',
    );

    if (afterError) {
      console.error('❌ Error fetching updated stats:', afterError.message);
    } else {
      const stats = Array.isArray(afterStats) ? afterStats[0] : afterStats;
      console.log('   New Archive Stats:');
      console.log(
        `   - Total Archived Giveaways: ${stats.total_archived_giveaways}`,
      );
      console.log(
        `   - Total Archived Entries: ${stats.total_archived_entries}`,
      );
      console.log(`   - Expired: ${stats.expired_giveaways}`);
      console.log(`   - Admin Deleted: ${stats.admin_deleted_giveaways}`);
      console.log(
        `   - Total Prize Value: $${stats.total_archived_prize_value}\n`,
      );
    }

    // Step 5: Show recently archived giveaways
    console.log('📦 Recently archived giveaways...\n');

    const { data: recentArchived, error: recentError } = await supabase
      .from('giveaways_archive')
      .select('title, removal_reason, removal_date')
      .order('removal_date', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Error fetching recent archives:', recentError.message);
    } else if (recentArchived && recentArchived.length > 0) {
      recentArchived.forEach((g, index) => {
        const date = new Date(g.removal_date).toLocaleString();
        console.log(`   ${index + 1}. ${g.title}`);
        console.log(`      Reason: ${g.removal_reason}`);
        console.log(`      Date: ${date}\n`);
      });
    }
  } catch (error) {
    console.error('❌ Fatal error during archival:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }

  console.log(
    '╔════════════════════════════════════════════════════════════════╗',
  );
  console.log(
    '║     ARCHIVAL PROCESS COMPLETE                                  ║',
  );
  console.log(
    '╚════════════════════════════════════════════════════════════════╝\n',
  );
}

// Run the archival
runArchival().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
