import { supabase } from './supabase';
import {
  ICAUserData,
  ITournament,
  IVenue,
  IAnalytics,
} from '../hooks/InterfacesGlobal';

export interface IBarOwnerAnalytics {
  my_tournaments: number;
  active_events: number;
  pending_approval: number;
  my_directors: number;
  event_types: { game_type: string; count: number }[];
  venue_performance: {
    monthly_events: number;
    success_rate: number;
    active_directors: number;
  };
}

export const FetchBarOwnerVenues = async (barOwnerIdAuto: number) => {
  try {
    console.log('Fetching venues for bar owner id_auto:', barOwnerIdAuto);

    const { data: venues, error } = await supabase
      .from('venues')
      .select('*')
      .eq('barowner_id', barOwnerIdAuto);

    if (error) {
      console.error('Error fetching venues:', error);
      return { data: null, error };
    }

    if (!venues || venues.length === 0) {
      console.log('No venues found for bar owner');
      return { data: [], error: null };
    }

    // Fetch tables for each venue
    const venuesWithTables = await Promise.all(
      venues.map(async (venue) => {
        const { data: tables, error: tablesError } = await supabase
          .from('venue_tables')
          .select('*')
          .eq('venue_id', venue.id)
          .order('created_at', { ascending: true });

        if (tablesError) {
          console.error(
            `Error fetching tables for venue ${venue.id}:`,
            tablesError,
          );
          // Return venue without tables if tables fetch fails
          return venue;
        }

        return {
          ...venue,
          tables: tables || [],
        };
      }),
    );

    console.log('Found venues with tables:', venuesWithTables.length);
    return { data: venuesWithTables, error: null };
  } catch (error) {
    console.error('Exception in FetchBarOwnerVenues:', error);
    return { data: null, error };
  }
};

export const FetchBarOwnerTournaments = async (barOwnerIdAuto: number) => {
  try {
    console.log('Fetching tournaments for bar owner id_auto:', barOwnerIdAuto);

    // First get all venues owned by this bar owner
    const { data: venues, error: venuesError } = await FetchBarOwnerVenues(
      barOwnerIdAuto,
    );

    if (venuesError) {
      console.error('Error fetching venues:', venuesError);
      return { data: [], error: venuesError };
    }

    if (!venues || venues.length === 0) {
      console.log('No venues found, returning empty tournaments array');
      return { data: [], error: null };
    }

    // Get venue names instead of IDs since tournaments are linked by venue name
    const venueNames = venues.map((venue: IVenue) => venue.venue);
    console.log('Venue names to search tournaments:', venueNames);

    // Query tournaments by venue name instead of venue_id
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .in('venue', venueNames)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching tournaments:', error);
      // Return empty array instead of null to prevent dashboard crashes
      return { data: [], error: error };
    }

    console.log('Found tournaments:', data?.length || 0);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in FetchBarOwnerTournaments:', error);
    return { data: [], error };
  }
};

export const FetchBarOwnerDirectors = async (barOwnerIdAuto: number) => {
  try {
    console.log('Fetching directors for bar owner id_auto:', barOwnerIdAuto);

    // First get all venues owned by this bar owner
    const { data: venues, error: venuesError } = await FetchBarOwnerVenues(
      barOwnerIdAuto,
    );

    if (venuesError) {
      console.error('Error fetching venues for directors:', venuesError);
      return { data: [], error: venuesError };
    }

    if (!venues || venues.length === 0) {
      console.log('No venues found for bar owner, no directors to fetch');
      return { data: [], error: null };
    }

    console.log('Found venues:', venues.length);

    // Get venue IDs
    const venueIds = venues.map((venue: IVenue) => venue.id);

    // Query junction table for all TDs assigned to these venues
    const { data: assignments, error: assignmentsError } = await supabase
      .from('venue_tournament_directors')
      .select('user_id_auto')
      .in('venue_id', venueIds);

    if (assignmentsError) {
      console.error('Error fetching TD assignments:', assignmentsError);
      return { data: [], error: assignmentsError };
    }

    if (!assignments || assignments.length === 0) {
      console.log('No tournament directors assigned to venues');
      return { data: [], error: null };
    }

    // Get unique director IDs
    const uniqueDirectorIds = [
      ...new Set(assignments.map((a) => a.user_id_auto)),
    ];

    console.log('Unique director IDs from junction table:', uniqueDirectorIds);

    // Fetch the director profiles
    const { data: directors, error: directorsError } = await supabase
      .from('profiles')
      .select('*')
      .in('id_auto', uniqueDirectorIds);

    if (directorsError) {
      console.error('Error fetching director profiles:', directorsError);
      return { data: [], error: directorsError };
    }

    console.log('Found directors:', directors?.length || 0);
    return { data: directors || [], error: null };
  } catch (error) {
    console.error('Error in FetchBarOwnerDirectors:', error);
    return { data: [], error };
  }
};

