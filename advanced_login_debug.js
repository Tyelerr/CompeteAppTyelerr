// Advanced login debugging script
// This script simulates the exact login process to identify where it fails

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the exact SignIn function from CrudUser.tsx
async function simulateSignIn(username, password) {
  console.log(`\n=== SIMULATING LOGIN FOR: ${username} ===`);

  // Input validation (from CrudUser.tsx)
  if (!username || !password) {
    console.log('❌ STEP 1 FAILED: Missing username or password');
    return { data: null, error: 'Missing username or password' };
  }
  console.log('✅ STEP 1 PASSED: Input validation');

  let emailTemporary = username;

  try {
    // STEP 2: Try to find user by username (case-insensitive)
    console.log('\n--- STEP 2: Username lookup ---');
    console.log(`Looking up username: "${username}"`);

    const { data: userByUsername, error: ErrorUserByUserName } = await supabase
      .from('profiles')
      .select('*')
      .ilike('user_name', username)
      .neq('status', 'deleted')
      .maybeSingle();

    console.log('Username lookup result:', {
      found: !!userByUsername,
      error: ErrorUserByUserName,
      data: userByUsername
        ? {
            id: userByUsername.id,
            username: userByUsername.user_name,
            email: userByUsername.email,
            status: userByUsername.status,
            role: userByUsername.role,
          }
        : null,
    });

    if (ErrorUserByUserName) {
      console.log('❌ STEP 2 ERROR: Username lookup failed');
      console.log('Error details:', ErrorUserByUserName);
      // Continue with email fallback
    }

    if (userByUsername && !ErrorUserByUserName) {
      emailTemporary = userByUsername.email;
      console.log('✅ STEP 2 PASSED: Found user by username');
      console.log(`Using email for auth: ${emailTemporary}`);
    } else {
      emailTemporary = username;
      console.log(
        '⚠️ STEP 2 FALLBACK: No user found by username, treating input as email',
      );
      console.log(`Using input as email: ${emailTemporary}`);
    }

    // STEP 3: Attempt authentication with Supabase
    console.log('\n--- STEP 3: Supabase authentication ---');
    console.log(`Attempting auth with email: ${emailTemporary}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailTemporary,
      password: password,
    });

    console.log('Authentication result:', {
      success: !!data?.user,
      error: error?.message || null,
      user_id: data?.user?.id || null,
    });

    if (error) {
      console.log('❌ STEP 3 FAILED: Authentication failed');
      console.log('Auth error:', error.message);
      return { data: null, error };
    }
    console.log('✅ STEP 3 PASSED: Authentication successful');

    // STEP 4: Fetch user profile data
    console.log('\n--- STEP 4: Fetch profile data ---');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.log('❌ STEP 4 FAILED: Profile fetch failed');
      console.log('Profile error:', profileError);
      return { data: null, error: profileError };
    }

    console.log('✅ STEP 4 PASSED: Profile data fetched');
    console.log('Profile data:', {
      id: profileData.id,
      username: profileData.user_name,
      email: profileData.email,
      status: profileData.status,
      role: profileData.role,
    });

    // STEP 5: Check if user is deleted
    if (profileData && profileData.status === 'deleted') {
      console.log('❌ STEP 5 FAILED: User account is deleted');
      return { error: 'deleted' };
    }
    console.log('✅ STEP 5 PASSED: User account is active');

    console.log('\n🎉 LOGIN SIMULATION SUCCESSFUL!');
    return { user: profileData, data: data.user, error: null };
  } catch (error) {
    console.log('\n💥 EXCEPTION OCCURRED:', error.message || error);
    return { data: null, error };
  }
}

// Test different scenarios
async function runAdvancedDiagnostics() {
  console.log('=== ADVANCED LOGIN DIAGNOSTICS ===\n');

  // Test 1: Check database connectivity
  console.log('TEST 1: Database connectivity');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:', error);
      return;
    }
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.log('❌ Database connection exception:', error);
    return;
  }

  // Test 2: Check RLS policies
  console.log('TEST 2: RLS Policy check');
  try {
    const { data: allProfiles, error } = await supabase
      .from('profiles')
      .select('id, user_name, email, status, role')
      .limit(5);

    if (error) {
      console.log('❌ RLS blocking profile access:', error);
      console.log('This is likely the main issue!');
    } else {
      console.log('✅ Can access profiles table');
      console.log(`Found ${allProfiles?.length || 0} profiles`);
      if (allProfiles && allProfiles.length > 0) {
        console.log(
          'Sample profiles:',
          allProfiles.map((p) => ({
            username: p.user_name,
            email: p.email,
            status: p.status,
            role: p.role,
          })),
        );
      }
    }
  } catch (error) {
    console.log('❌ Exception accessing profiles:', error);
  }
  console.log('');

  // Test 3: Simulate login for Tmoneyhill (working account)
  await simulateSignIn('Tmoneyhill', 'dummy_password');

  // Test 4: Simulate login for other usernames
  const testUsernames = ['testuser', 'admin', 'user1', 'demo']; // Add actual usernames you're trying

  for (const username of testUsernames) {
    await simulateSignIn(username, 'dummy_password');
  }

  // Test 5: Check for specific issues
  console.log('\n=== ADDITIONAL CHECKS ===');

  // Check for case sensitivity issues
  console.log('\nTEST 5: Case sensitivity check');
  try {
    const { data: exactCase, error: exactError } = await supabase
      .from('profiles')
      .select('user_name, email')
      .eq('user_name', 'Tmoneyhill')
      .limit(1);

    const { data: lowerCase, error: lowerError } = await supabase
      .from('profiles')
      .select('user_name, email')
      .ilike('user_name', 'tmoneyhill')
      .limit(1);

    console.log('Exact case match:', exactCase);
    console.log('Case-insensitive match:', lowerCase);
  } catch (error) {
    console.log('Case sensitivity test failed:', error);
  }

  // Check for deleted accounts
  console.log('\nTEST 6: Deleted accounts check');
  try {
    const { data: deletedAccounts, error } = await supabase
      .from('profiles')
      .select('user_name, email, status')
      .eq('status', 'deleted')
      .limit(5);

    console.log('Deleted accounts found:', deletedAccounts?.length || 0);
    if (deletedAccounts && deletedAccounts.length > 0) {
      console.log('Deleted accounts:', deletedAccounts);
    }
  } catch (error) {
    console.log('Deleted accounts check failed:', error);
  }

  console.log('\n=== DIAGNOSTICS COMPLETE ===');
  console.log('\nNext steps:');
  console.log('1. If RLS is blocking access, run the SQL fixes');
  console.log('2. If authentication fails, check Supabase auth settings');
  console.log('3. If profiles are missing, check data integrity');
}

// Run the diagnostics
runAdvancedDiagnostics();
