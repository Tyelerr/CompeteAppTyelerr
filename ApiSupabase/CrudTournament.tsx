// Import crypto polyfill to ensure crypto.getRandomValues is available
import 'react-native-get-random-values';

import { COUNT_TOURNAMENTS_IN_PAGE } from '../hooks/constants';
import {
  ETournamentTimeDeleted,
  ICAUserData,
  ILikedTournament,
  ITournament,
  ITournamentFilters,
} from '../hooks/InterfacesGlobal';
import { supabase } from './supabase';
import { sanitizeTournamentFilters } from '../utils/FilterSanitizer';

export const GetNextTournamentId = async () => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id_unique_number')
      .order('id_unique_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching max id_unique_number:', error);
      return { nextId: null, error };
    }

    const maxId = data && data.length > 0 ? data[0].id_unique_number : 0;
    return { nextId: maxId + 1, error: null };
  } catch (error) {
    console.error('Error in GetNextTournamentId:', error);
    return { nextId: null, error };
  }
};

const TournamentObjectToDataForSupabase = (
  tournament: ITournament & {
    recurring_series_id?: string;
    is_recurring_master?: boolean;
  },
) => {
  return {
    tournament_name: tournament.tournament_name,
    /**/
    game_type: tournament.game_type,
    format: tournament.format,
    director_name: tournament.director_name,
    equipment: tournament.equipment,
    custom_equipment: tournament.custom_equipment,

    is_recurring: tournament.is_recurring,
    reports_to_fargo: tournament.reports_to_fargo,
    is_open_tournament: tournament.is_open_tournament,

    description: tournament.description,
    game_spot: tournament.game_spot,
    venue: tournament.venue,
    venue_lat: tournament.venue_lat,
    venue_lng: tournament.venue_lng,
    address: tournament.address,
    phone: tournament.phone,
    thumbnail_type: tournament.thumbnail_type,
    thumbnail_url: tournament.thumbnail_url,

    start_date: `${
      tournament.start_date !== null ? tournament.start_date : '2025-01-01'
    } ${
      tournament.strart_time !== undefined ? tournament.strart_time : '00:00'
    }:00`,

    race_details: tournament.race_details,
    table_size: tournament.table_size,
    number_of_tables: tournament.number_of_tables,
    max_fargo: tournament.max_fargo,
    tournament_fee: tournament.tournament_fee,
    // created_at: tournament.game_type,
    // updated_at: tournament.game_type,
    uuid: tournament.uuid,
    id_unique_number: tournament.id_unique_number,
    side_pots: tournament.side_pots,
    chip_allocations: tournament.chip_allocations,

    point_location: `POINT(${
      tournament.venue_lng &&
      tournament.venue_lng !== '' &&
      tournament.venue_lng !== null &&
      tournament.venue_lng !== undefined
        ? tournament.venue_lng
        : '0'
    } ${
      tournament.venue_lat &&
      tournament.venue_lat !== '' &&
      tournament.venue_lat !== null &&
      tournament.venue_lat !== undefined
        ? tournament.venue_lat
        : '0'
    })`,

    venue_id:
      tournament.venue_id && tournament.venue_id !== -1
        ? tournament.venue_id
        : null,

    // Set status as active so tournaments are immediately live
    status: 'active',

    // Add Required Fargo Games fields
    required_fargo_games: tournament.required_fargo_games || null,
    has_required_fargo_games: tournament.has_required_fargo_games || false,

    // Add recurring tournament fields if they exist
    ...(tournament.recurring_series_id && {
      recurring_series_id: tournament.recurring_series_id,
    }),
    ...(tournament.is_recurring_master !== undefined && {
      is_recurring_master: tournament.is_recurring_master,
    }),
  };
};

export const CreateTournament = async (newTournament: ITournament) => {
  try {
    console.log('Starting tournament creation process...');

    // Check if this is a recurring tournament
    if (newTournament.is_recurring) {
      console.log('🎯 Creating RECURRING tournament series...');

      // Generate a unique series ID for this recurring tournament
      const recurringSeriesId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c == 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        },
      );
      console.log('📋 Generated recurring series ID:', recurringSeriesId);

      // Parse the original date and time
      const originalDateTime = new Date(
        `${newTournament.start_date}T${newTournament.strart_time}`,
      );
      console.log('📅 Original tournament date/time:', originalDateTime);

      const createdTournaments: any[] = [];
      const errors: any[] = [];

      // Create 4 tournaments (current + 3 future weeks)
      for (let week = 0; week < 4; week++) {
        console.log(`🏗️ Creating tournament ${week + 1}/4 (Week ${week})`);

        // Calculate the date for this tournament (add weeks)
        const tournamentDate = new Date(originalDateTime);
        tournamentDate.setDate(tournamentDate.getDate() + week * 7);

        // Format date and time for database
        const formattedDate = tournamentDate.toISOString().split('T')[0];
        const formattedTime = tournamentDate
          .toTimeString()
          .split(' ')[0]
          .substring(0, 5);

        console.log(
          `📅 Tournament ${
            week + 1
          } date/time: ${formattedDate} ${formattedTime}`,
        );

        // Get next tournament ID
        const { nextId, error: nextIdError } = await GetNextTournamentId();
        if (nextIdError) {
          console.error(
            `Error getting next tournament ID for week ${week}:`,
            nextIdError,
          );
          errors.push({ week, error: nextIdError });
          continue;
        }

        // Create tournament data with recurring fields
        const tournamentData = {
          ...newTournament,
          id_unique_number: nextId,
          start_date: formattedDate,
          strart_time: formattedTime,
          recurring_series_id: recurringSeriesId,
          is_recurring_master: week === 0, // First tournament is the master
        };

        const dataForDb = TournamentObjectToDataForSupabase(tournamentData);

        // Add recurring fields to database data
        dataForDb.recurring_series_id = recurringSeriesId;
        dataForDb.is_recurring_master = week === 0;

        console.log(`💾 Inserting tournament ${week + 1} into database...`);

        const { data, error } = await supabase
          .from('tournaments')
          .insert(dataForDb)
          .select();

        if (error) {
          console.error(
            `Database insertion error for tournament ${week + 1}:`,
            error,
          );
          errors.push({ week, error });
        } else {
          console.log(
            `✅ Tournament ${week + 1} created successfully:`,
            data?.[0]?.id_unique_number,
          );
          createdTournaments.push(data?.[0]);
        }
      }

      console.log('🎯 Recurring tournament series creation complete!');
      console.log(
        `✅ Successfully created: ${createdTournaments.length}/4 tournaments`,
      );
      console.log(`❌ Errors: ${errors.length}/4 tournaments`);

      if (errors.length > 0) {
        console.error('Errors encountered:', errors);
      }

      // Return the master tournament as the primary result, but include all created tournaments
      const masterTournament = createdTournaments.find(
        (t) => t.is_recurring_master,
      );
      return {
        data: masterTournament ? [masterTournament] : null,
        error: errors.length > 0 ? errors : null,
        recurringSeries: {
          seriesId: recurringSeriesId,
          totalCreated: createdTournaments.length,
          errors: errors.length,
          tournaments: createdTournaments,
        },
      };
    } else {
      // Non-recurring tournament - use original logic
      console.log('🎯 Creating SINGLE tournament...');

      const { nextId, error: nextIdError } = await GetNextTournamentId();
      if (nextIdError) {
        console.error('Error getting next tournament ID:', nextIdError);
        return { data: null, error: nextIdError };
      }

      console.log('Generated next tournament ID:', nextId);
      newTournament.id_unique_number = nextId;
      const dataNewTournament = TournamentObjectToDataForSupabase(
        newTournament as any,
      );

      console.log('Tournament data prepared for database:', dataNewTournament);

      const { data, error } = await supabase
        .from('tournaments')
        .insert(dataNewTournament)
        .select();

      console.log('Database response - data:', data);
      console.log('Database response - error:', error);

      if (error) {
        console.error('Database insertion error:', error);
        return { data: null, error };
      }

      console.log('Tournament created successfully:', data);
      return { data, error: null };
    }
  } catch (catchError) {
    console.error('Unexpected error in CreateTournament:', catchError);
    return { data: null, error: catchError };
  }
};

