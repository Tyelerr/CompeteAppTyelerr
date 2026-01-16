/**
 * ============================================================================
 * GIVEAWAY CRUD OPERATIONS WITH ARCHIVAL SUPPORT
 * ============================================================================
 * This module provides CRUD operations for giveaways with built-in archival
 * functionality. When giveaways are deleted, they are archived along with
 * their entries for historical/audit purposes.
 * ============================================================================
 */

import { supabase } from './supabase';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type GiveawayStatus = 'active' | 'ended' | 'scheduled' | 'archived';

export interface IGiveaway {
  id: string;
  numeric_id?: number;
  title: string;
  prize_value?: number;
  status: GiveawayStatus;
  end_at?: string;
  description?: string;
  prize_image_url?: string;
  winner_entry_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IGiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  agreed_to_terms?: boolean;
  created_at?: string;
  entry_number?: number;
}

export interface IArchivedGiveaway extends IGiveaway {
  removal_date: string;
  removal_reason: string;
  removed_by_admin_id?: string | null;
}

export interface IArchivedEntry extends IGiveawayEntry {
  removal_date: string;
  removal_reason: string;
  archived_giveaway_id: string;
}

export interface IArchivalStats {
  total_archived_giveaways: number;
  total_archived_entries: number;
  expired_giveaways: number;
  admin_deleted_giveaways: number;
  manual_archived_giveaways: number;
  oldest_archived_date: string | null;
  newest_archived_date: string | null;
  total_archived_prize_value: number;
}

// ============================================================================
// ACTIVE GIVEAWAY OPERATIONS
// ============================================================================

/**
 * Fetch all active giveaways
 */
export async function fetchGiveaways(): Promise<IGiveaway[]> {
  try {
    const { data, error } = await supabase
      .from('giveaways')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching giveaways:', error);
    throw error;
  }
}

/**
 * Fetch a single giveaway by ID
 */
export async function fetchGiveawayById(id: string): Promise<IGiveaway | null> {
  try {
    const { data, error } = await supabase
      .from('giveaways')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching giveaway:', error);
    throw error;
  }
}

/**
 * Create a new giveaway
 */
export async function createGiveaway(
  giveaway: Partial<IGiveaway>,
): Promise<IGiveaway> {
  try {
    const { data, error } = await supabase
      .from('giveaways')
      .insert([giveaway])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating giveaway:', error);
    throw error;
  }
}

/**
 * Update an existing giveaway
 */
export async function updateGiveaway(
  id: string,
  updates: Partial<IGiveaway>,
): Promise<IGiveaway> {
  try {
    const { data, error } = await supabase
      .from('giveaways')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating giveaway:', error);
    throw error;
  }
}

/**
 * Archive a giveaway (soft delete with history preservation)
 * This archives both the giveaway and all its entries
 */
export async function archiveGiveaway(
  giveawayId: string,
  adminUserId?: string,
  reason: string = 'admin_deletion',
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('archive_giveaway_manual', {
      giveaway_id: giveawayId,
      admin_user_id: adminUserId || null,
      reason: reason,
    });

    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error('Error archiving giveaway:', error);
    throw error;
  }
}

/**
 * Delete a giveaway (alias for archiveGiveaway for backward compatibility)
 */
export async function deleteGiveaway(
  giveawayId: string,
  adminUserId?: string,
): Promise<boolean> {
  return archiveGiveaway(giveawayId, adminUserId, 'admin_deletion');
}

// ============================================================================
// ENTRY OPERATIONS
// ============================================================================

/**
 * Fetch all entries for a giveaway
 */
