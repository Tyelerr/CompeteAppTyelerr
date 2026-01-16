/**
 * Test the actual login flow to identify where it's failing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginFlow() {
  console.log('\n=== TESTING ACTUAL LOGIN FLOW ===\n');

  // Test with the users we saw in the diagnostic
  const testCases = [
    {
      username: 'barowner',
      email: 'barowner@test.com',
      description: 'Bar Owner',
    },
    {
      username: 'TD1',
      email: 'td@test.com',
      description: 'Tournament Director 1',
    },
    { username: 'user', email: 'user@test.com', description: 'Regular User' },
  ];

  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.description} ---`);
    console.log(`Username: ${testCase.username}`);
    console.log(`Email: ${testCase.email}`);

    // Step 1: Simulate the SignIn function's username lookup
    console.log('\nStep 1: Fetching all profiles (as anon user)...');
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1000);

    if (fetchError) {
      console.log('❌ FAILED to fetch profiles:', fetchError.message);
      console.log('   This is the problem! Anon users cannot read profiles.');
      continue;
    }

    console.log(`✅ Successfully fetched ${allProfiles?.length || 0} profiles`);

    // Step 2: Find user by username (case-insensitive)
    const foundUser = allProfiles?.find((user) => {
      if (user.status === 'deleted') return false;
      const dbUsername = (user.user_name || '').toLowerCase();
      const inputUsername = testCase.username.toLowerCase();
      return dbUsername === inputUsername;
    });

    if (foundUser) {
      console.log(`✅ Found user by username: ${foundUser.user_name}`);
      console.log(`   Email to use for auth: ${foundUser.email}`);
    } else {
      console.log(`❌ Username "${testCase.username}" not found in profiles`);
      console.log('   Would try to authenticate with username as email');
    }

    // Step 3: Test authentication (without actual password)
    console.log('\nStep 3: Would authenticate with:');
    console.log(`   Email: ${foundUser ? foundUser.email : testCase.username}`);
    console.log(`   Password: [provided by user]`);
    console.log('   (Skipping actual auth to avoid lockouts)');
  }

  console.log('\n=== TEST COMPLETE ===\n');
  console.log('Summary:');
  console.log('- If Step 1 fails: RLS policies are blocking anon access');
  console.log('- If Step 2 fails: Username not in database or case mismatch');
  console.log('- If Step 3 fails: Wrong password or email not confirmed');
}

testLoginFlow().catch(console.error);
