const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTournamentDisplay() {
  console.log('=== DEBUGGING TOURNAMENT DISPLAY ISSUE ===\n');

  // 1. Check if tmoneyhill user exists and their role
  console.log('1. Checking tmoneyhill user profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'tmoneyhill')
    .single();

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError);
  } else if (profile) {
    console.log('✅ User found:');
    console.log(`   Username: ${profile.username}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   User ID: ${profile.user_id}`);
    console.log(`   ZIP Code: ${profile.zip_code}`);
    console.log(`   Home State: ${profile.home_state}`);
    console.log(`   Home City: ${profile.home_city}`);
  } else {
    console.log('❌ User not found');
    return;
  }

  console.log('\n2. Checking total tournaments in database...');
  const { count: totalCount, error: totalError } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.error('❌ Error counting tournaments:', totalError);
  } else {
    console.log(`✅ Total tournaments in database: ${totalCount}`);
  }

  console.log('\n3. Checking tournaments by status...');
  const statuses = ['active', 'archived', 'cancelled', 'completed'];
  for (const status of statuses) {
    const { count, error } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (!error) {
      console.log(`   ${status}: ${count || 0} tournaments`);
    }
  }

  // Check for null status
  const { count: nullStatusCount, error: nullError } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })
    .is('status', null);

  if (!nullError) {
    console.log(`   null status: ${nullStatusCount || 0} tournaments`);
  }

  console.log('\n4. Checking tournaments by date...');
  const today = new Date().toISOString().split('T')[0];

  const { count: futureCount, error: futureError } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })
    .gte('start_date', today);

  if (!futureError) {
    console.log(
      `   Future/Today tournaments (>= ${today}): ${futureCount || 0}`,
    );
  }

  const { count: pastCount, error: pastError } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })
    .lt('start_date', today);

  if (!pastError) {
    console.log(`   Past tournaments (< ${today}): ${pastCount || 0}`);
  }

  console.log(
    '\n5. Checking what query returns with current filters (active + future)...',
  );
  const { data: currentQuery, error: currentError } = await supabase
    .from('tournaments')
    .select(
      `
      *,
      profiles(*),
      venues(*)
    `,
    )
    .eq('status', 'active')
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(10);

  if (currentError) {
    console.error('❌ Error with current query:', currentError);
  } else {
    console.log(
      `✅ Current query returns: ${currentQuery?.length || 0} tournaments`,
    );
    if (currentQuery && currentQuery.length > 0) {
      console.log('\n   Sample tournaments:');
      currentQuery.slice(0, 3).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.tournament_name}`);
        console.log(`      Status: ${t.status}`);
        console.log(`      Date: ${t.start_date}`);
        console.log(`      Venue: ${t.venue}`);
      });
    }
  }

  console.log(
    '\n6. Checking what query returns WITHOUT status/date filters...',
  );
  const { data: allQuery, error: allError } = await supabase
    .from('tournaments')
    .select(
      `
      *,
      profiles(*),
      venues(*)
    `,
    )
    .order('start_date', { ascending: false })
    .limit(10);

  if (allError) {
    console.error('❌ Error with all query:', allError);
  } else {
    console.log(
      `✅ Query without filters returns: ${allQuery?.length || 0} tournaments`,
    );
    if (allQuery && allQuery.length > 0) {
      console.log('\n   Sample tournaments:');
      allQuery.slice(0, 3).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.tournament_name}`);
        console.log(`      Status: ${t.status || 'null'}`);
        console.log(`      Date: ${t.start_date}`);
        console.log(`      Venue: ${t.venue}`);
      });
    }
  }

  console.log('\n7. Checking RLS policies on tournaments table...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('pg_policies')
    .eq('tablename', 'tournaments');

  if (policiesError) {
    console.log('⚠️  Could not fetch RLS policies (may need admin access)');
  } else if (policies) {
    console.log(
      `✅ Found ${policies.length} RLS policies on tournaments table`,
    );
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===\n');
  console.log('LIKELY ISSUES:');
  console.log(
    '1. If "Current query returns: 0" but "Query without filters" shows tournaments:',
  );
  console.log(
    '   → Tournaments may have null/incorrect status or are in the past',
  );
  console.log('2. If both queries return 0:');
  console.log('   → RLS policies may be blocking access for this user role');
  console.log('3. If master-administrator should see ALL tournaments:');
  console.log(
    '   → Need to modify FetchTournaments_Filters to bypass filters for admins',
  );
}

debugTournamentDisplay()
  .then(() => {
    console.log('\n✅ Debug script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug script failed:', error);
    process.exit(1);
  });
