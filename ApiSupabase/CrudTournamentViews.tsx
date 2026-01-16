import { supabase } from './supabase';
import { ICAUserData } from '../hooks/InterfacesGlobal';

export interface ITournamentView {
  id?: number;
  tournament_id: string; // Changed to string (UUID)
  user_id?: string;
  viewed_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ITournamentViewStats {
  tournament_id: string; // Changed to string (UUID)
  total_views: number;
  unique_users: number;
  views_this_week: number;
  views_this_month: number;
}

/**
 * Check if a user can view a tournament (rate limiting - once per week)
 */
export const CanUserViewTournament = async (
  tournamentId: string,
  user?: ICAUserData,
  ipAddress?: string,
): Promise<{ canView: boolean; error?: any }> => {
  try {
    const { data, error } = await supabase.rpc('can_user_view_tournament', {
      p_user_id: user?.id || null,
      p_tournament_id: tournamentId,
      p_ip_address: ipAddress || null,
    });

    if (error) {
      console.error('Error checking view permission:', error);
      return { canView: false, error };
    }

    return { canView: data === true };
  } catch (error) {
    console.error('Error in CanUserViewTournament:', error);
    return { canView: false, error };
  }
};

/**
 * Record a tournament view (if allowed by rate limiting)
 */
export const RecordTournamentView = async (
  tournamentId: string,
  user?: ICAUserData,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    // First check if user can view (rate limiting)
    const { canView, error: permissionError } = await CanUserViewTournament(
      tournamentId,
      user,
      ipAddress,
    );

    if (permissionError) {
      return { success: false, error: permissionError };
    }

    if (!canView) {
      console.log(
        'User has already viewed this tournament within the last week',
      );
      return { success: false, error: 'Already viewed within the last week' };
    }

    // Record the view
    const viewData: ITournamentView = {
      tournament_id: tournamentId,
      user_id: user?.id || undefined,
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
      viewed_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tournament_views')
      .insert(viewData)
      .select();

    if (error) {
      console.error('Error recording tournament view:', error);
      return { success: false, error };
    }

    console.log('Tournament view recorded successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in RecordTournamentView:', error);
    return { success: false, error };
  }
};

/**
 * Get tournament view statistics for a specific tournament
 */
export const GetTournamentViewStats = async (
  tournamentId: string,
): Promise<{ stats?: ITournamentViewStats; error?: any }> => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get total views
    const { data: totalViews, error: totalError } = await supabase
      .from('tournament_views')
      .select('id')
      .eq('tournament_id', tournamentId);

    if (totalError) {
      console.error('Error fetching total views:', totalError);
      return { error: totalError };
    }

    // Get unique users
    const { data: uniqueUsers, error: uniqueError } = await supabase
      .from('tournament_views')
      .select('user_id')
      .eq('tournament_id', tournamentId)
      .not('user_id', 'is', null);

    if (uniqueError) {
      console.error('Error fetching unique users:', uniqueError);
      return { error: uniqueError };
    }

    // Get views this week
    const { data: weekViews, error: weekError } = await supabase
      .from('tournament_views')
      .select('id')
      .eq('tournament_id', tournamentId)
      .gte('viewed_at', oneWeekAgo.toISOString());

    if (weekError) {
      console.error('Error fetching week views:', weekError);
      return { error: weekError };
    }

    // Get views this month
    const { data: monthViews, error: monthError } = await supabase
      .from('tournament_views')
      .select('id')
      .eq('tournament_id', tournamentId)
      .gte('viewed_at', oneMonthAgo.toISOString());

    if (monthError) {
      console.error('Error fetching month views:', monthError);
      return { error: monthError };
    }

    const uniqueUserIds = new Set(uniqueUsers?.map((u) => u.user_id) || []);

    const stats: ITournamentViewStats = {
      tournament_id: tournamentId,
      total_views: totalViews?.length || 0,
      unique_users: uniqueUserIds.size,
      views_this_week: weekViews?.length || 0,
      views_this_month: monthViews?.length || 0,
    };

    return { stats };
  } catch (error) {
    console.error('Error in GetTournamentViewStats:', error);
    return { error };
  }
};

/**
 * Get view statistics for all tournaments at a specific venue (for bar owners)
 */
export const GetVenueTournamentViewStats = async (
  venueId: number,
): Promise<{ stats?: ITournamentViewStats[]; error?: any }> => {
  try {
    // Get all tournaments for this venue
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, tournament_name')
      .eq('venue_id', venueId);

    if (tournamentsError) {
      console.error('Error fetching venue tournaments:', tournamentsError);
      return { error: tournamentsError };
    }

    if (!tournaments || tournaments.length === 0) {
      return { stats: [] };
    }

    // Get detailed stats for each tournament
    const statsPromises = tournaments.map((tournament) =>
      GetTournamentViewStats(tournament.id),
    );

    const statsResults = await Promise.all(statsPromises);
    const stats = statsResults
      .filter((result) => result.stats)
      .map((result) => result.stats!);

    return { stats };
  } catch (error) {
    console.error('Error in GetVenueTournamentViewStats:', error);
    return { error };
  }
};

