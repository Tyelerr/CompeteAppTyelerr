const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key',
);

async function testTournamentDeletion() {
  console.log('🧪 Testing Tournament Deletion Process...\n');

  try {
    // Step 1: Get a tournament to test with
    console.log('📋 Step 1: Fetching a tournament to test deletion...');
    const { data: tournaments, error: fetchError } = await supabase
      .from('tournaments')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching tournament:', fetchError);
      return;
    }

    if (!tournaments || tournaments.length === 0) {
      console.log('⚠️  No tournaments found to test deletion');
      return;
    }

    const testTournament = tournaments[0];
    console.log('✅ Found tournament to test:');
    console.log(`   ID: ${testTournament.id}`);
    console.log(`   Name: ${testTournament.tournament_name}`);
    console.log(`   ID Unique Number: ${testTournament.id_unique_number}\n`);

    // Step 2: Check if tournament has likes
    console.log('📋 Step 2: Checking for associated likes...');
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('*')
      .eq('turnament_id', testTournament.id);

    if (likesError) {
      console.error('❌ Error checking likes:', likesError);
    } else {
      console.log(`✅ Found ${likes?.length || 0} likes for this tournament\n`);
    }

    // Step 3: Try archival function
    console.log('📋 Step 3: Testing archival function...');
    try {
      const { data: archiveData, error: archiveError } = await supabase.rpc(
        'archive_tournament_manual_simple',
        {
          tournament_id: testTournament.id,
          admin_user_id: null,
          reason: 'test_deletion',
        },
      );

      if (archiveError) {
        console.log('⚠️  Archival function error:', archiveError.message);
        console.log("   This is expected if the function doesn't exist yet\n");
      } else {
        console.log('✅ Archival function result:', archiveData);
        console.log('   Tournament should be archived\n');

        // Check if tournament still exists
        const { data: checkTournament } = await supabase
          .from('tournaments')
          .select('id')
          .eq('id', testTournament.id);

        if (checkTournament && checkTournament.length > 0) {
          console.log(
            '⚠️  Tournament still exists in tournaments table after archival',
          );
        } else {
          console.log(
            '✅ Tournament successfully removed from tournaments table',
          );
        }
        return;
      }
    } catch (archiveException) {
      console.log(
        '⚠️  Archival function not available:',
        archiveException.message,
      );
      console.log('   Proceeding to test direct deletion\n');
    }

    // Step 4: Test direct deletion (fallback)
    console.log('📋 Step 4: Testing direct deletion fallback...');

    // First delete likes
    console.log('   Deleting likes first...');
    const { error: deleteLikesError } = await supabase
      .from('likes')
      .delete()
      .eq('turnament_id', testTournament.id);

    if (deleteLikesError) {
      console.log('⚠️  Error deleting likes:', deleteLikesError.message);
    } else {
      console.log('✅ Likes deleted successfully');
    }

    // Then delete tournament
    console.log('   Deleting tournament...');
    const { error: deleteTournamentError } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', testTournament.id);

    if (deleteTournamentError) {
      console.error('❌ Error deleting tournament:', deleteTournamentError);
    } else {
      console.log('✅ Tournament deleted successfully');

      // Verify deletion
      const { data: checkTournament } = await supabase
        .from('tournaments')
        .select('id')
        .eq('id', testTournament.id);

      if (checkTournament && checkTournament.length > 0) {
        console.log('❌ Tournament still exists in tournaments table!');
      } else {
        console.log(
          '✅ Tournament successfully removed from tournaments table',
        );
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTournamentDeletion();
