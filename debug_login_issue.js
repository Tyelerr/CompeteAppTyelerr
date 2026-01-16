// Debug script to identify login issues
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLoginIssue() {
  console.log('=== Debugging Login Issue ===\n');

  try {
    // 1. Check if we can access profiles table at all
    console.log('1. Testing basic profiles table access:');
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, user_name, status, role')
      .limit(5);

    if (fetchError) {
      console.error('❌ Cannot access profiles table:', fetchError);
      console.log('This suggests RLS policy issues or permissions problems');
      return;
    }

    console.log('✅ Can access profiles table');
    console.log('Sample profiles:', allProfiles);

    // 2. Test username lookup for Tmoneyhill
    console.log('\n2. Testing Tmoneyhill username lookup:');
    const { data: tmoneyhillProfile, error: tmoneyhillError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('user_name', 'Tmoneyhill')
      .neq('status', 'deleted')
      .maybeSingle();

    if (tmoneyhillError) {
      console.error('❌ Error looking up Tmoneyhill:', tmoneyhillError);
    } else if (tmoneyhillProfile) {
      console.log('✅ Found Tmoneyhill profile:', {
        username: tmoneyhillProfile.user_name,
        email: tmoneyhillProfile.email,
        status: tmoneyhillProfile.status,
        role: tmoneyhillProfile.role,
      });
    } else {
      console.log('❌ Tmoneyhill profile not found');
    }

    // 3. Test other usernames
    console.log('\n3. Testing other usernames:');
    const otherUsernames = ['testuser', 'admin', 'user1']; // Add actual usernames you're trying to login with

    for (const username of otherUsernames) {
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id, user_name, email, status, role')
        .ilike('user_name', username)
        .neq('status', 'deleted')
        .maybeSingle();

      if (userError) {
        console.log(`❌ Error looking up ${username}:`, userError);
      } else if (userProfile) {
        console.log(`✅ Found ${username}:`, {
          username: userProfile.user_name,
          email: userProfile.email,
          status: userProfile.status,
          role: userProfile.role,
        });
      } else {
        console.log(`❌ ${username} not found`);
      }
    }

    // 4. Check for deleted or problematic accounts
    console.log('\n4. Checking for deleted or problematic accounts:');
    const { data: deletedProfiles, error: deletedError } = await supabase
      .from('profiles')
      .select('id, user_name, email, status')
      .eq('status', 'deleted')
      .limit(5);

    if (!deletedError && deletedProfiles) {
      console.log('Deleted profiles found:', deletedProfiles.length);
    }

    // 5. Check RLS policies
    console.log('\n5. Checking if RLS is enabled:');
    // This would need to be run as a database admin
    console.log('Run this SQL query as admin to check RLS:');
    console.log(
      "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';",
    );
  } catch (error) {
    console.error('Debug script failed:', error);
  }
}

// Run the debug
debugLoginIssue();