/**
 * Get view statistics for all tournaments at a specific venue filtered by time period
 * This function provides time-filtered tournament view statistics for bar owner dashboards
 */
export const GetVenueTournamentViewStatsByPeriod = async (
  venueId: number,
  period: '24hr' | '1week' | '1month' | '1year' | 'lifetime' = 'lifetime',
): Promise<{ totalViews: number; error?: any }> => {
  try {
    console.log(
      `🔍 Getting tournament view stats for venue ${venueId}, period: ${period}`,
    );

    // Validate input parameters
    if (!venueId || typeof venueId !== 'number') {
      console.error('❌ Invalid venue ID provided:', venueId);
      return {
        totalViews: 0,
        error: 'Invalid venue ID',
      };
    }

    // Validate period parameter
    const validPeriods = ['24hr', '1week', '1month', '1year', 'lifetime'];
    if (!validPeriods.includes(period)) {
      console.error('❌ Invalid period provided:', period);
      return {
        totalViews: 0,
        error: 'Invalid time period',
      };
    }

    // Get all tournaments for this venue
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('venue_id', venueId);

    if (tournamentsError) {
      console.error('❌ Error fetching venue tournaments:', tournamentsError);
      return { totalViews: 0, error: tournamentsError };
    }

    if (!tournaments || tournaments.length === 0) {
      console.log('ℹ️  No tournaments found for venue');
      return { totalViews: 0 };
    }

    const tournamentIds = tournaments.map((t) => t.id);
    console.log(`📊 Found ${tournamentIds.length} tournaments for venue`);

    // Calculate the date threshold based on the period
    let dateThreshold: string | null = null;
    const now = new Date();

    switch (period) {
      case '24hr':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateThreshold = yesterday.toISOString();
        break;
      case '1week':
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        dateThreshold = oneWeekAgo.toISOString();
        break;
      case '1month':
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        dateThreshold = oneMonthAgo.toISOString();
        break;
      case '1year':
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        dateThreshold = oneYearAgo.toISOString();
        break;
      case 'lifetime':
        // No date threshold for lifetime
        dateThreshold = null;
        break;
    }

    // Build the query
    let query = supabase
      .from('tournament_views')
      .select('id', { count: 'exact' })
      .in('tournament_id', tournamentIds);

    // Apply date filter if not lifetime
    if (dateThreshold) {
      query = query.gte('viewed_at', dateThreshold);
      console.log(`📅 Filtering views from: ${dateThreshold}`);
    } else {
      console.log(`📅 Getting all-time views (lifetime)`);
    }

    // Execute the query
    const { count, error: viewsError } = await query;

    if (viewsError) {
      console.error('❌ Error fetching tournament views:', viewsError);
      return { totalViews: 0, error: viewsError };
    }

    const totalViews = count || 0;
    console.log(
      `✅ Total views for venue ${venueId} (${period}): ${totalViews}`,
    );

    return { totalViews };
  } catch (catchError) {
    console.error(
      '❌ Exception in GetVenueTournamentViewStatsByPeriod:',
      catchError,
    );
    return {
      totalViews: 0,
      error: catchError,
    };
  }
};

/**
 * Get recent tournament views for analytics (for bar owners)
 */
export const GetRecentTournamentViews = async (
  venueId: number,
  limit: number = 50,
): Promise<{ views?: any[]; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('tournament_views')
      .select(
        `
        id,
        tournament_id,
        user_id,
        viewed_at,
        tournaments!inner(
          id,
          tournament_name,
          venue_id
        ),
        profiles(
          id,
          first_name,
          last_name
        )
      `,
      )
      .eq('tournaments.venue_id', venueId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent tournament views:', error);
      return { error };
    }

    return { views: data };
  } catch (error) {
    console.error('Error in GetRecentTournamentViews:', error);
    return { error };
  }
};

/**
 * Update tournament view count (manual refresh if needed)
 * Note: Since tournaments table doesn't have view_count column,
 * this function just returns the current count from tournament_views table
 */
export const RefreshTournamentViewCount = async (
  tournamentId: string,
): Promise<{ success: boolean; newCount?: number; error?: any }> => {
  try {
    // Count total views
    const { data: views, error: countError } = await supabase
      .from('tournament_views')
      .select('id')
      .eq('tournament_id', tournamentId);

    if (countError) {
      console.error('Error counting views:', countError);
      return { success: false, error: countError };
    }

    const viewCount = views?.length || 0;

    // Note: Not updating tournaments table since view_count column doesn't exist
    // The view count is calculated dynamically from tournament_views table

    return { success: true, newCount: viewCount };
  } catch (error) {
    console.error('Error in RefreshTournamentViewCount:', error);
    return { success: false, error };
  }
};
