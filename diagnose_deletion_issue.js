const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key',
);

async function diagnoseDeletionIssue() {
  console.log('🔍 Diagnosing Tournament Deletion Issue...\n');

  try {
    // Step 1: Check if the archival function exists and has SECURITY DEFINER
    console.log(
      '📋 Step 1: Checking if archival function has SECURITY DEFINER...',
    );

    const { data: functionCheck, error: functionError } = await supabase.rpc(
      'archive_tournament_manual_simple',
      {
        tournament_id: '00000000-0000-0000-0000-000000000000', // Fake ID to test function
        admin_user_id: null,
        reason: 'test',
      },
    );

    if (functionError) {
      if (functionError.message.includes('not found')) {
        console.log(
          '❌ Function archive_tournament_manual_simple does NOT exist',
        );
        console.log('   You need to run the SQL migration first!\n');
        console.log('   📝 Action Required:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log(
          '   2. Copy contents of: CompeteApp/sql/fix_tournament_deletion_security_definer.sql',
        );
        console.log('   3. Paste and run in SQL Editor\n');
        return;
      } else {
        console.log(
          '⚠️  Function exists but returned error:',
          functionError.message,
        );
        console.log('   This is expected for a fake tournament ID\n');
      }
    } else {
      console.log('✅ Function exists and is callable\n');
    }

    // Step 2: Pick a tournament to test with
    console.log('📋 Step 2: Finding a tournament to test deletion...');
    const { data: tournaments, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, tournament_name, id_unique_number')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching tournaments:', fetchError);
      return;
    }

    if (!tournaments || tournaments.length === 0) {
      console.log('⚠️  No tournaments found to test with');
      return;
    }

    const testTournament = tournaments[0];
    console.log('✅ Found tournament:');
    console.log(`   ID: ${testTournament.id}`);
    console.log(`   Name: ${testTournament.tournament_name}`);
    console.log(`   ID Number: ${testTournament.id_unique_number}\n`);

    // Step 3: Check if tournament has likes
    console.log('📋 Step 3: Checking for associated likes...');
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('*')
      .eq('turnament_id', testTournament.id);

    if (likesError) {
      console.log('⚠️  Error checking likes:', likesError.message);
    } else {
      console.log(`✅ Found ${likes?.length || 0} likes for this tournament\n`);
    }

    // Step 4: Try the archival function
    console.log('📋 Step 4: Testing archival function...');
    console.log('   Calling archive_tournament_manual_simple...\n');

    const { data: archiveResult, error: archiveError } = await supabase.rpc(
      'archive_tournament_manual_simple',
      {
        tournament_id: testTournament.id,
        admin_user_id: null,
        reason: 'diagnostic_test',
      },
    );

    if (archiveError) {
      console.log('❌ Archival function failed:', archiveError.message);
      console.log('   Error details:', archiveError);

      if (
        archiveError.message.includes('permission denied') ||
        archiveError.message.includes('policy')
      ) {
        console.log('\n   🔧 This confirms the RLS issue!');
        console.log(
          '   The function needs SECURITY DEFINER to bypass RLS policies.\n',
        );
        console.log('   📝 Action Required:');
        console.log(
          '   Run the SQL migration: CompeteApp/sql/fix_tournament_deletion_security_definer.sql\n',
        );
      }
      return;
    }

    console.log('✅ Archival function returned:', archiveResult);

    // Step 5: Check if tournament was actually deleted
    console.log(
      '\n📋 Step 5: Verifying tournament was deleted from main table...',
    );
    const { data: checkTournament, error: checkError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('id', testTournament.id);

    if (checkError) {
      console.log('⚠️  Error checking tournament:', checkError.message);
    } else if (checkTournament && checkTournament.length > 0) {
      console.log(
        '❌ PROBLEM CONFIRMED: Tournament still exists in tournaments table!',
      );
      console.log('   This means the DELETE operation is being blocked.\n');
      console.log('   🔧 Solution:');
      console.log(
        '   The SQL function needs SECURITY DEFINER to bypass RLS policies.',
      );
      console.log(
        '   Run: CompeteApp/sql/fix_tournament_deletion_security_definer.sql\n',
      );
    } else {
      console.log(
        '✅ Tournament successfully deleted from tournaments table!\n',
      );
    }

    // Step 6: Check if tournament was archived
    console.log('📋 Step 6: Checking if tournament was archived...');
    const { data: archivedTournament, error: archiveCheckError } =
      await supabase
        .from('tournaments_archive')
        .select('*')
        .eq('id', testTournament.id)
        .order('removal_date', { ascending: false })
        .limit(1);

    if (archiveCheckError) {
      console.log('⚠️  Error checking archive:', archiveCheckError.message);
    } else if (archivedTournament && archivedTournament.length > 0) {
      console.log('✅ Tournament found in archive table');
      console.log(`   Archived at: ${archivedTournament[0].removal_date}`);
      console.log(`   Reason: ${archivedTournament[0].removal_reason}\n`);
    } else {
      console.log('⚠️  Tournament NOT found in archive table\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DIAGNOSIS SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');

    const stillInMain = checkTournament && checkTournament.length > 0;
    const inArchive = archivedTournament && archivedTournament.length > 0;

    if (stillInMain && inArchive) {
      console.log('❌ ISSUE CONFIRMED:');
      console.log('   ✅ Tournament IS being archived');
      console.log('   ❌ Tournament is NOT being deleted from main table');
      console.log('\n🔧 ROOT CAUSE:');
      console.log(
        '   RLS policies are blocking the DELETE operation in the SQL function',
      );
      console.log('\n💡 SOLUTION:');
      console.log('   Apply the SQL migration to add SECURITY DEFINER:');
      console.log(
        '   File: CompeteApp/sql/fix_tournament_deletion_security_definer.sql',
      );
      console.log('\n📝 HOW TO APPLY:');
      console.log('   1. Open Supabase Dashboard → SQL Editor');
      console.log('   2. Copy the entire contents of the SQL file');
      console.log('   3. Paste into SQL Editor and click Run');
      console.log('   4. Verify you see "SECURITY DEFINER" in the output');
    } else if (!stillInMain && inArchive) {
      console.log('✅ WORKING CORRECTLY:');
      console.log('   ✅ Tournament archived successfully');
      console.log('   ✅ Tournament deleted from main table');
      console.log('\n🎉 The fix has been applied and is working!');
    } else {
      console.log('⚠️  UNEXPECTED STATE:');
      console.log(`   Tournament in main table: ${stillInMain}`);
      console.log(`   Tournament in archive: ${inArchive}`);
    }

    console.log(
      '═══════════════════════════════════════════════════════════\n',
    );
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseDeletionIssue();