export const UpdateTournament = async (
  tournament: ITournament,
  newData: any,
) => {
  /*const newDataAll = {
    ...TournamentObjectToDataForSupabase(tournament),
    ...newData
  };*/

  try {
    const { data, error } = await supabase
      .from('tournaments')
      .update(newData)
      .eq('id', tournament.id)
      .select();
    // // // // // // console.log('Tournament data after update: ', data);
    // // // // // // console.log('Tournament error after update: ', error);
    return { data, error };
  } catch (error) {
    // // // // // // console.log('There is error after updating tournament:', error);
    return { data: null, error };
  }
};

/**
 * Delete a tournament with simple archival
 * This function archives the tournament to tournaments_archive table
 * Falls back to direct deletion if archival function doesn't exist
 */
export const DeleteTournament = async (
  tournamentId: string,
  userId?: string,
  reason: string = 'admin_deletion',
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🗑️ Deleting tournament ${tournamentId}...`);

    // Try to use the simple archival function first
    try {
      const { data, error } = await supabase.rpc(
        'archive_tournament_manual_simple',
        {
          tournament_id: tournamentId,
          admin_user_id: userId || null,
          reason: reason,
        },
      );

      if (!error && data === true) {
        console.log('✅ Tournament deleted and archived successfully');
        return { success: true };
      }

      // If function doesn't exist or failed, fall through to direct deletion
      console.log(
        '⚠️ Archival function not available or failed, using direct deletion',
      );
    } catch (archiveError) {
      console.log('⚠️ Archival function not available, using direct deletion');
    }

    // Fallback: Direct deletion from database with likes cleanup
    console.log('🗑️ Performing direct deletion from tournaments table...');

    // First, delete all likes associated with this tournament
    // Note: The column is 'turnament_id' (with one 'o'), not 'tournament_id'
    console.log('🗑️ Deleting associated likes first...');
    const { error: likesError } = await supabase
      .from('likes')
      .delete()
      .eq('turnament_id', tournamentId);

    if (likesError) {
      console.error('⚠️ Error deleting likes (continuing anyway):', likesError);
      // Continue anyway - likes might not exist
    } else {
      console.log('✅ Likes deleted successfully');
    }

    // Now delete the tournament
    const { error: deleteError } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);

    if (deleteError) {
      console.error('❌ Error deleting tournament:', deleteError);
      return {
        success: false,
        error: deleteError.message,
      };
    }

    console.log('✅ Tournament deleted successfully (direct deletion)');
    return { success: true };
  } catch (catchError) {
    console.error('❌ Unexpected error deleting tournament:', catchError);
    return {
      success: false,
      error: catchError instanceof Error ? catchError.message : 'Unknown error',
    };
  }
};

/**
 * Fetch tournaments with comprehensive filtering support (WITH CITY/STATE FILTERING FIXED)
 * This is the main function used by the tournament display screens
 */
export const FetchTournaments_Filters = async (
  filters: ITournamentFilters,
  offset: number = 0,
): Promise<{
  tournaments: ITournament[];
  totalCount: number;
  error: any;
}> => {
  try {
    console.log(
      '=== FetchTournaments_Filters START (WITH CITY/STATE FILTERING) ===',
    );
    console.log('Original filters:', JSON.stringify(filters, null, 2));
    console.log('Offset:', offset);

    // Sanitize filters to remove invalid tournament table fields
    const sanitizedFilters = sanitizeTournamentFilters(filters);
    console.log('Using sanitized filters for database query');

    // BUILD 204: Build the base query with count included
    // Using { count: 'exact' } in the select ensures we get count WITH the data
    // This guarantees count and data use the EXACT same filters (no divergence)
    let query = supabase.from('tournaments').select(
      `
        *,
        profiles(*),
        venues(*)
        `,
      { count: 'exact' }, // BUILD 204: Add count to main query for single-query architecture
    );

    // Apply search filter
    if (sanitizedFilters.search && sanitizedFilters.search.trim() !== '') {
      const searchTerm = sanitizedFilters.search.trim();
      query = query.or(
        `tournament_name.ilike.%${searchTerm}%,game_type.ilike.%${searchTerm}%,format.ilike.%${searchTerm}%,director_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,equipment.ilike.%${searchTerm}%,game_spot.ilike.%${searchTerm}%,venue.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,race_details.ilike.%${searchTerm}%`,
      );
    }

    // Apply game type filter with defensive trimming
    if (
      sanitizedFilters.game_type &&
      sanitizedFilters.game_type.trim() !== ''
    ) {
      const trimmedGameType = sanitizedFilters.game_type.trim();
      console.log(`🎯 Applying game_type filter: "${trimmedGameType}"`);
      console.log(`   Filter length: ${trimmedGameType.length} characters`);
      query = query.ilike('game_type', trimmedGameType);
    }

    // Apply format filter with defensive trimming
    if (sanitizedFilters.format && sanitizedFilters.format.trim() !== '') {
      const trimmedFormat = sanitizedFilters.format.trim();
      console.log(`🎯 Applying format filter: "${trimmedFormat}"`);
      console.log(`   Filter length: ${trimmedFormat.length} characters`);
      query = query.ilike('format', trimmedFormat);
    }

    // Apply equipment filter with defensive trimming
    if (
      sanitizedFilters.equipment &&
      sanitizedFilters.equipment.trim() !== ''
    ) {
      if (
        sanitizedFilters.equipment === 'custom' &&
        sanitizedFilters.equipment_custom
      ) {
        const trimmedCustomEquipment = sanitizedFilters.equipment_custom.trim();
        console.log(
          `🎯 Applying custom_equipment filter: "${trimmedCustomEquipment}"`,
        );
        console.log(
          `   Filter length: ${trimmedCustomEquipment.length} characters`,
        );
        query = query.ilike('custom_equipment', `%${trimmedCustomEquipment}%`);
      } else {
        const trimmedEquipment = sanitizedFilters.equipment.trim();
        console.log(`🎯 Applying equipment filter: "${trimmedEquipment}"`);
        console.log(`   Filter length: ${trimmedEquipment.length} characters`);
        query = query.ilike('equipment', trimmedEquipment);
      }
    }

    // Apply table size filter with defensive trimming
    if (
      sanitizedFilters.table_size &&
      sanitizedFilters.table_size.trim() !== ''
    ) {
      const trimmedTableSize = sanitizedFilters.table_size.trim();
      console.log(`🎯 Applying table_size filter: "${trimmedTableSize}"`);
      console.log(`   Filter length: ${trimmedTableSize.length} characters`);
      query = query.ilike('table_size', trimmedTableSize);
    }

    // Apply entry fee range filter
    if (
      sanitizedFilters.entryFeeFrom !== undefined &&
      sanitizedFilters.entryFeeFrom !== null
    ) {
      query = query.gte('tournament_fee', sanitizedFilters.entryFeeFrom);
    }
    if (
      sanitizedFilters.entryFeeTo !== undefined &&
      sanitizedFilters.entryFeeTo !== null
    ) {
      query = query.lte('tournament_fee', sanitizedFilters.entryFeeTo);
    }

    // Apply fargo rating range filter
    if (
      sanitizedFilters.fargoRatingFrom !== undefined &&
      sanitizedFilters.fargoRatingFrom !== null
    ) {
      query = query.gte('max_fargo', sanitizedFilters.fargoRatingFrom);
    }
    if (
      sanitizedFilters.fargoRatingTo !== undefined &&
      sanitizedFilters.fargoRatingTo !== null
    ) {
      query = query.lte('max_fargo', sanitizedFilters.fargoRatingTo);
    }

    // Apply boolean filters - FIXED in BUILD 162
    // Apply filters when they are explicitly set (true or false), not just when true
    // This ensures consistent filtering behavior across all boolean filters
    if (sanitizedFilters.reports_to_fargo !== undefined) {
      console.log(
        `🎯 Applying reports_to_fargo filter: ${sanitizedFilters.reports_to_fargo}`,
      );
      query = query.eq('reports_to_fargo', sanitizedFilters.reports_to_fargo);
    }

    // FIXED BUILD 162: Apply is_open_tournament filter when explicitly set (true or false)
    // Previously only filtered when true, causing inconsistent behavior
    if (sanitizedFilters.is_open_tournament !== undefined) {
      console.log(
        `🎯 Applying is_open_tournament filter: ${sanitizedFilters.is_open_tournament}`,
      );
      query = query.eq(
        'is_open_tournament',
        sanitizedFilters.is_open_tournament,
      );
    }

    // Apply minimum required fargo games filter
    // This is a special case - it checks for >= 10 games, not a boolean field
    if (sanitizedFilters.minimun_required_fargo_games_10plus === true) {
      console.log(
        `🎯 Applying minimun_required_fargo_games_10plus filter: >= 10 games`,
      );
      query = query.gte('required_fargo_games', 10);
    }

    // Apply date range filters
    if (sanitizedFilters.dateFrom && sanitizedFilters.dateFrom !== '') {
      console.log(`Applying dateFrom filter: ${sanitizedFilters.dateFrom}`);
      query = query.gte('start_date', sanitizedFilters.dateFrom);
    }
    if (sanitizedFilters.dateTo && sanitizedFilters.dateTo !== '') {
      console.log(`Applying dateTo filter: ${sanitizedFilters.dateTo}`);
      query = query.lte('start_date', sanitizedFilters.dateTo);
    }

    // Apply venue name filter (legacy support)
    if (sanitizedFilters.venue && sanitizedFilters.venue !== '') {
      query = query.ilike('venue', `%${sanitizedFilters.venue}%`);
    }

    // FIXED: Apply city filter - simplified to avoid parsing issues
    if (sanitizedFilters.city && sanitizedFilters.city !== '') {
      console.log(`Applying city filter: ${sanitizedFilters.city}`);
      // Use address-based filtering only to avoid venue relationship parsing issues
      query = query.ilike('address', `%${sanitizedFilters.city}%`);
    }

    // FIXED: Apply state filter - simplified to avoid parsing issues
    if (sanitizedFilters.state && sanitizedFilters.state !== '') {
      console.log(`Applying state filter: ${sanitizedFilters.state}`);
      // Use address-based filtering only to avoid venue relationship parsing issues
      query = query.ilike('address', `%${sanitizedFilters.state}%`);
    }
    // CRITICAL FIX BUILD 178: Exclude recurring master templates from regular tournament list
    // Master templates (is_recurring_master = true) are blueprints for generating child tournaments
    // They should NEVER be displayed in the regular tournament list
    // Only show child tournaments (is_recurring_master = false or null)
    // Using NOT filter instead of OR for better compatibility
    query = query.not('is_recurring_master', 'eq', true);
    console.log(
      '🚫 BUILD 178: Excluding recurring master templates (is_recurring_master != true)',
    );

    // Check if user is an administrator (master-administrator or compete-admin)
    const isAdmin =
      filters.userRole === 'master-administrator' ||
      filters.userRole === 'compete-admin';

    if (isAdmin) {
      console.log(
        '👑 ADMIN ACCESS: Skipping status and date filters to show ALL tournaments',
      );
      // Administrators see ALL tournaments regardless of status or date
      // No status filter applied
      // No date filter applied
    } else {
      // Apply status filter - only show active tournaments by default for regular users
      query = query.eq('status', 'active');

      // CRITICAL: Only show tournaments that are today or in the future
      // This ensures tournaments automatically disappear the day after their date
      // BUT: If user has specified a dateFrom filter, respect that instead
      const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format

      if (!sanitizedFilters.dateFrom || sanitizedFilters.dateFrom === '') {
        // Only apply "today onwards" filter if user hasn't specified a date range
        query = query.gte('start_date', today);
        console.log(
          `📅 Filtering tournaments from date: ${today} onwards (default)`,
        );
      } else {
        console.log(
          `📅 Using user-specified date range instead of default "today onwards"`,
        );
      }
    }

    // BUILD 192 FIX: Apply stable deterministic ordering with tiebreaker
    // Sorting only by start_date can cause items to shift between pages
    // when multiple tournaments have the same date (Postgres returns ties in random order)
    query = query
      .order('start_date', { ascending: true })
      .order('id', { ascending: true }); // Tiebreaker for stable ordering

    // Apply pagination
    const pageSize = COUNT_TOURNAMENTS_IN_PAGE;
    const from = offset;
    const to = offset + pageSize - 1;
    query = query.range(from, to);

    console.log('📄 BUILD 192 PAGINATION DEBUG:');
    console.log(`   Page calculation: offset=${offset}, pageSize=${pageSize}`);
    console.log(`   Range: from=${from}, to=${to}`);
    console.log(`   Order: start_date ASC, id ASC (stable tiebreaker)`);

    // BUILD 204: Execute the query - now returns data AND count together
    const { data, count, error } = await query;

    console.log('Query executed - Data count:', data ? data.length : 0);
    console.log('Query error:', error);

    if (error) {
      console.error('Error in FetchTournaments_Filters:', error);
      return { tournaments: [], totalCount: 0, error };
    }

    let finalTournaments = data as ITournament[];

    // ENHANCED RADIUS FILTERING LOGIC (ZIP CODE FILTERING)
    if (
      filters.radius !== undefined &&
      filters.radius !== null &&
      filters.zip_code &&
      finalTournaments &&
      finalTournaments.length > 0
    ) {
      console.log('=== RADIUS FILTERING START ===');
      console.log(
        `Applying radius filter: ${filters.radius} miles from ZIP: ${filters.zip_code}`,
      );
      console.log(`Initial tournament count: ${finalTournaments.length}`);

      try {
        // Import GeoapifyService for geocoding
        const GeoapifyService = require('./GeoapifyService').default;

        // Get coordinates for the ZIP code using GeoapifyService
        const zipCoordinates = await GeoapifyService.geocodeAddress(
          filters.zip_code,
          { limit: 1, countryCode: 'us' }, // Bias towards US addresses for better accuracy
        );

        if (zipCoordinates?.latitude && zipCoordinates?.longitude) {
          console.log(`✅ ZIP ${filters.zip_code} geocoded successfully:`);
          console.log(
            `   Coordinates: ${zipCoordinates.latitude}, ${zipCoordinates.longitude}`,
          );
          console.log(`   Address: ${zipCoordinates.formatted_address}`);

          // Enhanced distance calculation using Haversine formula
          const calculateDistance = (
            lat1: number,
            lng1: number,
            lat2: number,
            lng2: number,
          ): number => {
            // Validate input coordinates
            if (
              !isFinite(lat1) ||
              !isFinite(lng1) ||
              !isFinite(lat2) ||
              !isFinite(lng2)
            ) {
              return Infinity; // Return infinite distance for invalid coordinates
            }

            const R = 3959; // Earth's radius in miles
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLng = ((lng2 - lng1) * Math.PI) / 180;

            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return Math.round(distance * 10) / 10; // Round to 1 decimal place
          };

          // Enhanced coordinate validation
          const isValidCoordinate = (
            lat: string | number,
            lng: string | number,
          ): boolean => {
            const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
            const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;

            return (
              !isNaN(latNum) &&
              !isNaN(lngNum) &&
              isFinite(latNum) &&
              isFinite(lngNum) &&
              latNum !== 0 &&
              lngNum !== 0 &&
              latNum >= -90 &&
              latNum <= 90 &&
              lngNum >= -180 &&
              lngNum <= 180
            );
          };

          // Filter tournaments by radius with enhanced logic and FIXED coordinate field mapping
          const tournamentsWithDistance = finalTournaments.map((tournament) => {
            // Log tournament details for debugging
            console.log(
              `🔍 Processing tournament ${tournament.id_unique_number}:`,
            );
            console.log(`   Venue: ${tournament.venue}`);
            console.log(`   Has venues object: ${!!tournament.venues}`);

            // Enhanced debugging - show coordinate fields
            if (tournament.venues) {
              console.log(`   Venue latitude: ${tournament.venues.latitude}`);
              console.log(`   Venue longitude: ${tournament.venues.longitude}`);
            }

            // FIXED: Get coordinates from correct fields with fallback logic
            let tournamentLat: number | null = null;
            let tournamentLng: number | null = null;
            let coordinateSource = 'none';

            if (tournament.venues) {
              // Primary: Check venues.latitude and venues.longitude (correct field names)
              if (
                tournament.venues.latitude !== null &&
                tournament.venues.latitude !== undefined &&
                tournament.venues.longitude !== null &&
                tournament.venues.longitude !== undefined
              ) {
                tournamentLat = parseFloat(String(tournament.venues.latitude));
                tournamentLng = parseFloat(String(tournament.venues.longitude));
                coordinateSource = 'venues.latitude/longitude';
              }
              // Fallback 1: Check venues.venue_lat and venues.venue_lng (legacy field names)
              else if (
                tournament.venues.venue_lat !== null &&
                tournament.venues.venue_lat !== undefined &&
                tournament.venues.venue_lng !== null &&
                tournament.venues.venue_lng !== undefined
              ) {
                tournamentLat = parseFloat(String(tournament.venues.venue_lat));
                tournamentLng = parseFloat(String(tournament.venues.venue_lng));
                coordinateSource = 'venues.venue_lat/venue_lng';
              }
            }

            // Fallback 2: Check tournament-level coordinates (legacy)
            if (tournamentLat === null || tournamentLng === null) {
              if (
                tournament.venue_lat !== null &&
                tournament.venue_lat !== undefined &&
                tournament.venue_lng !== null &&
                tournament.venue_lng !== undefined
              ) {
                tournamentLat = parseFloat(String(tournament.venue_lat));
                tournamentLng = parseFloat(String(tournament.venue_lng));
                coordinateSource = 'tournament.venue_lat/venue_lng';
              }
            }

            console.log(`   📍 Coordinate source: ${coordinateSource}`);
            if (tournamentLat !== null && tournamentLng !== null) {
              console.log(
                `   📍 Extracted coordinates: ${tournamentLat}, ${tournamentLng}`,
              );
            }

            // Validate venue coordinates using the extracted values
            if (
              !tournament.venues ||
              tournamentLat === null ||
              tournamentLng === null ||
              !isValidCoordinate(tournamentLat, tournamentLng)
            ) {
              console.log(
                `   ⚠️  Invalid coordinates - EXCLUDING tournament from radius filter`,
              );
              console.log(
                `   ⚠️  Reason: ${
                  tournamentLat === null || tournamentLng === null
                    ? 'No coordinates found'
                    : 'Invalid coordinate values'
                }`,
              );
              return {
                tournament,
                distance: null,
                withinRadius: false, // EXCLUDE tournaments without valid venue coordinates when radius filtering is active
                reason: 'invalid_coordinates',
              };
            }

            console.log(
              `   📍 Valid coordinates: ${tournamentLat}, ${tournamentLng}`,
            );

            // Calculate distance
            const distance = calculateDistance(
              zipCoordinates.latitude,
              zipCoordinates.longitude,
              tournamentLat,
              tournamentLng,
            );

            console.log(`   📏 Calculated distance: ${distance} miles`);

            // If distance calculation failed (returned Infinity), exclude the tournament
            if (!isFinite(distance)) {
              console.log(
                `   ⚠️  Distance calculation failed - EXCLUDING tournament from radius filter`,
              );
              return {
                tournament,
                distance: null,
                withinRadius: false, // EXCLUDE tournaments with calculation errors when radius filtering is active
                reason: 'calculation_error',
              };
            }

            const withinRadius = distance <= filters.radius!;
            console.log(
              `   ${withinRadius ? '✅' : '❌'} Within ${
                filters.radius
              } miles: ${withinRadius}`,
            );

            return {
              tournament,
              distance,
              withinRadius,
              reason: withinRadius ? 'within_radius' : 'outside_radius',
            };
          });

          // Apply filtering - Only include tournaments within radius, exclude those outside
          finalTournaments = tournamentsWithDistance
            .filter((item) => {
              // Include tournaments that are within radius
              if (item.withinRadius && item.reason === 'within_radius') {
                console.log(
                  `   ✅ INCLUDING: Tournament ${item.tournament.id_unique_number} - within radius (${item.distance} miles)`,
                );
                return true;
              }
              // Exclude tournaments that are outside radius
              if (item.reason === 'outside_radius') {
                console.log(
                  `   ❌ EXCLUDING: Tournament ${item.tournament.id_unique_number} - outside radius (${item.distance} miles)`,
                );
                return false;
              }
              // Exclude tournaments with invalid coordinates when radius filtering is active
              if (
                item.reason === 'invalid_coordinates' ||
                item.reason === 'calculation_error'
              ) {
                console.log(
                  `   ❌ EXCLUDING: Tournament ${item.tournament.id_unique_number} - invalid coordinates (cannot determine distance)`,
                );
                return false;
              }
              // Default: exclude
              console.log(
                `   ❌ EXCLUDING: Tournament ${item.tournament.id_unique_number} - unknown reason: ${item.reason}`,
              );
              return false;
            })
            .map((item) => item.tournament);

          // Enhanced logging for debugging
          const withinRadiusCount = tournamentsWithDistance.filter(
            (item) => item.withinRadius && item.distance !== null,
          ).length;
          const invalidCoordinatesCount = tournamentsWithDistance.filter(
            (item) => item.reason === 'invalid_coordinates',
          ).length;
          const outsideRadiusCount = tournamentsWithDistance.filter(
            (item) => item.reason === 'outside_radius',
          ).length;

          console.log('=== RADIUS FILTERING RESULTS ===');
          console.log(
            `✅ Tournaments within ${filters.radius} miles: ${withinRadiusCount}`,
          );
          console.log(
            `⚠️  Tournaments with invalid coordinates (excluded): ${invalidCoordinatesCount}`,
          );
          console.log(
            `❌ Tournaments outside radius (excluded): ${outsideRadiusCount}`,
          );
          console.log(`📊 Final tournament count: ${finalTournaments.length}`);

          // Log sample distances for debugging (first 5 tournaments)
          tournamentsWithDistance.slice(0, 5).forEach((item) => {
            if (item.distance !== null) {
              console.log(
                `   Tournament ${item.tournament.id_unique_number}: ${item.distance} miles (${item.reason})`,
              );
            } else {
              console.log(
                `   Tournament ${item.tournament.id_unique_number}: No valid coordinates (${item.reason})`,
              );
            }
          });
        } else {
          console.log('❌ Could not geocode ZIP code, showing all tournaments');
          console.log('   ZIP code geocoding failed - no coordinates returned');
        }
      } catch (error) {
        console.error('❌ Error during radius filtering:', error);
        console.log('   Falling back to showing all tournaments due to error');
        // On error, don't apply radius filtering but continue with other filters
      }

      console.log('=== RADIUS FILTERING END ===');
    } else {
      // Log why radius filtering is not being applied
      if (!filters.radius) {
        console.log('ℹ️  No radius filtering - radius not specified');
      } else if (!filters.zip_code) {
        console.log('ℹ️  No radius filtering - zip code not specified');
      } else if (!finalTournaments || finalTournaments.length === 0) {
        console.log('ℹ️  No radius filtering - no tournaments to filter');
      } else {
        console.log('ℹ️  No radius filtering - conditions not met');
      }
    }

    // Apply days of week filter for recurring tournaments
    // FIXED BUILD 164: Convert between component's Monday-based indexing (0-6) and JavaScript's Sunday-based indexing (0-6)
    // Component uses: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
    // JavaScript getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    if (filters.daysOfWeek && filters.daysOfWeek.length > 0) {
      console.log('📅 Applying days of week filter:', filters.daysOfWeek);

      finalTournaments = finalTournaments.filter((tournament) => {
        if (!tournament.start_date) return false;

        const tournamentDate = new Date(tournament.start_date);
        const jsDay = tournamentDate.getDay(); // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday

        // Convert JavaScript day (0-6, Sunday-based) to component day (0-6, Monday-based)
        // JavaScript: [0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat]
        // Component:  [0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun]
        // Conversion: If jsDay is 0 (Sunday), map to 6. Otherwise, map jsDay-1
        const componentDay = jsDay === 0 ? 6 : jsDay - 1;

        const isMatch = filters.daysOfWeek!.includes(componentDay);

        if (isMatch) {
          console.log(
            `   ✅ Tournament ${tournament.id_unique_number} on ${tournament.start_date} (JS day: ${jsDay}, Component day: ${componentDay}) - INCLUDED`,
          );
        }

        return isMatch;
      });

      console.log(
        `After days of week filtering: ${finalTournaments.length} tournaments`,
      );
    }

    // BUILD 198: Calculate total count AFTER all filtering is applied
    // This ensures the count matches exactly what will be displayed
    let totalCount = 0;

    // For pagination purposes, we need to get the total count of tournaments
    // that would match ALL filters (including radius and days of week filtering)
    // Since radius filtering and days of week filtering happen after the database query,
    // we need to calculate the count based on the filtered results

    if (
      (filters.radius !== undefined &&
        filters.radius !== null &&
        filters.zip_code) ||
      (filters.daysOfWeek && filters.daysOfWeek.length > 0)
    ) {
      // When radius filtering or days of week filtering is applied,
      // we need to fetch ALL matching tournaments (without pagination)
      // to get an accurate count after client-side filtering
      console.log('=== CALCULATING TOTAL COUNT WITH CLIENT-SIDE FILTERING ===');

      // CRITICAL BUILD 180: Check if user is admin (needed for filter logic)
      const isAdminForClientCount =
        filters.userRole === 'master-administrator' ||
        filters.userRole === 'compete-admin';
      console.log('Is admin for client-side count:', isAdminForClientCount);

      // Build a query identical to the main query but without pagination
      let countDataQuery = supabase.from('tournaments').select(
        `
        *,
        profiles(*),
        venues(*)
        `,
      );

      // CRITICAL BUILD 180: Exclude recurring master templates (same syntax as main query)
      countDataQuery = countDataQuery.not('is_recurring_master', 'eq', true);

      // Apply all the same database-level filters using SANITIZED filters
      if (sanitizedFilters.search && sanitizedFilters.search.trim() !== '') {
        const searchTerm = sanitizedFilters.search.trim();
        countDataQuery = countDataQuery.or(
          `tournament_name.ilike.%${searchTerm}%,game_type.ilike.%${searchTerm}%,format.ilike.%${searchTerm}%,director_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,equipment.ilike.%${searchTerm}%,game_spot.ilike.%${searchTerm}%,venue.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,race_details.ilike.%${searchTerm}%`,
        );
      }

      if (
        sanitizedFilters.game_type &&
        sanitizedFilters.game_type.trim() !== ''
      ) {
        const trimmedGameType = sanitizedFilters.game_type.trim();
        console.log(
          `🎯 COUNT QUERY: Applying game_type filter: "${trimmedGameType}"`,
        );
        countDataQuery = countDataQuery.ilike('game_type', trimmedGameType);
      }

      if (sanitizedFilters.format && sanitizedFilters.format.trim() !== '') {
        const trimmedFormat = sanitizedFilters.format.trim();
        console.log(
          `🎯 COUNT QUERY: Applying format filter: "${trimmedFormat}"`,
        );
        countDataQuery = countDataQuery.ilike('format', trimmedFormat);
      }

      if (
        sanitizedFilters.equipment &&
        sanitizedFilters.equipment.trim() !== ''
      ) {
        if (
          sanitizedFilters.equipment === 'custom' &&
          sanitizedFilters.equipment_custom
        ) {
          const trimmedCustomEquipment =
            sanitizedFilters.equipment_custom.trim();
          console.log(
            `🎯 COUNT QUERY: Applying custom_equipment filter: "${trimmedCustomEquipment}"`,
          );
          countDataQuery = countDataQuery.ilike(
            'custom_equipment',
            `%${trimmedCustomEquipment}%`,
          );
        } else {
          const trimmedEquipment = sanitizedFilters.equipment.trim();
          console.log(
            `🎯 COUNT QUERY: Applying equipment filter: "${trimmedEquipment}"`,
          );
          countDataQuery = countDataQuery.ilike('equipment', trimmedEquipment);
        }
      }

      if (
        sanitizedFilters.table_size &&
        sanitizedFilters.table_size.trim() !== ''
      ) {
        const trimmedTableSize = sanitizedFilters.table_size.trim();
        console.log(
          `🎯 COUNT QUERY: Applying table_size filter: "${trimmedTableSize}"`,
        );
        countDataQuery = countDataQuery.ilike('table_size', trimmedTableSize);
      }

      if (
        sanitizedFilters.entryFeeFrom !== undefined &&
        sanitizedFilters.entryFeeFrom !== null
      ) {
        countDataQuery = countDataQuery.gte(
          'tournament_fee',
          sanitizedFilters.entryFeeFrom,
        );
      }
      if (
        sanitizedFilters.entryFeeTo !== undefined &&
        sanitizedFilters.entryFeeTo !== null
      ) {
        countDataQuery = countDataQuery.lte(
          'tournament_fee',
          sanitizedFilters.entryFeeTo,
        );
      }

      if (
        sanitizedFilters.fargoRatingFrom !== undefined &&
        sanitizedFilters.fargoRatingFrom !== null
      ) {
        countDataQuery = countDataQuery.gte(
          'max_fargo',
          sanitizedFilters.fargoRatingFrom,
        );
      }
      if (
        sanitizedFilters.fargoRatingTo !== undefined &&
        sanitizedFilters.fargoRatingTo !== null
      ) {
        countDataQuery = countDataQuery.lte(
          'max_fargo',
          sanitizedFilters.fargoRatingTo,
        );
      }

      if (sanitizedFilters.reports_to_fargo !== undefined) {
        countDataQuery = countDataQuery.eq(
          'reports_to_fargo',
          sanitizedFilters.reports_to_fargo,
        );
      }
      if (sanitizedFilters.is_open_tournament !== undefined) {
        countDataQuery = countDataQuery.eq(
          'is_open_tournament',
          sanitizedFilters.is_open_tournament,
        );
      }

      if (sanitizedFilters.minimun_required_fargo_games_10plus) {
        countDataQuery = countDataQuery.gte('required_fargo_games', 10);
      }

      if (sanitizedFilters.dateFrom && sanitizedFilters.dateFrom !== '') {
        countDataQuery = countDataQuery.gte(
          'start_date',
          sanitizedFilters.dateFrom,
        );
      }
      if (sanitizedFilters.dateTo && sanitizedFilters.dateTo !== '') {
        countDataQuery = countDataQuery.lte(
          'start_date',
          sanitizedFilters.dateTo,
        );
      }

      if (sanitizedFilters.venue && sanitizedFilters.venue !== '') {
        countDataQuery = countDataQuery.ilike(
          'venue',
          `%${sanitizedFilters.venue}%`,
        );
      }

      if (sanitizedFilters.city && sanitizedFilters.city !== '') {
        countDataQuery = countDataQuery.ilike(
          'address',
          `%${sanitizedFilters.city}%`,
        );
      }

      if (sanitizedFilters.state && sanitizedFilters.state !== '') {
        countDataQuery = countDataQuery.ilike(
          'address',
          `%${sanitizedFilters.state}%`,
        );
      }

      // CRITICAL BUILD 180 FIX: Apply status and date filters ONLY for non-admin users
      // This must match the main query logic exactly
      if (!isAdminForClientCount) {
        console.log(
          '👤 CLIENT-SIDE COUNT: Regular user - applying status and date filters',
        );
        countDataQuery = countDataQuery.eq('status', 'active');

        if (!sanitizedFilters.dateFrom || sanitizedFilters.dateFrom === '') {
          const today = new Date().toISOString().split('T')[0];
          countDataQuery = countDataQuery.gte('start_date', today);
        }
      } else {
        console.log(
          '👑 CLIENT-SIDE COUNT: Admin user - skipping status and date filters',
        );
      }

      countDataQuery = countDataQuery.order('start_date', { ascending: true });

      // Execute the count query to get all matching tournaments
      const { data: countData, error: countError } = await countDataQuery;

      if (countError) {
        console.error('Error in count data query:', countError);
        // Fallback to using the current filtered results count
        totalCount = finalTournaments.length;
      } else if (countData) {
        let countTournaments = countData as ITournament[];

        // Apply the same client-side filtering logic as the main query

        // Apply radius filtering to count data
        if (
          filters.radius !== undefined &&
          filters.radius !== null &&
          filters.zip_code &&
          countTournaments &&
          countTournaments.length > 0
        ) {
          console.log('Applying radius filtering to count data...');
          try {
            const GeoapifyService = require('./GeoapifyService').default;
            const zipCoordinates = await GeoapifyService.geocodeAddress(
              filters.zip_code,
              { limit: 1, countryCode: 'us' },
            );

            if (zipCoordinates?.latitude && zipCoordinates?.longitude) {
              const calculateDistance = (
                lat1: number,
                lng1: number,
                lat2: number,
                lng2: number,
              ): number => {
                if (
                  !isFinite(lat1) ||
                  !isFinite(lng1) ||
                  !isFinite(lat2) ||
                  !isFinite(lng2)
                ) {
                  return Infinity;
                }

                const R = 3959;
                const dLat = ((lat2 - lat1) * Math.PI) / 180;
                const dLng = ((lng2 - lng1) * Math.PI) / 180;

                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((lat1 * Math.PI) / 180) *
                    Math.cos((lat2 * Math.PI) / 180) *
                    Math.sin(dLng / 2) *
                    Math.sin(dLng / 2);

                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                return Math.round(distance * 10) / 10;
              };

              const isValidCoordinate = (
                lat: string | number,
                lng: string | number,
              ): boolean => {
                const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
                const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;

                return (
                  !isNaN(latNum) &&
                  !isNaN(lngNum) &&
                  isFinite(latNum) &&
                  isFinite(lngNum) &&
                  latNum !== 0 &&
                  lngNum !== 0 &&
                  latNum >= -90 &&
                  latNum <= 90 &&
                  lngNum >= -180 &&
                  lngNum <= 180
                );
              };

              countTournaments = countTournaments.filter((tournament) => {
                let tournamentLat: number | null = null;
                let tournamentLng: number | null = null;

                if (tournament.venues) {
                  if (
                    tournament.venues.latitude !== null &&
                    tournament.venues.latitude !== undefined &&
                    tournament.venues.longitude !== null &&
                    tournament.venues.longitude !== undefined
                  ) {
                    tournamentLat = parseFloat(
                      String(tournament.venues.latitude),
                    );
                    tournamentLng = parseFloat(
                      String(tournament.venues.longitude),
                    );
                  } else if (
                    tournament.venues.venue_lat !== null &&
                    tournament.venues.venue_lat !== undefined &&
                    tournament.venues.venue_lng !== null &&
                    tournament.venues.venue_lng !== undefined
                  ) {
                    tournamentLat = parseFloat(
                      String(tournament.venues.venue_lat),
                    );
                    tournamentLng = parseFloat(
                      String(tournament.venues.venue_lng),
                    );
                  }
                }

                if (tournamentLat === null || tournamentLng === null) {
                  if (
                    tournament.venue_lat !== null &&
                    tournament.venue_lat !== undefined &&
                    tournament.venue_lng !== null &&
                    tournament.venue_lng !== undefined
                  ) {
                    tournamentLat = parseFloat(String(tournament.venue_lat));
                    tournamentLng = parseFloat(String(tournament.venue_lng));
                  }
                }

                if (
                  !tournament.venues ||
                  tournamentLat === null ||
                  tournamentLng === null ||
                  !isValidCoordinate(tournamentLat, tournamentLng)
                ) {
                  return false; // Exclude tournaments without valid coordinates
                }

                const distance = calculateDistance(
                  zipCoordinates.latitude,
                  zipCoordinates.longitude,
                  tournamentLat,
                  tournamentLng,
                );

                if (!isFinite(distance)) {
                  return false; // Exclude tournaments with calculation errors
                }

                return distance <= filters.radius!;
              });
            }
          } catch (error) {
            console.error('Error during radius filtering for count:', error);
          }
        }

        // Apply days of week filtering to count data
        // FIXED BUILD 164: Convert between component's Monday-based indexing and JavaScript's Sunday-based indexing
        if (filters.daysOfWeek && filters.daysOfWeek.length > 0) {
          countTournaments = countTournaments.filter((tournament) => {
            if (!tournament.start_date) return false;

            const tournamentDate = new Date(tournament.start_date);
            const jsDay = tournamentDate.getDay(); // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday

            // Convert JavaScript day to component day (same conversion as above)
            const componentDay = jsDay === 0 ? 6 : jsDay - 1;

            return filters.daysOfWeek!.includes(componentDay);
          });
        }

        totalCount = countTournaments.length;
        console.log(`Total count after all filtering: ${totalCount}`);
      }
    } else {
      // BUILD 204: When no client-side filtering is needed, use SINGLE-QUERY architecture
      // This guarantees count and data can't diverge (100% filter parity)
      console.log(
        '=== BUILD 204: CALCULATING TOTAL COUNT WITH SINGLE-QUERY ARCHITECTURE ===',
      );

      // The main query already has all filters applied
      // We just need to add { count: 'exact' } to get count WITH the data
      // This is already done above in the main query building section

      // Extract count from the main query response
      // Note: The count comes from the SAME query that returned the data
      // This guarantees 100% filter parity - no divergence possible

      console.log('🔍 BUILD 204 SINGLE-QUERY COUNT:');
      console.log(`   Count from main query: ${count}`);
      console.log(`   Count is null: ${count === null}`);
      console.log(`   Count is undefined: ${count === undefined}`);

      if (count !== null && count !== undefined) {
        totalCount = count;
        console.log(`✅ Using count from main query: ${totalCount}`);
      } else {
        console.error(
          '⚠️ Count returned null/undefined from main query, defaulting to 0',
        );
        totalCount = 0;
      }

      console.log(`✅ Final totalCount set to: ${totalCount}`);
      console.log(
        '✅ BUILD 204: Single-query architecture ensures 100% filter parity',
      );
    }

    console.log('🔍 BUILD 198 TOTAL COUNT:');
    console.log(`   totalCount: ${totalCount}`);

    // BUILD 192: Comprehensive pagination debug logging
    const usingRadiusFilter =
      filters.radius !== undefined &&
      filters.radius !== null &&
      filters.zip_code;
    const usingDaysOfWeekFilter =
      filters.daysOfWeek && filters.daysOfWeek.length > 0;
    const filteringPath =
      usingRadiusFilter || usingDaysOfWeekFilter
        ? 'CLIENT-SIDE (radius/daysOfWeek)'
        : 'DATABASE-ONLY (state/city)';

    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║       BUILD 198 PAGINATION DEBUG SUMMARY              ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('📄 Page Info:');
    console.log(`   Offset: ${offset}`);
    console.log(`   Page Size: ${COUNT_TOURNAMENTS_IN_PAGE}`);
    console.log(
      `   Current Page: ${Math.floor(offset / COUNT_TOURNAMENTS_IN_PAGE) + 1}`,
    );
    console.log('');
    console.log('🔍 Filtering Path:', filteringPath);
    console.log('   Radius filter active:', usingRadiusFilter);
    console.log('   Days of week filter active:', usingDaysOfWeekFilter);
    console.log('');
    console.log('📊 Results:');
    console.log(`   Tournaments returned: ${finalTournaments.length}`);
    console.log(`   Total count: ${totalCount}`);
    console.log(
      `   Count is null: ${totalCount === null || totalCount === undefined}`,
    );
    console.log(
      `   Expected pages: ${Math.ceil(totalCount / COUNT_TOURNAMENTS_IN_PAGE)}`,
    );
    console.log('');
    console.log('🎯 Filters Applied:');
    console.log(`   is_recurring_master excluded: true`);
    console.log(`   User role: ${filters.userRole || 'none'}`);
    console.log(`   Is admin: ${isAdmin}`);
    console.log(`   State: ${sanitizedFilters.state || 'none'}`);
    console.log(`   City: ${sanitizedFilters.city || 'none'}`);
    console.log(`   Radius: ${filters.radius || 'none'}`);
    console.log(`   Zip code: ${filters.zip_code || 'none'}`);
    console.log('');
    console.log('📋 Order Clauses:');
    console.log('   1. start_date ASC');
    console.log('   2. id ASC (tiebreaker for stable ordering)');
    console.log('');
    if (finalTournaments.length > 0) {
      const firstItem = finalTournaments[0];
      const lastItem = finalTournaments[finalTournaments.length - 1];
      console.log('🔢 First Item:');
      console.log(`   ID: ${firstItem.id}`);
      console.log(`   ID Unique Number: ${firstItem.id_unique_number}`);
      console.log(`   Start Date: ${firstItem.start_date}`);
      console.log(`   Tournament Name: ${firstItem.tournament_name}`);
      console.log('');
      console.log('🔢 Last Item:');
      console.log(`   ID: ${lastItem.id}`);
      console.log(`   ID Unique Number: ${lastItem.id_unique_number}`);
      console.log(`   Start Date: ${lastItem.start_date}`);
      console.log(`   Tournament Name: ${lastItem.tournament_name}`);
    } else {
      console.log('⚠️  No tournaments returned');
    }
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');

    console.log(
      '=== FetchTournaments_Filters END (WITH CITY/STATE FILTERING) ===',
    );
    console.log('Final tournaments count:', finalTournaments.length);
    console.log('Total count:', totalCount);

    return {
      tournaments: finalTournaments,
      totalCount: totalCount,
      error: null,
    };
  } catch (catchError) {
    console.error('Exception in FetchTournaments_Filters:', catchError);
    return {
      tournaments: [],
      totalCount: 0,
      error: catchError,
    };
  }
};

/**
 * FetchTournaments2 - Alternative tournament fetching function
 * This function provides a simpler tournament fetch without complex filtering
 */
export const FetchTournaments2 = async (
  offset: number = 0,
  limit: number = COUNT_TOURNAMENTS_IN_PAGE,
): Promise<{
  tournaments: ITournament[];
  totalCount: number;
  error: any;
}> => {
  try {
    console.log('=== FetchTournaments2 START ===');
    console.log('Offset:', offset, 'Limit:', limit);

    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0];

    // Build the main query with count included (single-query architecture)
    const { data, count, error } = await supabase
      .from('tournaments')
      .select(
        `
        *,
        profiles(*),
        venues(*)
        `,
        { count: 'exact' }, // Add count to ensure pagination works
      )
      .eq('status', 'active')
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error in FetchTournaments2:', error);
      return { tournaments: [], totalCount: 0, error };
    }

    const totalCount = count || 0;

    console.log('FetchTournaments2 - Data count:', data ? data.length : 0);
    console.log('FetchTournaments2 - Total count:', totalCount);
    console.log('=== FetchTournaments2 END ===');

    return {
      tournaments: data as ITournament[],
      totalCount: totalCount,
      error: null,
    };
  } catch (catchError) {
    console.error('Exception in FetchTournaments2:', catchError);
    return {
      tournaments: [],
      totalCount: 0,
      error: catchError,
    };
  }
};

/**
 * Get venue tournament likes statistics by time period
 * This function calls the database function to get comprehensive likes analytics
 * including current active likes, historical likes, and period-specific data
 */
export const GetVenueTournamentLikesStatsByPeriod = async (
  venueId: number,
  period: '24hr' | '1week' | '1month' | '1year' | 'lifetime' = 'lifetime',
): Promise<{
  currentActiveLikes?: number;
  totalHistoricalLikes?: number;
  periodLikes?: number;
  uniqueUsersWhoLiked?: number;
  error?: any;
}> => {
  try {
    console.log(
      `🔍 Getting tournament likes stats for venue ${venueId}, period: ${period}`,
    );

    // Validate input parameters
    if (!venueId || typeof venueId !== 'number') {
      console.error('❌ Invalid venue ID provided:', venueId);
      return {
        currentActiveLikes: 0,
        totalHistoricalLikes: 0,
        periodLikes: 0,
        uniqueUsersWhoLiked: 0,
        error: 'Invalid venue ID',
      };
    }

    // Validate period parameter
    const validPeriods = ['24hr', '1week', '1month', '1year', 'lifetime'];
    if (!validPeriods.includes(period)) {
      console.error('❌ Invalid period provided:', period);
      return {
        currentActiveLikes: 0,
        totalHistoricalLikes: 0,
        periodLikes: 0,
        uniqueUsersWhoLiked: 0,
        error: 'Invalid time period',
      };
    }

    // Call the database function
    const { data, error } = await supabase.rpc(
      'get_venue_tournament_likes_stats_by_period',
      {
        p_venue_id: venueId,
        p_period: period,
      },
    );

    if (error) {
      console.error('❌ Database error getting tournament likes stats:', error);

      // Return default values instead of failing completely
      return {
        currentActiveLikes: 0,
        totalHistoricalLikes: 0,
        periodLikes: 0,
        uniqueUsersWhoLiked: 0,
        error: error,
      };
    }

    // Parse the response data
    let stats = {
      currentActiveLikes: 0,
      totalHistoricalLikes: 0,
      periodLikes: 0,
      uniqueUsersWhoLiked: 0,
    };

    if (data) {
      // The database function returns a JSON object with camelCase keys
      if (typeof data === 'object' && data !== null) {
        stats = {
          currentActiveLikes: parseInt(data.currentActiveLikes) || 0,
          totalHistoricalLikes: parseInt(data.totalHistoricalLikes) || 0,
          periodLikes: parseInt(data.periodLikes) || 0,
          uniqueUsersWhoLiked: parseInt(data.uniqueUsersWhoLiked) || 0,
        };
      } else if (typeof data === 'string') {
        // If data is returned as JSON string, parse it
        try {
          const parsedData = JSON.parse(data);
          stats = {
            currentActiveLikes: parseInt(parsedData.currentActiveLikes) || 0,
            totalHistoricalLikes:
              parseInt(parsedData.totalHistoricalLikes) || 0,
            periodLikes: parseInt(parsedData.periodLikes) || 0,
            uniqueUsersWhoLiked: parseInt(parsedData.uniqueUsersWhoLiked) || 0,
          };
        } catch (parseError) {
          console.error('❌ Error parsing JSON response:', parseError);
        }
      }
    }

    console.log(`✅ Tournament likes stats for venue ${venueId}:`, stats);
    console.log(`   📊 Current Active Likes: ${stats.currentActiveLikes}`);
    console.log(`   📈 Total Historical Likes: ${stats.totalHistoricalLikes}`);
    console.log(`   ⏰ Period Likes (${period}): ${stats.periodLikes}`);
    console.log(`   👥 Unique Users Who Liked: ${stats.uniqueUsersWhoLiked}`);

    return stats;
  } catch (catchError) {
    console.error(
      '❌ Exception in GetVenueTournamentLikesStatsByPeriod:',
      catchError,
    );

    // Return default values to prevent dashboard crashes
    return {
      currentActiveLikes: 0,
      totalHistoricalLikes: 0,
      periodLikes: 0,
      uniqueUsersWhoLiked: 0,
      error: catchError,
    };
  }
};

/**
 * Get venue tournament likes comprehensive stats (backward compatibility)
 * This function provides comprehensive tournament likes statistics for a venue
 * It's a wrapper around GetVenueTournamentLikesStatsByPeriod with 'lifetime' period
 */
export const GetVenueTournamentLikesComprehensiveStats = async (
  venueId: number,
): Promise<{
  currentActiveLikes?: number;
  totalHistoricalLikes?: number;
  periodLikes?: number;
  uniqueUsersWhoLiked?: number;
  error?: any;
}> => {
  try {
    console.log(
      `🔍 Getting comprehensive tournament likes stats for venue ${venueId}`,
    );

    // Call the main function with 'lifetime' period for comprehensive stats
    const result = await GetVenueTournamentLikesStatsByPeriod(
      venueId,
      'lifetime',
    );

    console.log(
      `✅ Comprehensive tournament likes stats for venue ${venueId}:`,
      result,
    );

    return result;
  } catch (catchError) {
    console.error(
      '❌ Exception in GetVenueTournamentLikesComprehensiveStats:',
      catchError,
    );

    // Return default values to prevent dashboard crashes
    return {
      currentActiveLikes: 0,
      totalHistoricalLikes: 0,
      periodLikes: 0,
      uniqueUsersWhoLiked: 0,
      error: catchError,
    };
  }
};

/**
 * Add or remove a tournament like
 * @param user - The user adding/removing the like
 * @param tournament - The tournament to like/unlike
 * @param isLiked - true to add like, false to remove like
 */
export const AddTournamentLike = async (
  user: ICAUserData,
  tournament: ITournament,
  isLiked: boolean,
): Promise<{ data?: any; error?: any }> => {
  try {
    if (isLiked) {
      // Add like
      console.log(`❤️ Adding like for tournament ${tournament.id}`);
      const { data, error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          turnament_id: tournament.id, // Note: column is 'turnament_id' with one 'o'
        })
        .select();

      if (error) {
        console.error('Error adding tournament like:', error);
      } else {
        console.log('✅ Tournament like added successfully');
      }

      return { data, error };
    } else {
      // Remove like
      console.log(`💔 Removing like for tournament ${tournament.id}`);
      const { data, error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('turnament_id', tournament.id); // Note: column is 'turnament_id' with one 'o'

      if (error) {
        console.error('Error removing tournament like:', error);
      } else {
        console.log('✅ Tournament like removed successfully');
      }

      return { data, error };
    }
  } catch (catchError) {
    console.error('Exception in AddTournamentLike:', catchError);
    return { error: catchError };
  }
};

/**
 * Fetch tournaments liked by a specific user
 * @param user - The user whose liked tournaments to fetch
 */
export const FetchTournaments_LikedByUser = async (
  user: ICAUserData,
): Promise<{
  likedtournaments?: ILikedTournament[];
  countLikes?: number;
  data?: any;
  error?: any;
}> => {
  try {
    console.log(`🔍 Fetching liked tournaments for user ${user.id}`);

    const { data, error } = await supabase
      .from('likes')
      .select(
        `
        *,
        tournaments (
          *,
          profiles(*),
          venues(*)
        )
      `,
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching liked tournaments:', error);
      return { error };
    }

    // Transform the data to match the expected format
    const likedtournaments: ILikedTournament[] =
      data?.map((like: any) => ({
        ...like,
        tournamentobject: like.tournaments, // Map tournaments to tournamentobject
      })) || [];

    console.log(`✅ Found ${likedtournaments.length} liked tournaments`);

    return {
      likedtournaments,
      countLikes: likedtournaments.length,
      data,
    };
  } catch (catchError) {
    console.error('Exception in FetchTournaments_LikedByUser:', catchError);
    return { error: catchError };
  }
};
