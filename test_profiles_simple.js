// Simple test to check what's in the profiles table
import { supabase } from './ApiSupabase/supabase';

async function testProfiles() {
  console.log('=== Testing Profiles Table ===');

  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    console.log('Total profiles in database:', count);

    if (countError) {
      console.error('Error getting count:', countError);
      return;
    }

    // Get first 10 profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, user_name, email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    console.log('Recent profiles:');
    profiles.forEach((profile, index) => {
      console.log(
        `${index + 1}. "${profile.user_name}" - ${profile.email} (${
          profile.status || 'active'
        })`,
      );
    });

    // Test specific searches
    console.log('\n=== Testing Specific Searches ===');

    // Search for tmoneyhill variations
    const usernameVariations = [
      'tmoneyhill',
      'Tmoneyhill',
      'TMONEYHILL',
      'TMoneyHill',
    ];
    for (const username of usernameVariations) {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_name, email')
        .ilike('user_name', username);

      console.log(`Search "${username}": ${data?.length || 0} results`);
      if (data && data.length > 0) {
        console.log(`  Found: ${JSON.stringify(data[0])}`);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testProfiles();
