// Tournament Maintenance API
// Handles archival of expired tournaments and recurring tournament management

import { supabase } from './supabase';

export interface TournamentMaintenanceResult {
  success: boolean;
  archivedCount: number;
  recurringGeneratedCount: number;
  error?: string;
}

export interface TournamentArchivalStats {
  totalArchived: number;
  expiredCount: number;
  deletedCount: number;
  manualCount: number;
  oldestArchivedDate: string | null;
  newestArchivedDate: string | null;
  activeTournaments: number;
  recurringSeriesCount: number;
}

/**
 * Archive expired tournaments and generate new recurring tournament instances
 * This function should be called daily to maintain the tournament system
 */
export const runTournamentMaintenance =
  async (): Promise<TournamentMaintenanceResult> => {
    try {
      console.log('🔧 Starting tournament maintenance...');

      // Call the PostgreSQL function to archive expired tournaments and generate new recurring ones
      const { data, error } = await supabase.rpc('archive_expired_tournaments');

      if (error) {
        console.error('❌ Error during tournament maintenance:', error);
        return {
          success: false,
          archivedCount: 0,
          recurringGeneratedCount: 0,
          error: error.message,
        };
      }

      const result = data?.[0];
      if (!result) {
        console.error('❌ No result returned from maintenance function');
        return {
          success: false,
          archivedCount: 0,
          recurringGeneratedCount: 0,
          error: 'No result returned from maintenance function',
        };
      }

      // Check if there was an error in the function execution
      if (result.error_message) {
        console.error(
          '❌ Error in maintenance function:',
          result.error_message,
        );
        return {
          success: false,
          archivedCount: result.archived_count || 0,
          recurringGeneratedCount: result.recurring_generated_count || 0,
          error: result.error_message,
        };
      }

      console.log('✅ Tournament maintenance completed successfully');
      console.log(`📦 Archived tournaments: ${result.archived_count}`);
      console.log(
        `🔄 Generated recurring tournaments: ${result.recurring_generated_count}`,
      );

      return {
        success: true,
        archivedCount: result.archived_count || 0,
        recurringGeneratedCount: result.recurring_generated_count || 0,
      };
    } catch (catchError) {
      console.error(
        '❌ Unexpected error during tournament maintenance:',
        catchError,
      );
      return {
        success: false,
        archivedCount: 0,
        recurringGeneratedCount: 0,
        error:
          catchError instanceof Error ? catchError.message : 'Unknown error',
      };
    }
  };

/**
 * Manually archive a tournament (for deletions)
 */
