import { supabase } from './supabase';
import {
  IVenue,
  IVenueTable,
  ETableSizes,
  ICAUserData,
} from '../hooks/InterfacesGlobal';

// Keep the local interface for createVenue function parameter
interface ICreateVenueParams {
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  barowner_id?: number;
  latitude?: number | null;
  longitude?: number | null;
  tables?: Omit<IVenueTable, 'id' | 'venue_id' | 'created_at' | 'updated_at'>[];
}

export const fetchVenues = async (search?: string): Promise<IVenue[]> => {
  try {
    let query = supabase.from('venues').select('*');
    if (search && search.trim() !== '') {
      query = query.ilike('venue', `%${search.trim()}%`); // Changed from 'name' to 'venue'
    }
    const { data: venues, error } = await query.order('venue', {
      ascending: true,
    }); // Changed from 'name' to 'venue'
    if (error) {
      console.error('Error fetching venues:', error);
      return [];
    }

    if (!venues || venues.length === 0) {
      return [];
    }

    // Fetch tables for each venue to ensure consistency with FetchBarOwnerVenues
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

    return venuesWithTables;
  } catch (error) {
    console.error('Exception fetching venues:', error);
    return [];
  }
};

export const createVenue = async (
  venue: ICreateVenueParams,
): Promise<IVenue | null> => {
  try {
    console.log('Creating venue with data:', venue);

    // Map the input to match database schema
    const venueData = {
      venue: venue.name, // Map 'name' to 'venue' column
      address: venue.address,
      phone: venue.phone || null,
      td_id: null, // Will be assigned later via assignTournamentDirectorToVenue
      barowner_id: venue.barowner_id || null, // Set barowner_id if provided
      latitude: venue.latitude || null, // Store precise latitude coordinate
      longitude: venue.longitude || null, // Store precise longitude coordinate
      city: venue.city || null, // Store city for filtering
      state: venue.state || null, // Store state for filtering
      zip_code: venue.zip_code || null, // Store zip_code for filtering
    };

    console.log('Inserting venue data:', venueData);

    const { data, error } = await supabase
      .from('venues')
      .insert([venueData])
      .select()
      .single();

    if (error) {
      console.error('Error creating venue:', error);
      return null;
    }

    console.log('Venue created successfully:', data);

    // If venue was created successfully and tables were provided, create the tables
    if (data && venue.tables && venue.tables.length > 0) {
      console.log(
        'Creating tables for venue:',
        data.id,
        'Tables:',
        venue.tables,
      );
      const venueId = data.id;
      const tablesCreated = await createVenueTables(venueId, venue.tables);
      if (tablesCreated) {
        console.log(
          'Tables created successfully, fetching complete venue data',
        );
        // Fetch the venue with tables to return complete data
        const venueWithTables = await fetchVenueWithTables(venueId);
        return venueWithTables;
      } else {
        console.error('Failed to create tables, but venue was created');
        // Return venue even if tables failed to create
        return data;
      }
    }

    console.log('No tables to create, returning venue data');
    return data || null;
  } catch (error) {
    console.error('Exception creating venue:', error);
    return null;
  }
};

// Table management functions
export const createVenueTables = async (
  venueId: number,
  tables: Omit<IVenueTable, 'id' | 'venue_id' | 'created_at' | 'updated_at'>[],
): Promise<boolean> => {
  try {
    console.log('createVenueTables called with:', { venueId, tables });

    // Validate input
    if (!venueId || !tables || tables.length === 0) {
      console.error('Invalid input for createVenueTables:', {
        venueId,
        tables,
      });
      return false;
    }

    // Filter out tables with missing required fields
    const validTables = tables.filter((table) => {
      const isValid = table.table_size && table.count && table.count > 0;
      if (!isValid) {
        console.warn('Skipping invalid table:', table);
      }
      return isValid;
    });

    if (validTables.length === 0) {
      console.error('No valid tables to insert');
      return false;
    }

    const tableData = validTables.map((table) => ({
      venue_id: venueId,
      table_size: table.table_size,
      table_brand: table.table_brand || null,
      count: table.count || 1, // Include the count field with default value of 1
    }));

    console.log('Inserting table data:', tableData);

    const { data, error } = await supabase
      .from('venue_tables')
      .insert(tableData)
      .select();

    if (error) {
      console.error('Error creating venue tables:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      return false;
    }

    console.log('Tables created successfully:', data);
    return true;
  } catch (error) {
    console.error('Exception creating venue tables:', error);
    return false;
  }
};

export const fetchVenueWithTables = async (
  venueId: number,
): Promise<IVenue | null> => {
  try {
    // Fetch venue data
    const { data: venueData, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (venueError) {
      console.error('Error fetching venue:', venueError);
      return null;
    }

    // Fetch tables for this venue
    const { data: tablesData, error: tablesError } = await supabase
      .from('venue_tables')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: true });

    if (tablesError) {
      console.error('Error fetching venue tables:', tablesError);
      // Return venue without tables if tables fetch fails
      return venueData;
    }

    // Combine venue and tables data
    return {
      ...venueData,
      tables: tablesData || [],
    };
  } catch (error) {
    console.error('Exception fetching venue with tables:', error);
    return null;
  }
};

