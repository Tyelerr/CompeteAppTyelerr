import { supabase } from './supabase';

export const fetchProfilesSimple = async () => {
  console.log('=== SIMPLE PROFILES FETCH ===');

  try {
    // Most basic query possible - mirror the tournament fetch pattern
    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        user_name,
        email,
        name,
        status,
        created_at
      `,
      )
      .limit(10);

    console.log('Simple profiles fetch - Data:', data);
    console.log('Simple profiles fetch - Error:', error);
    console.log('Simple profiles fetch - Count:', data ? data.length : 0);

    if (data && data.length > 0) {
      console.log('Sample profile:', data[0]);
      console.log(
        'All usernames found:',
        data.map((p) => p.user_name),
      );
      console.log(
        'All emails found:',
        data.map((p) => p.email),
      );
    }

    return { data, error };
  } catch (e) {
    console.error('Exception in fetchProfilesSimple:', e);
    return { data: null, error: e };
  }
};

export const fetchProfilesWithStatus = async () => {
  console.log('=== FETCH PROFILES WITH STATUS FILTER ===');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .is('status', null) // Only get profiles where status is null (active users)
      .limit(10);

    console.log('With status filter - Data:', data);
    console.log('With status filter - Error:', error);
    console.log('With status filter - Count:', data ? data.length : 0);

    return { data, error };
  } catch (e) {
    console.error('Exception in fetchProfilesWithStatus:', e);
    return { data: null, error: e };
  }
};

export const fetchProfilesNoStatus = async () => {
  console.log('=== FETCH PROFILES WITHOUT STATUS FILTER ===');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);

    console.log('No status filter - Data:', data);
    console.log('No status filter - Error:', error);
    console.log('No status filter - Count:', data ? data.length : 0);

    if (data && data.length > 0) {
      console.log(
        'Status values found:',
        data.map((p) => ({ username: p.user_name, status: p.status })),
      );
    }

    return { data, error };
  } catch (e) {
    console.error('Exception in fetchProfilesNoStatus:', e);
    return { data: null, error: e };
  }
};

export const testSpecificUsernames = async () => {
  console.log('=== TEST SPECIFIC USERNAMES ===');

  const testUsernames = ['tyelerr', 'user1', 'Bobs', 'MetroSportBar'];

  for (const username of testUsernames) {
    try {
      console.log(`\nTesting username: "${username}"`);

      // Test exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from('profiles')
        .select('user_name, email, status')
        .eq('user_name', username);

      console.log(`  Exact match: ${exactMatch?.length || 0} results`);

      // Test case-insensitive match
      const { data: iLikeMatch, error: iLikeError } = await supabase
        .from('profiles')
        .select('user_name, email, status')
        .ilike('user_name', username);

      console.log(
        `  Case-insensitive match: ${iLikeMatch?.length || 0} results`,
      );

      if (iLikeMatch && iLikeMatch.length > 0) {
        iLikeMatch.forEach((match) => {
          console.log(
            `    Found: "${match.user_name}" - ${match.email} (status: ${match.status})`,
          );
        });
      }
    } catch (error) {
      console.error(`Error testing username "${username}":`, error);
    }
  }
};
