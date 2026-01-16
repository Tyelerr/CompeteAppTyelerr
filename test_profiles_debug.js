// Debug script to test the exact validation logic
import { supabase } from './ApiSupabase/supabase';

async function testProfilesDebug() {
  console.log('=== PROFILES DEBUG TEST ===');

  try {
    // Test 1: Get ALL profiles without any filters
    console.log('1. Fetching ALL profiles (no filters)...');
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, user_name, email, status');

    console.log('Total profiles found:', allProfiles?.length || 0);
    console.log('Error:', allError);

    if (allProfiles && allProfiles.length > 0) {
      console.log('First 5 profiles:');
      allProfiles.slice(0, 5).forEach((profile, index) => {
        console.log(
          `  ${index + 1}. "${profile.user_name}" - ${profile.email} (status: ${
            profile.status
          })`,
        );
      });
    }

    // Test 2: Test specific username searches
    console.log('\n2. Testing specific username searches...');
    const testUsernames = ['tyelerr', 'user1', 'Bobs', 'MetroSportBar'];

    for (const username of testUsernames) {
      const { data: results, error } = await supabase
        .from('profiles')
        .select('id, user_name, email, status')
        .ilike('user_name', username);

      console.log(`Search "${username}": ${results?.length || 0} results`);
      if (results && results.length > 0) {
        results.forEach((result) => {
          console.log(
            `  Found: "${result.user_name}" - ${result.email} (status: ${result.status})`,
          );
        });
      }
    }

    // Test 3: Test the exact validation logic
    console.log('\n3. Testing validation logic for "tyelerr"...');

    const testUsername = 'tyelerr';
    const { data: validationProfiles, error: validationError } = await supabase
      .from('profiles')
      .select('id, user_name, status');

    console.log(
      'Validation query - Total profiles:',
      validationProfiles?.length || 0,
    );

    if (validationProfiles) {
      const conflictingUsers = validationProfiles.filter((user) => {
        // Skip deleted users
        if (user.status === 'deleted') return false;

        // Case-insensitive username comparison
        const dbUsername = (user.user_name || '').toLowerCase();
        const inputUsername = testUsername.toLowerCase();

        return dbUsername === inputUsername;
      });

      console.log('Conflicting users for "tyelerr":', conflictingUsers.length);
      if (conflictingUsers.length > 0) {
        conflictingUsers.forEach((user) => {
          console.log(
            `  Conflict: "${user.user_name}" (status: ${user.status})`,
          );
        });
      }
    }

    // Test 4: Check status values
    console.log('\n4. Checking status values...');
    if (allProfiles) {
      const statusCounts = {};
      allProfiles.forEach((profile) => {
        const status = profile.status || 'null';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      console.log('Status distribution:', statusCounts);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export for use in React Native
export { testProfilesDebug };

// Run immediately if in Node.js environment
if (typeof window === 'undefined') {
  testProfilesDebug();
}