export const updateVenueTables = async (
  venueId: number,
  tables: IVenueTable[],
): Promise<boolean> => {
  try {
    // First, delete all existing tables for this venue
    const { error: deleteError } = await supabase
      .from('venue_tables')
      .delete()
      .eq('venue_id', venueId);

    if (deleteError) {
      console.error('Error deleting existing venue tables:', deleteError);
      return false;
    }

    // Then, insert the new tables (if any)
    if (tables.length > 0) {
      const tableData = tables.map((table) => ({
        venue_id: venueId,
        table_size: table.table_size,
        table_brand: table.table_brand || null,
        count: table.count || 1, // Include the count field with default value of 1
      }));

      const { error: insertError } = await supabase
        .from('venue_tables')
        .insert(tableData);

      if (insertError) {
        console.error('Error inserting new venue tables:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Exception updating venue tables:', error);
    return false;
  }
};

export const deleteVenueTable = async (tableId: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('venue_tables')
      .delete()
      .eq('id', tableId);

    if (error) {
      console.error('Error deleting venue table:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting venue table:', error);
    return false;
  }
};

export const assignVenueToUser = async (
  userIdAuto: number,
  venueId: number,
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Validate inputs
    if (!userIdAuto || !venueId) {
      const errorMsg = `Invalid parameters: userIdAuto=${userIdAuto}, venueId=${venueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Ensure parameters are numbers
    const numericUserId = Number(userIdAuto);
    const numericVenueId = Number(venueId);

    if (isNaN(numericUserId) || isNaN(numericVenueId)) {
      const errorMsg = `Invalid numeric parameters: userIdAuto=${userIdAuto} (${typeof userIdAuto}), venueId=${venueId} (${typeof venueId})`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Assigning venue:', {
      userIdAuto: numericUserId,
      venueId: numericVenueId,
      userIdAutoType: typeof numericUserId,
      venueIdType: typeof numericVenueId,
    });

    // First, check if the venue exists - use array query to avoid PGRST116 error
    const { data: venueArray, error: fetchError } = await supabase
      .from('venues')
      .select('id, venue, barowner_id')
      .eq('id', numericVenueId);

    if (fetchError) {
      const errorMsg = `Error fetching venue: ${fetchError.message}`;
      console.error(errorMsg, fetchError);
      return { success: false, error: errorMsg };
    }

    // Check if venue exists
    if (!venueArray || venueArray.length === 0) {
      const errorMsg = `No venue found with ID: ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Check for multiple venues (shouldn't happen with ID, but safety check)
    if (venueArray.length > 1) {
      const errorMsg = `Multiple venues found with ID: ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const existingVenue = venueArray[0];

    console.log('Found existing venue:', existingVenue);

    // Check if venue is already assigned to another user
    if (
      existingVenue.barowner_id &&
      existingVenue.barowner_id !== numericUserId
    ) {
      const errorMsg = `Venue is already assigned to user ID: ${existingVenue.barowner_id}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Update the venue's barowner_id to assign it to the user
    const { data, error } = await supabase
      .from('venues')
      .update({ barowner_id: numericUserId })
      .eq('id', numericVenueId)
      .select();

    console.log('Assignment result:', { data, error });

    if (error) {
      const errorMsg = `Database error: ${error.message}`;
      console.error('Error assigning venue to user:', error);
      return { success: false, error: errorMsg };
    }

    // Check if any rows were actually updated
    if (!data || data.length === 0) {
      const errorMsg = `No rows updated for venue ID: ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Successfully assigned venue to user:', data[0]);
    return { success: true, data: data[0] };
  } catch (error) {
    const errorMsg = `Exception: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error('Exception assigning venue to user:', error);
    return { success: false, error: errorMsg };
  }
};

export const updateVenue = async (
  venueId: number,
  updates: {
    venue?: string;
    address?: string;
    phone?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    latitude?: number | null;
    longitude?: number | null;
    tables?: IVenueTable[];
  },
): Promise<IVenue | null> => {
  try {
    // Update venue basic info
    const venueUpdates: any = {};
    if (updates.venue !== undefined) venueUpdates.venue = updates.venue;
    if (updates.address !== undefined) venueUpdates.address = updates.address;
    if (updates.phone !== undefined) venueUpdates.phone = updates.phone;
    if (updates.city !== undefined) venueUpdates.city = updates.city;
    if (updates.state !== undefined) venueUpdates.state = updates.state;
    if (updates.zip_code !== undefined)
      venueUpdates.zip_code = updates.zip_code;
    if (updates.latitude !== undefined)
      venueUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined)
      venueUpdates.longitude = updates.longitude;

    const { data, error } = await supabase
      .from('venues')
      .update(venueUpdates)
      .eq('id', venueId)
      .select()
      .single();

    if (error) {
      console.error('Error updating venue:', error);
      return null;
    }

    // Update tables if provided
    if (updates.tables !== undefined) {
      const tablesUpdated = await updateVenueTables(venueId, updates.tables);
      if (!tablesUpdated) {
        console.error('Failed to update venue tables');
        // Still return the venue data even if tables update failed
      }
    }

    // Fetch complete venue data with tables
    const completeVenue = await fetchVenueWithTables(venueId);
    return completeVenue || data;
  } catch (error) {
    console.error('Exception updating venue:', error);
    return null;
  }
};

export const assignTournamentDirectorToVenue = async (
  userIdAuto: number,
  venueId: number,
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Validate inputs
    if (!userIdAuto || !venueId) {
      const errorMsg = `Invalid parameters: userIdAuto=${userIdAuto}, venueId=${venueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const numericUserId = Number(userIdAuto);
    const numericVenueId = Number(venueId);

    if (isNaN(numericUserId) || isNaN(numericVenueId)) {
      const errorMsg = `Invalid numeric parameters: userIdAuto=${userIdAuto}, venueId=${venueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Assigning Tournament Director to venue:', {
      userIdAuto: numericUserId,
      venueId: numericVenueId,
    });

    // First, get the current venue data - use array query to avoid PGRST116 error
    const { data: venueArray, error: fetchError } = await supabase
      .from('venues')
      .select('id, venue, td_id')
      .eq('id', numericVenueId);

    if (fetchError) {
      const errorMsg = `Error fetching venue: ${fetchError.message}`;
      console.error(errorMsg, fetchError);
      return { success: false, error: errorMsg };
    }

    // Check if venue exists
    if (!venueArray || venueArray.length === 0) {
      const errorMsg = `No venue found with ID: ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Check for multiple venues (shouldn't happen with ID, but safety check)
    if (venueArray.length > 1) {
      const errorMsg = `Multiple venues found with ID: ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const existingVenue = venueArray[0];

    console.log('Found existing venue:', existingVenue);

    // Check if user is already assigned as TD
    if (existingVenue.td_id === numericUserId) {
      const errorMsg = `User is already assigned as Tournament Director for this venue`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Update the venue's td_id with the user's id_auto
    const { data, error } = await supabase
      .from('venues')
      .update({ td_id: numericUserId })
      .eq('id', numericVenueId)
      .select();

    console.log('TD Assignment result:', { data, error });

    if (error) {
      const errorMsg = `Database error: ${error.message}`;
      console.error('Error assigning tournament director to venue:', error);
      return { success: false, error: errorMsg };
    }

    // Check if any rows were actually updated
    if (!data || data.length === 0) {
      const errorMsg = `No rows updated for venue ID: ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Successfully assigned tournament director to venue:', data[0]);
    return { success: true, data: data[0] };
  } catch (error) {
    const errorMsg = `Exception: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error('Exception assigning tournament director to venue:', error);
    return { success: false, error: errorMsg };
  }
};

// Fetch venues where the user is assigned as tournament director
export const fetchVenuesForTournamentDirector = async (
  userIdAuto: number,
): Promise<{ data: IVenue[] | null; error: any }> => {
  try {
    console.log('Fetching venues for tournament director:', userIdAuto);

    const { data: venues, error } = await supabase
      .from('venues')
      .select('*')
      .eq('td_id', userIdAuto);

    if (error) {
      console.error('Error fetching venues for tournament director:', error);
      return { data: null, error };
    }

    if (!venues || venues.length === 0) {
      console.log('No venues found for tournament director');
      return { data: [], error: null };
    }

    // Fetch tables for each venue
    const venuesWithTables = await Promise.all(
      venues.map(async (venue) => {
        const { data: tables, error: tablesError } = await supabase
          .from('venue_tables')
          .select('*')
          .eq('venue_id', venue.id)
          .order('table_size', { ascending: true });

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

    console.log('Found venues with tables for TD:', venuesWithTables.length);
    return { data: venuesWithTables, error: null };
  } catch (error) {
    console.error('Exception fetching venues for tournament director:', error);
    return { data: null, error };
  }
};

// Fetch table information for a specific venue
export const fetchVenueTableInfo = async (
  venueId: number,
): Promise<{ data: any[] | null; error: any }> => {
  try {
    console.log('Fetching table info for venue:', venueId);

    const { data: tables, error } = await supabase
      .from('venue_tables')
      .select('*')
      .eq('venue_id', venueId)
      .order('table_size', { ascending: true });

    if (error) {
      console.error('Error fetching venue table info:', error);
      return { data: null, error };
    }

    console.log('Found tables for venue:', tables?.length || 0);
    return { data: tables || [], error: null };
  } catch (error) {
    console.error('Exception fetching venue table info:', error);
    return { data: null, error };
  }
};

export const removeTournamentDirectorFromVenue = async (
  venueId: number,
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Validate input
    if (!venueId) {
      const errorMsg = `Invalid parameter: venueId=${venueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const numericVenueId = Number(venueId);

    if (isNaN(numericVenueId)) {
      const errorMsg = `Invalid numeric parameter: venueId=${venueId} (${typeof venueId})`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Removing Tournament Director from venue:', {
      venueId: numericVenueId,
    });

    // First, check if the venue exists - use array query to avoid PGRST116 error
    const { data: venueArray, error: fetchError } = await supabase
      .from('venues')
      .select('id, venue, td_id')
      .eq('id', numericVenueId);

    if (fetchError) {
      const errorMsg = `Error fetching venue: ${fetchError.message}`;
      console.error(errorMsg, fetchError);
      return { success: false, error: errorMsg };
    }

    // Check if venue exists
    if (!venueArray || venueArray.length === 0) {
      const errorMsg = `No venue found with ID: ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Check for multiple venues (shouldn't happen with ID, but safety check)
    if (venueArray.length > 1) {
      const errorMsg = `Multiple venues found with ID: ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const existingVenue = venueArray[0];

    console.log('Found existing venue:', existingVenue);

    // Check if venue has a TD assigned
    if (!existingVenue.td_id) {
      const errorMsg = `No Tournament Director assigned to this venue`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Update the venue's td_id to null to remove the TD
    const { data, error } = await supabase
      .from('venues')
      .update({ td_id: null })
      .eq('id', numericVenueId)
      .select();

    console.log('TD Removal result:', { data, error });

    if (error) {
      const errorMsg = `Database error: ${error.message}`;
      console.error('Error removing tournament director from venue:', error);
      return { success: false, error: errorMsg };
    }

    // Check if any rows were actually updated
    if (!data || data.length === 0) {
      const errorMsg = `No rows updated for venue ID: ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log(
      'Successfully removed tournament director from venue:',
      data[0],
    );
    return { success: true, data: data[0] };
  } catch (error) {
    const errorMsg = `Exception: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error('Exception removing tournament director from venue:', error);
    return { success: false, error: errorMsg };
  }
};

// ============================================================================
// NEW JUNCTION TABLE FUNCTIONS FOR MULTIPLE TOURNAMENT DIRECTORS
// ============================================================================

/**
 * Add a tournament director to a venue using the junction table
 * This allows multiple TDs per venue
 */
export const addTournamentDirectorToVenue = async (
  userIdAuto: number,
  venueId: number,
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Validate inputs
    if (!userIdAuto || !venueId) {
      const errorMsg = `Invalid parameters: userIdAuto=${userIdAuto}, venueId=${venueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const numericUserId = Number(userIdAuto);
    const numericVenueId = Number(venueId);

    if (isNaN(numericUserId) || isNaN(numericVenueId)) {
      const errorMsg = `Invalid numeric parameters: userIdAuto=${userIdAuto}, venueId=${venueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Adding Tournament Director to venue (junction table):', {
      userIdAuto: numericUserId,
      venueId: numericVenueId,
    });

    // Insert into junction table
    const { data, error } = await supabase
      .from('venue_tournament_directors')
      .insert([
        {
          venue_id: numericVenueId,
          user_id_auto: numericUserId,
        },
      ])
      .select();

    if (error) {
      // Check if it's a duplicate entry error
      if (error.code === '23505') {
        const errorMsg = `This user is already assigned as Tournament Director for this venue`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      const errorMsg = `Database error: ${error.message}`;
      console.error('Error adding tournament director to venue:', error);
      return { success: false, error: errorMsg };
    }

    console.log('Successfully added tournament director to venue:', data);
    return { success: true, data: data?.[0] };
  } catch (error) {
    const errorMsg = `Exception: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error('Exception adding tournament director to venue:', error);
    return { success: false, error: errorMsg };
  }
};

/**
 * Remove a specific tournament director from a venue using the junction table
 */
export const removeTournamentDirectorFromVenueByUser = async (
  userIdAuto: number,
  venueId: number,
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Validate inputs
    if (!userIdAuto || !venueId) {
      const errorMsg = `Invalid parameters: userIdAuto=${userIdAuto}, venueId=${venueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const numericUserId = Number(userIdAuto);
    const numericVenueId = Number(venueId);

    if (isNaN(numericUserId) || isNaN(numericVenueId)) {
      const errorMsg = `Invalid numeric parameters: userIdAuto=${userIdAuto}, venueId=${venueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Removing Tournament Director from venue (junction table):', {
      userIdAuto: numericUserId,
      venueId: numericVenueId,
    });

    // Delete from junction table
    const { data, error } = await supabase
      .from('venue_tournament_directors')
      .delete()
      .eq('venue_id', numericVenueId)
      .eq('user_id_auto', numericUserId)
      .select();

    if (error) {
      const errorMsg = `Database error: ${error.message}`;
      console.error('Error removing tournament director from venue:', error);
      return { success: false, error: errorMsg };
    }

    // Check if any rows were deleted
    if (!data || data.length === 0) {
      const errorMsg = `No assignment found for user ${numericUserId} at venue ${numericVenueId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Successfully removed tournament director from venue:', data);
    return { success: true, data: data[0] };
  } catch (error) {
    const errorMsg = `Exception: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error('Exception removing tournament director from venue:', error);
    return { success: false, error: errorMsg };
  }
};

/**
 * Fetch all tournament directors for a specific venue using the junction table
 */
export const fetchVenueTournamentDirectors = async (
  venueId: number,
): Promise<{ data: ICAUserData[] | null; error: any }> => {
  try {
    console.log('Fetching tournament directors for venue:', venueId);

    // Query junction table and join with profiles
    const { data: assignments, error } = await supabase
      .from('venue_tournament_directors')
      .select('user_id_auto')
      .eq('venue_id', venueId);

    if (error) {
      console.error('Error fetching venue tournament directors:', error);
      return { data: null, error };
    }

    if (!assignments || assignments.length === 0) {
      console.log('No tournament directors found for venue');
      return { data: [], error: null };
    }

    // Get unique user IDs
    const userIds = assignments.map((a) => a.user_id_auto);

    // Fetch profiles for these users
    const { data: directors, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id_auto', userIds);

    if (profilesError) {
      console.error('Error fetching director profiles:', profilesError);
      return { data: null, error: profilesError };
    }

    console.log('Found tournament directors:', directors?.length || 0);
    return { data: directors || [], error: null };
  } catch (error) {
    console.error('Exception fetching venue tournament directors:', error);
    return { data: null, error };
  }
};
