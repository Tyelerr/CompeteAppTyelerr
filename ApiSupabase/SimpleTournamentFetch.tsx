import { supabase } from './supabase';

export const fetchTournamentsSimple = async () => {
  console.log('=== SIMPLE TOURNAMENT FETCH ===');

  try {
    // Most basic query possible
    const { data, error } = await supabase
      .from('tournaments')
      .select(
        `
        id,
        tournament_name,
        game_type,
        format,
        director_name,
        venue,
        address,
        start_date,
        tournament_fee,
        id_unique_number,
        status
      `,
      )
      .limit(10);

    console.log('Simple fetch - Data:', data);
    console.log('Simple fetch - Error:', error);
    console.log('Simple fetch - Count:', data ? data.length : 0);

    if (data && data.length > 0) {
      console.log('Sample tournament:', data[0]);
    }

    return { data, error };
  } catch (e) {
    console.error('Exception in fetchTournamentsSimple:', e);
    return { data: null, error: e };
  }
};

export const fetchTournamentsWithStatus = async () => {
  console.log('=== FETCH WITH STATUS FILTER ===');

  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'approved')
      .limit(10);

    console.log('With status filter - Data:', data);
    console.log('With status filter - Error:', error);
    console.log('With status filter - Count:', data ? data.length : 0);

    return { data, error };
  } catch (e) {
    console.error('Exception in fetchTournamentsWithStatus:', e);
    return { data: null, error: e };
  }
};

export const fetchTournamentsNoStatus = async () => {
  console.log('=== FETCH WITHOUT STATUS FILTER ===');

  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .limit(10);

    console.log('No status filter - Data:', data);
    console.log('No status filter - Error:', error);
    console.log('No status filter - Count:', data ? data.length : 0);

    return { data, error };
  } catch (e) {
    console.error('Exception in fetchTournamentsNoStatus:', e);
    return { data: null, error: e };
  }
};