export const archiveTournamentManual = async (
  tournamentId: string,
  userId?: string,
  reason: string = 'deleted',
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🗂️ Manually archiving tournament ${tournamentId}...`);

    const { data, error } = await supabase.rpc('archive_tournament_manual', {
      tournament_id: tournamentId,
      user_id: userId || null,
      reason: reason,
    });

    if (error) {
      console.error('❌ Error archiving tournament:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data) {
      console.error('❌ Tournament not found or already archived');
      return {
        success: false,
        error: 'Tournament not found or already archived',
      };
    }

    console.log('✅ Tournament archived successfully');
    return { success: true };
  } catch (catchError) {
    console.error('❌ Unexpected error archiving tournament:', catchError);
    return {
      success: false,
      error: catchError instanceof Error ? catchError.message : 'Unknown error',
    };
  }
};

/**
 * Generate new recurring tournament instances
 */
export const generateRecurringTournaments = async (): Promise<{
  success: boolean;
  generatedCount: number;
  error?: string;
}> => {
  try {
    console.log('🔄 Generating recurring tournaments...');

    const { data, error } = await supabase.rpc(
      'generate_recurring_tournaments',
    );

    if (error) {
      console.error('❌ Error generating recurring tournaments:', error);
      return {
        success: false,
        generatedCount: 0,
        error: error.message,
      };
    }

    const generatedCount = data?.[0]?.count || 0;

    console.log(`✅ Generated ${generatedCount} recurring tournaments`);
    return {
      success: true,
      generatedCount,
    };
  } catch (catchError) {
    console.error(
      '❌ Unexpected error generating recurring tournaments:',
      catchError,
    );
    return {
      success: false,
      generatedCount: 0,
      error: catchError instanceof Error ? catchError.message : 'Unknown error',
    };
  }
};

/**
 * Get tournament archival statistics
 */
export const getTournamentArchivalStats = async (): Promise<{
  success: boolean;
  stats?: TournamentArchivalStats;
  error?: string;
}> => {
  try {
    console.log('📊 Fetching tournament archival statistics...');

    const { data, error } = await supabase.rpc('get_tournament_archival_stats');

    if (error) {
      console.error('❌ Error fetching archival stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    const result = data?.[0];
    if (!result) {
      console.error('❌ No stats returned');
      return {
        success: false,
        error: 'No statistics returned',
      };
    }

    const stats: TournamentArchivalStats = {
      totalArchived: result.total_archived || 0,
      expiredCount: result.expired_count || 0,
      deletedCount: result.deleted_count || 0,
      manualCount: result.manual_count || 0,
      oldestArchivedDate: result.oldest_archived_date || null,
      newestArchivedDate: result.newest_archived_date || null,
      activeTournaments: result.active_tournaments || 0,
      recurringSeriesCount: result.recurring_series_count || 0,
    };

    console.log('✅ Tournament archival statistics fetched successfully');
    return {
      success: true,
      stats,
    };
  } catch (catchError) {
    console.error('❌ Unexpected error fetching archival stats:', catchError);
    return {
      success: false,
      error: catchError instanceof Error ? catchError.message : 'Unknown error',
    };
  }
};

/**
 * Get tournaments from history table with pagination
 */
export const getArchivedTournaments = async (
  offset: number = 0,
  limit: number = 20,
  reason?: string,
): Promise<{
  success: boolean;
  tournaments?: any[];
  totalCount?: number;
  error?: string;
}> => {
  try {
    console.log(
      `📚 Fetching archived tournaments (offset: ${offset}, limit: ${limit})...`,
    );

    let query = supabase
      .from('tournaments_history')
      .select('*', { count: 'exact' })
      .order('archived_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by reason if provided
    if (reason) {
      query = query.eq('archived_reason', reason);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching archived tournaments:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`✅ Fetched ${data?.length || 0} archived tournaments`);
    return {
      success: true,
      tournaments: data || [],
      totalCount: count || 0,
    };
  } catch (catchError) {
    console.error(
      '❌ Unexpected error fetching archived tournaments:',
      catchError,
    );
    return {
      success: false,
      error: catchError instanceof Error ? catchError.message : 'Unknown error',
    };
  }
};

/**
 * Check if maintenance is needed (tournaments past their date exist)
 */
export const checkMaintenanceNeeded = async (): Promise<{
  success: boolean;
  maintenanceNeeded: boolean;
  expiredTournamentsCount: number;
  recurringSeriesNeedingTournaments: number;
  error?: string;
}> => {
  try {
    console.log('🔍 Checking if maintenance is needed...');

    // Check for expired tournaments
    const { data: expiredData, error: expiredError } = await supabase
      .from('tournaments')
      .select('id', { count: 'exact' })
      .lt('start_date', new Date().toISOString().split('T')[0])
      .eq('status', 'active');

    if (expiredError) {
      console.error('❌ Error checking expired tournaments:', expiredError);
      return {
        success: false,
        maintenanceNeeded: false,
        expiredTournamentsCount: 0,
        recurringSeriesNeedingTournaments: 0,
        error: expiredError.message,
      };
    }

    const expiredCount = expiredData?.length || 0;

    // Check for recurring series that need more tournaments
    const { data: recurringData, error: recurringError } = await supabase
      .from('tournaments')
      .select('recurring_series_id', { count: 'exact' })
      .gte('start_date', new Date().toISOString().split('T')[0])
      .eq('status', 'active')
      .not('recurring_series_id', 'is', null);

    if (recurringError) {
      console.error('❌ Error checking recurring tournaments:', recurringError);
      return {
        success: false,
        maintenanceNeeded: false,
        expiredTournamentsCount: expiredCount,
        recurringSeriesNeedingTournaments: 0,
        error: recurringError.message,
      };
    }

    // Group by series and count
    const seriesCounts: { [key: string]: number } = {};
    recurringData?.forEach((tournament: any) => {
      if (tournament.recurring_series_id) {
        seriesCounts[tournament.recurring_series_id] =
          (seriesCounts[tournament.recurring_series_id] || 0) + 1;
      }
    });

    // Count series with less than 4 tournaments
    const seriesNeedingTournaments = Object.values(seriesCounts).filter(
      (count) => count < 4,
    ).length;

    const maintenanceNeeded = expiredCount > 0 || seriesNeedingTournaments > 0;

    console.log(`✅ Maintenance check completed:`);
    console.log(`   - Expired tournaments: ${expiredCount}`);
    console.log(
      `   - Recurring series needing tournaments: ${seriesNeedingTournaments}`,
    );
    console.log(`   - Maintenance needed: ${maintenanceNeeded}`);

    return {
      success: true,
      maintenanceNeeded,
      expiredTournamentsCount: expiredCount,
      recurringSeriesNeedingTournaments: seriesNeedingTournaments,
    };
  } catch (catchError) {
    console.error(
      '❌ Unexpected error checking maintenance needs:',
      catchError,
    );
    return {
      success: false,
      maintenanceNeeded: false,
      expiredTournamentsCount: 0,
      recurringSeriesNeedingTournaments: 0,
      error: catchError instanceof Error ? catchError.message : 'Unknown error',
    };
  }
};
