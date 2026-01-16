/**
 * Test script to diagnose login issues with username and email
 * This will help identify if the problem is in the code or database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('\n=== LOGIN DIAGNOSTIC TEST ===\n');

  // Test 1: Check if we can fetch profiles (RLS policy test)
  console.log('Test 1: Checking RLS policies...');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, user_name, email, role, status')
      .limit(5);

    if (error) {
      console.log(
        '❌ Cannot fetch profiles (RLS might be blocking):',
        error.message,
      );
    } else {
      console.log(`✅ Can fetch ${profiles?.length || 0} profiles`);
      if (profiles && profiles.length > 0) {
        console.log('Sample profiles:');
        profiles.forEach((p) => {
          console.log(
            `  - Username: ${p.user_name}, Email: ${p.email}, Role: ${
              p.role
            }, Status: ${p.status || 'null'}`,
          );
        });
      }
    }
  } catch (err) {
    console.log('❌ Exception fetching profiles:', err.message);
  }

  console.log('\n---\n');

  // Test 2: Try to login with a test account
  console.log('Test 2: Attempting login with email...');
  console.log('Please enter test credentials:');

  // For automated testing, you can hardcode test credentials here
  // const testEmail = 'test@example.com';
  // const testPassword = 'testpassword123';

  console.log('\n⚠️  To test login, please provide:');
  console.log('1. A valid email address from your database');
  console.log('2. The password for that account');
  console.log('\nYou can modify this script to include test credentials.\n');

  // Test 3: Check SignIn function logic
  console.log('Test 3: Testing username lookup logic...');

  const testUsername = 'testuser'; // Replace with actual username
  console.log(`Looking up username: ${testUsername}`);

  try {
    // Fetch all profiles to test client-side filtering
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1000);

    if (fetchError) {
      console.log('❌ Error fetching profiles:', fetchError.message);
    } else {
      console.log(`✅ Fetched ${allProfiles?.length || 0} profiles`);

      // Test case-insensitive username search
      const foundUser = allProfiles?.find((user) => {
        if (user.status === 'deleted') return false;
        const dbUsername = (user.user_name || '').toLowerCase();
        const inputUsername = testUsername.toLowerCase();
        return dbUsername === inputUsername;
      });

      if (foundUser) {
        console.log('✅ Username lookup works!');
        console.log(
          `   Found user: ${foundUser.user_name} (${foundUser.email})`,
        );
      } else {
        console.log(`❌ Username "${testUsername}" not found`);
        console.log('   Available usernames (first 10):');
        allProfiles?.slice(0, 10).forEach((p) => {
          if (p.user_name && p.status !== 'deleted') {
            console.log(`   - ${p.user_name}`);
          }
        });
      }
    }
  } catch (err) {
    console.log('❌ Exception during username lookup:', err.message);
  }

  console.log('\n---\n');

  // Test 4: Check RLS policies in database
  console.log('Test 4: Checking database RLS policies...');
  console.log('Run this SQL in your Supabase SQL Editor:\n');
  console.log(`
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
  `);
  console.log('\nExpected policies:');
  console.log('1. "Users can view own profile" - FOR SELECT');
  console.log('2. "Admins and bar owners can view all profiles" - FOR SELECT');

  console.log('\n=== END OF DIAGNOSTIC TEST ===\n');
}

// Run the test
testLogin().catch(console.error);
