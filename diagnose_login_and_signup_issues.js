const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './CompeteApp/.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Diagnosing Login and SignUp Issues ===\n');

// Check if environment variables are loaded
console.log('Environment Variables Check:');
console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
console.log(
  'SUPABASE_URL value:',
  supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
);
console.log(
  'SUPABASE_ANON_KEY value:',
  supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING',
);
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Environment variables are missing!');
  console.error(
    "This is why you're getting \"Cannot read property 'auth' of undefined\"",
  );
  console.error('\nPlease check:');
  console.error('1. Does CompeteApp/.env file exist?');
  console.error(
    '2. Does it contain EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY?',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  try {
    console.log('=== Testing Supabase Connection ===');

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Cannot connect to Supabase:', testError.message);
      return;
    }

    console.log('✅ Supabase connection successful\n');

    // 1. Check your user (tmoneyhill)
    console.log('=== Checking Your User (tmoneyhill) ===');
    const { data: yourUser, error: yourUserError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('user_name', 'tmoneyhill')
      .maybeSingle();

    if (yourUserError) {
      console.error('Error fetching your user:', yourUserError);
    } else if (yourUser) {
      console.log('✅ Found your user:');
      console.log('  ID:', yourUser.id);
      console.log('  Username:', yourUser.user_name);
      console.log('  Email:', yourUser.email);
      console.log('  Status:', yourUser.status || 'active');
      console.log('  Role:', yourUser.role);
      console.log('  Created:', yourUser.created_at);
      console.log('');
    } else {
      console.log('❌ Your user not found in profiles table');
      console.log('');
    }

    // 2. Check a few other users for comparison
    console.log('=== Checking Other Users (for comparison) ===');
    const { data: otherUsers, error: otherUsersError } = await supabase
      .from('profiles')
      .select('id, user_name, email, status, created_at')
      .neq('status', 'deleted')
      .limit(5)
      .order('created_at', { ascending: false });

    if (otherUsersError) {
      console.error('Error fetching other users:', otherUsersError);
    } else if (otherUsers && otherUsers.length > 0) {
      console.log(`Found ${otherUsers.length} recent users:`);
      otherUsers.forEach((user, index) => {
        console.log(`\n  User ${index + 1}:`);
        console.log('    Username:', user.user_name);
        console.log('    Email:', user.email);
        console.log('    Status:', user.status || 'active');
        console.log('    Created:', user.created_at);
      });
      console.log('');
    }

    // 3. Test login with your username
    console.log('=== Testing Login with Username "tmoneyhill" ===');

    // First, get the email for tmoneyhill
    const { data: loginUser, error: loginUserError } = await supabase
      .from('profiles')
      .select('email, user_name, status')
      .ilike('user_name', 'tmoneyhill')
      .neq('status', 'deleted')
      .limit(1)
      .maybeSingle();

    if (loginUserError) {
      console.error('❌ Error looking up username:', loginUserError);
    } else if (loginUser) {
      console.log('✅ Username lookup successful:');
      console.log('  Found username:', loginUser.user_name);
      console.log('  Email to use for login:', loginUser.email);
      console.log('  Status:', loginUser.status || 'active');
      console.log('');
    } else {
      console.log('❌ Username "tmoneyhill" not found in database');
      console.log('');
    }

    // 4. Test with another username
    console.log('=== Testing Login with Another Username ===');
    if (otherUsers && otherUsers.length > 0) {
      const testUsername = otherUsers[0].user_name;
      console.log('Testing with username:', testUsername);

      const { data: testLoginUser, error: testLoginError } = await supabase
        .from('profiles')
        .select('email, user_name, status')
        .ilike('user_name', testUsername)
        .neq('status', 'deleted')
        .limit(1)
        .maybeSingle();

      if (testLoginError) {
        console.error('❌ Error looking up test username:', testLoginError);
      } else if (testLoginUser) {
        console.log('✅ Test username lookup successful:');
        console.log('  Found username:', testLoginUser.user_name);
        console.log('  Email to use for login:', testLoginUser.email);
        console.log('');
      }
    }

    // 5. Check RLS policies on profiles table
    console.log('=== Checking RLS Policies ===');
    const { data: policies, error: policiesError } = await supabase.rpc(
      'check_username_available',
      { username_to_check: 'test_user_12345' },
    );

    if (policiesError) {
      console.error('❌ RLS function test failed:', policiesError.message);
      console.log('This might indicate RLS policy issues');
    } else {
      console.log('✅ RLS function working correctly');
    }
    console.log('');

    // 6. Check auth.users table access
    console.log('=== Checking Auth Users Table ===');
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.log('No current user session (expected if not logged in)');
    } else if (currentUser) {
      console.log('Current authenticated user:', currentUser.email);
    } else {
      console.log('No current user session');
    }
    console.log('');

    console.log('=== Diagnosis Complete ===');
    console.log('\nKey Findings:');
    console.log(
      "1. If environment variables are missing, that's why auth is undefined",
    );
    console.log(
      '2. If username lookup works for tmoneyhill but not others, check user_name casing',
    );
    console.log('3. If RLS function fails, database policies need to be fixed');
  } catch (error) {
    console.error('❌ Unexpected error during diagnosis:', error);
    console.error('Error details:', error.message);
  }
}

diagnose();