export async function fetchGiveawayEntries(
  giveawayId: string,
): Promise<IGiveawayEntry[]> {
  try {
    const { data, error } = await supabase
      .from('giveaway_entries')
      .select('*')
      .eq('giveaway_id', giveawayId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching giveaway entries:', error);
    throw error;
  }
}

/**
 * Create a new entry for a giveaway
 */
export async function createGiveawayEntry(
  entry: Partial<IGiveawayEntry>,
): Promise<IGiveawayEntry> {
  try {
    const { data, error } = await supabase
      .from('giveaway_entries')
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating giveaway entry:', error);
    throw error;
  }
}

/**
 * Set winner for a giveaway
 */
export async function setGiveawayWinner(
  giveawayId: string,
  entryId: string,
): Promise<IGiveaway> {
  try {
    const { data, error } = await supabase
      .from('giveaways')
      .update({
        winner_entry_id: entryId,
        status: 'ended',
      })
      .eq('id', giveawayId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting giveaway winner:', error);
    throw error;
  }
}

/**
 * Pick random winner(s) from giveaway entries using entry numbers
 * Generates random entry numbers (1, 2, 3, etc.) and selects those entries
 */
export async function pickRandomWinners(
  giveawayId: string,
  count: number = 1,
): Promise<IGiveawayEntry[]> {
  try {
    // Fetch all entries for the giveaway
    const entries = await fetchGiveawayEntries(giveawayId);

    if (entries.length === 0) {
      throw new Error('No entries found for this giveaway');
    }

    if (count > entries.length) {
      throw new Error(
        `Cannot pick ${count} winners from ${entries.length} entries`,
      );
    }

    // Get the maximum entry number
    const maxEntryNumber = entries.length;

    // Generate random entry numbers
    const selectedNumbers = new Set<number>();
    while (selectedNumbers.size < count) {
      const randomNumber = Math.floor(Math.random() * maxEntryNumber) + 1;
      selectedNumbers.add(randomNumber);
    }

    // Find entries matching the selected numbers
    const winners = entries.filter((entry) =>
      selectedNumbers.has(entry.entry_number || 0),
    );

    return winners;
  } catch (error) {
    console.error('Error picking random winners:', error);
    throw error;
  }
}

/**
 * Pick a single random winner by generating a random entry number
 * Returns the entry number that was selected and the winner entry
 */
export async function pickSingleRandomWinner(
  giveawayId: string,
): Promise<{ entryNumber: number; winner: IGiveawayEntry }> {
  try {
    // Fetch all entries for the giveaway
    const entries = await fetchGiveawayEntries(giveawayId);

    if (entries.length === 0) {
      throw new Error('No entries found for this giveaway');
    }

    // Generate random entry number between 1 and total entries
    const randomEntryNumber = Math.floor(Math.random() * entries.length) + 1;

    // Find the entry with this number
    const winner = entries.find(
      (entry) => entry.entry_number === randomEntryNumber,
    );

    if (!winner) {
      throw new Error(`Entry #${randomEntryNumber} not found`);
    }

    return {
      entryNumber: randomEntryNumber,
      winner: winner,
    };
  } catch (error) {
    console.error('Error picking single random winner:', error);
    throw error;
  }
}

// ============================================================================
// ARCHIVAL OPERATIONS
// ============================================================================

/**
 * Archive all expired giveaways
 * This should be run periodically (e.g., daily via cron job)
 */
export async function archiveExpiredGiveaways(): Promise<{
  archived_giveaways_count: number;
  archived_entries_count: number;
  error_message: string | null;
}> {
  try {
    const { data, error } = await supabase.rpc('archive_expired_giveaways');

    if (error) throw error;

    // The function returns a single row with the counts
    const result = Array.isArray(data) ? data[0] : data;

    return {
      archived_giveaways_count: result?.archived_giveaways_count || 0,
      archived_entries_count: result?.archived_entries_count || 0,
      error_message: result?.error_message || null,
    };
  } catch (error) {
    console.error('Error archiving expired giveaways:', error);
    throw error;
  }
}

/**
 * Get archival statistics
 */
export async function getArchivalStats(): Promise<IArchivalStats> {
  try {
    const { data, error } = await supabase.rpc('get_giveaway_archival_stats');

    if (error) throw error;

    // The function returns a single row
    const result = Array.isArray(data) ? data[0] : data;

    return {
      total_archived_giveaways: result?.total_archived_giveaways || 0,
      total_archived_entries: result?.total_archived_entries || 0,
      expired_giveaways: result?.expired_giveaways || 0,
      admin_deleted_giveaways: result?.admin_deleted_giveaways || 0,
      manual_archived_giveaways: result?.manual_archived_giveaways || 0,
      oldest_archived_date: result?.oldest_archived_date || null,
      newest_archived_date: result?.newest_archived_date || null,
      total_archived_prize_value: result?.total_archived_prize_value || 0,
    };
  } catch (error) {
    console.error('Error fetching archival stats:', error);
    throw error;
  }
}

/**
 * Fetch archived giveaways
 */
export async function fetchArchivedGiveaways(): Promise<IArchivedGiveaway[]> {
  try {
    const { data, error } = await supabase
      .from('giveaways_archive')
      .select('*')
      .order('removal_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching archived giveaways:', error);
    throw error;
  }
}

/**
 * Fetch a single archived giveaway with all its entries
 */
export async function fetchArchivedGiveawayWithEntries(
  giveawayId: string,
): Promise<{
  giveaway: IArchivedGiveaway | null;
  entries: IArchivedEntry[];
}> {
  try {
    const { data, error } = await supabase.rpc(
      'get_archived_giveaway_with_entries',
      {
        giveaway_id: giveawayId,
      },
    );

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;

    return {
      giveaway: result?.giveaway_data || null,
      entries: result?.entries_data || [],
    };
  } catch (error) {
    console.error('Error fetching archived giveaway with entries:', error);
    throw error;
  }
}

/**
 * Fetch archived entries for a specific giveaway
 */
export async function fetchArchivedEntries(
  giveawayId: string,
): Promise<IArchivedEntry[]> {
  try {
    const { data, error } = await supabase
      .from('giveaway_entries_archive')
      .select('*')
      .eq('giveaway_id', giveawayId)
      .order('removal_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching archived entries:', error);
    throw error;
  }
}

// ============================================================================
// EXPORT DEFAULT OBJECT (for backward compatibility)
// ============================================================================

const CrudGiveaway = {
  // Active operations
  fetchGiveaways,
  fetchGiveawayById,
  createGiveaway,
  updateGiveaway,
  archiveGiveaway,
  deleteGiveaway,

  // Entry operations
  fetchGiveawayEntries,
  createGiveawayEntry,
  setGiveawayWinner,

  // Archival operations
  archiveExpiredGiveaways,
  getArchivalStats,
  fetchArchivedGiveaways,
  fetchArchivedGiveawayWithEntries,
  fetchArchivedEntries,
};

export default CrudGiveaway;