export const FetchBarOwnerAnalytics = async (
  barOwnerIdAuto: number,
): Promise<{ data: IBarOwnerAnalytics | null; error: any }> => {
  try {
    console.log('Fetching analytics for bar owner id_auto:', barOwnerIdAuto);

    // Get tournaments for analytics - don't fail if there are no tournaments
    const { data: tournaments, error: tournamentsError } =
      await FetchBarOwnerTournaments(barOwnerIdAuto);

    // Only fail if there's a real error, not if there are just no tournaments
    if (
      tournamentsError &&
      typeof tournamentsError === 'object' &&
      'message' in tournamentsError
    ) {
      console.error('Error fetching tournaments:', tournamentsError);
      // Don't return error for "no venues" case, just use empty array
      if (!(tournamentsError as any).message?.includes('venue')) {
        return { data: null, error: tournamentsError };
      }
    }

    // Get directors count - don't fail if there are no directors
    const { data: directors, error: directorsError } =
      await FetchBarOwnerDirectors(barOwnerIdAuto);

    // Only log director errors, don't fail the whole function
    if (directorsError) {
      console.warn('Error fetching directors (non-fatal):', directorsError);
    }

    const tournamentList = (tournaments as ITournament[]) || [];
    const directorsList = (directors as ICAUserData[]) || [];

    console.log('Found tournaments:', tournamentList.length);
    console.log('Found directors:', directorsList.length);

    // Calculate analytics
    const totalTournaments = tournamentList.length;
    const activeTournaments = tournamentList.filter(
      (t) => t.status === 'approved' && new Date(t.start_date) >= new Date(),
    ).length;
    const pendingTournaments = tournamentList.filter(
      (t) => t.status === 'pending',
    ).length;
    const totalDirectors = directorsList.length;

    // Calculate event types
    const eventTypesMap = new Map<string, number>();
    tournamentList.forEach((tournament) => {
      const gameType = tournament.game_type || 'Unknown';
      eventTypesMap.set(gameType, (eventTypesMap.get(gameType) || 0) + 1);
    });

    const eventTypes = Array.from(eventTypesMap.entries()).map(
      ([game_type, count]) => ({
        game_type,
        count,
      }),
    );

    // Calculate venue performance (simplified for now)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyEvents = tournamentList.filter((tournament) => {
      const tournamentDate = new Date(tournament.start_date);
      return (
        tournamentDate.getMonth() === currentMonth &&
        tournamentDate.getFullYear() === currentYear
      );
    }).length;

    const successRate =
      totalTournaments > 0
        ? Math.round((activeTournaments / totalTournaments) * 100)
        : 0;

    const analytics: IBarOwnerAnalytics = {
      my_tournaments: totalTournaments,
      active_events: activeTournaments,
      pending_approval: pendingTournaments,
      my_directors: totalDirectors,
      event_types: eventTypes,
      venue_performance: {
        monthly_events: monthlyEvents,
        success_rate: successRate,
        active_directors: totalDirectors,
      },
    };

    console.log('Analytics calculated successfully:', analytics);
    return { data: analytics, error: null };
  } catch (error) {
    console.error('Error in FetchBarOwnerAnalytics:', error);
    return { data: null, error };
  }
};
