// Test script to debug username and email validation
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testValidation() {
  console.log('=== Testing Username and Email Validation ===');

  try {
    // First, let's see what's in the profiles table
    console.log('\n1. Fetching all profiles to see existing data:');
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, user_name, status')
      .limit(10);

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      return;
    }

    console.log('Found profiles:', allProfiles);

    if (allProfiles && allProfiles.length > 0) {
      const testProfile = allProfiles[0];
      console.log('\n2. Testing with existing profile:', testProfile);

      // Test username validation
      if (testProfile.user_name) {
        console.log(
          '\n3. Testing username validation with existing username:',
          testProfile.user_name,
        );

        const { data: usernameCheck, error: usernameError } = await supabase
          .from('profiles')
          .select('id, user_name')
          .ilike('user_name', testProfile.user_name)
          .neq('status', 'deleted')
          .limit(1);

        console.log('Username check result:', {
          data: usernameCheck,
          error: usernameError,
        });
        console.log(
          'Should find match:',
          usernameCheck && usernameCheck.length > 0,
        );
      }

      // Test email validation
      if (testProfile.email) {
        console.log(
          '\n4. Testing email validation with existing email:',
          testProfile.email,
        );

        const { data: emailCheck, error: emailError } = await supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', testProfile.email)
          .neq('status', 'deleted')
          .limit(1);

        console.log('Email check result:', {
          data: emailCheck,
          error: emailError,
        });
        console.log('Should find match:', emailCheck && emailCheck.length > 0);
      }
    }

    // Test with non-existent data
    console.log('\n5. Testing with non-existent username:');
    const { data: noUsernameCheck, error: noUsernameError } = await supabase
      .from('profiles')
      .select('id, user_name')
      .ilike('user_name', 'nonexistentuser12345')
      .neq('status', 'deleted')
      .limit(1);

    console.log('Non-existent username check:', {
      data: noUsernameCheck,
      error: noUsernameError,
    });
    console.log(
      'Should be empty:',
      !noUsernameCheck || noUsernameCheck.length === 0,
    );

    console.log('\n6. Testing with non-existent email:');
    const { data: noEmailCheck, error: noEmailError } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', 'nonexistent@test12345.com')
      .neq('status', 'deleted')
      .limit(1);

    console.log('Non-existent email check:', {
      data: noEmailCheck,
      error: noEmailError,
    });
    console.log('Should be empty:', !noEmailCheck || noEmailCheck.length === 0);
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testValidation();
