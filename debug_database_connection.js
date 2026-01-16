// Debug script to check database connection and environment
import { supabase } from './ApiSupabase/supabase';

async function debugDatabaseConnection() {
  console.log('=== DATABASE CONNECTION DEBUG ===');

  try {
    // Test 1: Check if we can connect and get basic info
    console.log('1. Testing database connection...');

    const { data: testConnection, error: connectionError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return;
    }

    console.log('✅ Database connected successfully');
    console.log('📊 Total profiles in connected database:', testConnection);

    // Test 2: Get sample data to identify which database we're connected to
    console.log('\n2. Fetching sample profiles to identify database...');

    const { data: sampleProfiles, error: sampleError } = await supabase
      .from('profiles')
      .select('id, user_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sampleError) {
      console.error('❌ Error fetching sample profiles:', sampleError);
      return;
    }

    if (sampleProfiles && sampleProfiles.length > 0) {
      console.log('📋 Sample profiles in connected database:');
      sampleProfiles.forEach((profile, index) => {
        console.log(
          `   ${index + 1}. "${profile.user_name}" - ${profile.email}`,
        );
      });
    } else {
      console.log('📭 No profiles found in connected database');
      console.log(
        "🔍 This suggests you're connected to a development/empty database",
      );
    }

    // Test 3: Search for the specific users you mentioned
    console.log('\n3. Searching for specific users you mentioned...');

    const searchUsers = [
      { username: 'tmoneyhill', email: 'tyelerr95@gmail.com' },
      { username: 'tyelerr', email: 'tyelerr@yahoo.com' },
    ];

    for (const user of searchUsers) {
      // Search by username
      const { data: usernameResults, error: usernameError } = await supabase
        .from('profiles')
        .select('user_name, email')
        .ilike('user_name', user.username);

      // Search by email
      const { data: emailResults, error: emailError } = await supabase
        .from('profiles')
        .select('user_name, email')
        .ilike('email', user.email);

      console.log(
        `🔍 Username "${user.username}": ${
          usernameResults?.length || 0
        } matches`,
      );
      console.log(
        `📧 Email "${user.email}": ${emailResults?.length || 0} matches`,
      );

      if (usernameResults && usernameResults.length > 0) {
        console.log(`   Username found: ${JSON.stringify(usernameResults[0])}`);
      }
      if (emailResults && emailResults.length > 0) {
        console.log(`   Email found: ${JSON.stringify(emailResults[0])}`);
      }
    }

    // Test 4: Environment detection
    console.log('\n4. Environment information...');
    console.log('🌍 Environment variables being used:');
    console.log(
      '   EXPO_PUBLIC_SUPABASE_URL:',
      process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
    );
    console.log(
      '   EXPO_PUBLIC_SUPABASE_ANON_KEY:',
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    );

    // Show partial URL to help identify which database (without exposing full credentials)
    if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const urlParts = url.split('.');
      if (urlParts.length > 0) {
        console.log(
          '   Database identifier:',
          urlParts[0].replace('https://', ''),
        );
      }
    }
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Export for use in React Native
export { debugDatabaseConnection };

// Run immediately if in Node.js environment
if (typeof window === 'undefined') {
  debugDatabaseConnection();
}
