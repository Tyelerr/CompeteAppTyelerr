// Test script to check database connection and profiles table
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('=== Testing Database Connection ===');

  try {
    // Test 1: Basic connection test
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }

    console.log('✅ Database connection successful');
    console.log('📊 Total profiles in database:', testData);

    // Test 2: Fetch first 5 profiles to see what's there
    console.log('\n2. Fetching sample profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_name, email, status')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log('📋 Sample profiles found:');
    profiles.forEach((profile, index) => {
      console.log(
        `   ${index + 1}. Username: "${profile.user_name}", Email: "${
          profile.email
        }", Status: "${profile.status}"`,
      );
    });

    // Test 3: Check for specific usernames you mentioned
    console.log('\n3. Checking for specific usernames...');
    const testUsernames = ['tmoneyhill', 'Tmoneyhill', 'TMONEYHILL'];

    for (const username of testUsernames) {
      const { data: userCheck, error: userError } = await supabase
        .from('profiles')
        .select('id, user_name, email, status')
        .ilike('user_name', username)
        .limit(1);

      if (userError) {
        console.error(`❌ Error checking username "${username}":`, userError);
      } else {
        console.log(
          `🔍 Username "${username}": ${
            userCheck.length > 0 ? 'FOUND' : 'NOT FOUND'
          }`,
        );
        if (userCheck.length > 0) {
          console.log(`   Found: ${JSON.stringify(userCheck[0])}`);
        }
      }
    }

    // Test 4: Check for specific emails you mentioned
    console.log('\n4. Checking for specific emails...');
    const testEmails = ['tyelerr95@gmail.com', 'tyelerr@yahoo.com'];

    for (const email of testEmails) {
      const { data: emailCheck, error: emailError } = await supabase
        .from('profiles')
        .select('id, user_name, email, status')
        .ilike('email', email)
        .limit(1);

      if (emailError) {
        console.error(`❌ Error checking email "${email}":`, emailError);
      } else {
        console.log(
          `📧 Email "${email}": ${
            emailCheck.length > 0 ? 'FOUND' : 'NOT FOUND'
          }`,
        );
        if (emailCheck.length > 0) {
          console.log(`   Found: ${JSON.stringify(emailCheck[0])}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDatabaseConnection();
