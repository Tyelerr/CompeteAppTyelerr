// Simple test to check if tournaments exist in database
import { supabase } from './ApiSupabase/supabase';

export const testTournamentFetch = async () => {
  console.log('=== TESTING TOURNAMENT FETCH ===');

  try {
    // Simple query to get all tournaments
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .limit(5);

    console.log('Simple tournament query result:');
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Count:', data ? data.length : 0);

    if (data && data.length > 0) {
      console.log('First tournament:', data[0]);
    }

    return { data, error };
  } catch (e) {
    console.error('Exception in testTournamentFetch:', e);
    return { data: null, error: e };
  }
};

// Test with no filters
export const testTournamentFetchNoFilters = async () => {
  console.log('=== TESTING WITH EMPTY FILTERS ===');

  try {
    const { FetchTournaments_Filters } = await import(
      './ApiSupabase/CrudTournament'
    );
    const result = await FetchTournaments_Filters({});

    console.log('FetchTournaments_Filters with empty filters:');
    console.log('Result:', result);

    return result;
  } catch (e) {
    console.error('Exception in testTournamentFetchNoFilters:', e);
    return { data: null, error: e, dataTotalCount: null };
  }
};
