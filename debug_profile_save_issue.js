const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfileSaveIssue() {
  console.log('=== Debugging Profile Save Issue ===\n');

  try {
    // Get current user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error('Not authenticated. Please log in first.');
      return;
    }

    console.log('Authenticated user ID:', authUser.id);
    console.log('Authenticated user email:', authUser.email);

    // Fetch current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return;
    }

    console.log('\n=== Current Profile Data ===');
    console.log('ID:', profile.id);
    console.log('Email:', profile.email);
    console.log('Username:', profile.user_name);
    console.log('Name:', profile.name);
    console.log('Home City:', profile.home_city);
    console.log('Home State:', profile.home_state);
    console.log('Favorite Player:', profile.favorite_player);
    console.log('Favorite Game:', profile.favorite_game);

    // Check if columns exist and their data types
    console.log('\n=== Checking Database Schema ===');
    const { data: columns, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'profiles'
          AND column_name IN ('home_state', 'favorite_player', 'favorite_game')
          ORDER BY column_name;
        `,
      })
      .catch(() => {
        // If RPC doesn't exist, try direct query
        return { data: null, error: 'RPC not available' };
      });

    if (columns) {
      console.log('Schema check result:', columns);
    } else {
      console.log('Could not check schema via RPC');
    }

    // Test update with sample data
    console.log('\n=== Testing Profile Update ===');
    const testData = {
      home_state: 'CA',
      favorite_player: 'Test Player',
      favorite_game: 'Test Game',
    };

    console.log('Attempting to update with:', testData);

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update(testData)
      .eq('id', authUser.id)
      .select();

    if (updateError) {
      console.error('Update failed:', updateError);
      console.error('Error details:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('Update successful!');
      console.log('Updated data:', updateResult);
    }

    // Fetch profile again to verify
    console.log('\n=== Verifying Update ===');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('home_state, favorite_player, favorite_game')
      .eq('id', authUser.id)
      .single();

    if (verifyError) {
      console.error('Verification failed:', verifyError);
    } else {
      console.log('Verified profile data:');
      console.log('Home State:', verifyProfile.home_state);
      console.log('Favorite Player:', verifyProfile.favorite_player);
      console.log('Favorite Game:', verifyProfile.favorite_game);
    }

    // Check RLS policies
    console.log('\n=== Checking RLS Policies ===');
    const { data: policies, error: policyError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies
          WHERE tablename = 'profiles'
          ORDER BY policyname;
        `,
      })
      .catch(() => ({ data: null, error: 'RPC not available' }));

    if (policies) {
      console.log('RLS Policies:', JSON.stringify(policies, null, 2));
    } else {
      console.log('Could not check RLS policies');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugProfileSaveIssue();
