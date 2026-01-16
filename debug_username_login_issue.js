// Debug script to check username storage and login issue
// Run with: node CompeteApp/debug_username_login_issue.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugUsernameLogin() {
  console.log('\n=== Debugging Username Login Issue ===\n');

  // Check how usernames are stored
  console.log('Checking username storage for tbar and tmoneyhill...\n');

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_name, email, status')
      .or('user_name.ilike.%tbar%,user_name.ilike.%tmoneyhill%')
      .limit(10);

    if (error) {
      console.log('❌ Error fetching profiles:', error.message);
      return;
    }

    console.log('Found profiles:');
    profiles.forEach((p) => {
      console.log(
        `  Username: "${p.user_name}" | Email: "${p.email}" | Status: ${
          p.status || 'null'
        }`,
      );
    });

    // Test case-insensitive lookup for "tbar"
    console.log('\n--- Testing lookup for "tbar" (lowercase) ---');
    const { data: tbarLower, error: tbarLowerError } = await supabase
      .from('profiles')
      .select('user_name, email, status')
      .ilike('user_name', 'tbar')
      .neq('status', 'deleted')
      .limit(1)
      .maybeSingle();

    if (tbarLowerError) {
      console.log('❌ Error:', tbarLowerError.message);
    } else if (tbarLower) {
      console.log('✅ Found:', tbarLower);
    } else {
      console.log('❌ Not found with .ilike("tbar")');
    }

    // Test case-insensitive lookup for "TBar"
    console.log('\n--- Testing lookup for "TBar" (mixed case) ---');
    const { data: tbarMixed, error: tbarMixedError } = await supabase
      .from('profiles')
      .select('user_name, email, status')
      .ilike('user_name', 'TBar')
      .neq('status', 'deleted')
      .limit(1)
      .maybeSingle();

    if (tbarMixedError) {
      console.log('❌ Error:', tbarMixedError.message);
    } else if (tbarMixed) {
      console.log('✅ Found:', tbarMixed);
    } else {
      console.log('❌ Not found with .ilike("TBar")');
    }

    // Test exact match
    console.log(
      '\n--- Testing all profiles with username containing "bar" ---',
    );
    const { data: allBar, error: allBarError } = await supabase
      .from('profiles')
      .select('user_name, email, status')
      .ilike('user_name', '%bar%')
      .limit(10);

    if (allBarError) {
      console.log('❌ Error:', allBarError.message);
    } else {
      console.log('Found profiles:');
      allBar.forEach((p) => {
        console.log(
          `  "${p.user_name}" - ${p.email} - Status: ${p.status || 'null'}`,
        );
      });
    }

    console.log('\n=== Diagnosis ===');
    console.log('If "tbar" username is not found with .ilike(), the issue is:');
    console.log('1. Username might be stored with different casing');
    console.log('2. Status might be "deleted"');
    console.log('3. Username might have extra spaces');
    console.log(
      "\nCheck the exact username value above and compare with what you're typing.",
    );
  } catch (err) {
    console.error('Exception:', err);
  }
}

debugUsernameLogin().catch(console.error);
