// Debug script to test registration validation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testValidation() {
  console.log('=== Testing Registration Validation ===\n');

  // Test 1: Try to fetch profiles as anonymous user
  console.log('Test 1: Fetching profiles as anonymous user...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, user_name, email, status')
    .limit(10);

  if (profilesError) {
    console.error('❌ ERROR fetching profiles:', profilesError.message);
    console.error('This is likely the root cause of the validation errors!\n');
  } else {
    console.log('✅ Successfully fetched profiles:', profiles?.length || 0);
    console.log(
      'Sample profiles:',
      profiles?.slice(0, 3).map((p) => ({
        username: p.user_name,
        email: p.email,
      })),
    );
    console.log('');
  }

  // Test 2: Check username availability
  console.log('Test 2: Checking username availability for "testuser"...');
  try {
    const { data: usernameCheck, error: usernameError } = await supabase
      .from('profiles')
      .select('id, user_name')
      .ilike('user_name', 'testuser')
      .limit(1);

    if (usernameError) {
      console.error('❌ ERROR checking username:', usernameError.message);
    } else {
      console.log('✅ Username check successful');
      console.log('Found matches:', usernameCheck?.length || 0);
    }
  } catch (error) {
    console.error('❌ EXCEPTION checking username:', error.message);
  }
  console.log('');

  // Test 3: Check email availability
  console.log('Test 3: Checking email availability for "test@example.com"...');
  try {
    const { data: emailCheck, error: emailError } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', 'test@example.com')
      .limit(1);

    if (emailError) {
      console.error('❌ ERROR checking email:', emailError.message);
    } else {
      console.log('✅ Email check successful');
      console.log('Found matches:', emailCheck?.length || 0);
    }
  } catch (error) {
    console.error('❌ EXCEPTION checking email:', error.message);
  }
  console.log('');

  // Test 4: Check current RLS policies
  console.log('Test 4: Checking RLS policies on profiles table...');
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'profiles');

  if (policiesError) {
    console.log('Could not fetch policies (this is normal)');
  } else {
    console.log('Policies found:', policies?.length || 0);
  }

  console.log('\n=== Diagnosis Complete ===');
  console.log('\nRECOMMENDATION:');
  console.log('If Test 1 failed, you need to update RLS policies to allow');
  console.log(
    'anonymous users to read basic profile information (username, email)',
  );
  console.log('for validation purposes during registration.');
}

testValidation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
