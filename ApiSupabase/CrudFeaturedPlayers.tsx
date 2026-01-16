import { IFeaturedPlayer } from '../hooks/InterfacesGlobal';
import { supabase } from './supabase';

// Helper function to prepare data for database
const prepareFeaturedPlayerData = (player: Partial<IFeaturedPlayer>) => {
  return {
    name: player.name || '',
    label_about_the_person: player.label_about_the_person || null,
    address: player.address || null,
    description: player.description || null,
    phone_number: player.phone_number || null,
    achievements: player.achievements || [],
    is_active: player.is_active !== undefined ? player.is_active : true,
    selection_weight: player.selection_weight || 1,
  };
};

// Get all featured players (for admin management)
export const GetAllFeaturedPlayers = async () => {
  try {
    const { data, error } = await supabase
      .from('featured_players')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get active featured players only
export const GetActiveFeaturedPlayers = async () => {
  try {
    const { data, error } = await supabase
      .from('featured_players')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get random featured player with weighted selection
export const GetRandomFeaturedPlayer = async () => {
  try {
    // First, try to get players that haven't been featured recently (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentData, error: recentError } = await supabase
      .from('featured_players')
      .select('*')
      .eq('is_active', true)
      .or(
        `last_featured_date.is.null,last_featured_date.lt.${sevenDaysAgo.toISOString()}`,
      )
      .order('featured_count', { ascending: true });

    if (recentError) {
      return { data: null, error: recentError };
    }

    // If we have players that haven't been featured recently, use them
    let playersToChooseFrom = recentData;

    // If no "fresh" players, fall back to all active players
    if (!playersToChooseFrom || playersToChooseFrom.length === 0) {
      const { data: allData, error: allError } = await supabase
        .from('featured_players')
        .select('*')
        .eq('is_active', true);

      if (allError) {
        return { data: null, error: allError };
      }

      playersToChooseFrom = allData;
    }

    if (!playersToChooseFrom || playersToChooseFrom.length === 0) {
      return {
        data: null,
        error: { message: 'No active featured players found' },
      };
    }

    // Weighted random selection
    const totalWeight = playersToChooseFrom.reduce(
      (sum, player) => sum + (player.selection_weight || 1),
      0,
    );
    let randomWeight = Math.random() * totalWeight;

    let selectedPlayer = null;
    for (const player of playersToChooseFrom) {
      randomWeight -= player.selection_weight || 1;
      if (randomWeight <= 0) {
        selectedPlayer = player;
        break;
      }
    }

    // Fallback to first player if something goes wrong
    if (!selectedPlayer) {
      selectedPlayer = playersToChooseFrom[0];
    }

    // Update the selected player's featured stats
    await supabase
      .from('featured_players')
      .update({
        last_featured_date: new Date().toISOString(),
        featured_count: (selectedPlayer.featured_count || 0) + 1,
      })
      .eq('id', selectedPlayer.id);

    return { data: selectedPlayer, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Create new featured player
export const CreateFeaturedPlayer = async (
  player: Partial<IFeaturedPlayer>,
) => {
  try {
    const playerData = prepareFeaturedPlayerData(player);

    const { data, error } = await supabase
      .from('featured_players')
      .insert(playerData)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Update featured player
export const UpdateFeaturedPlayer = async (
  id: number,
  player: Partial<IFeaturedPlayer>,
) => {
  try {
    const playerData = prepareFeaturedPlayerData(player);

    const { data, error } = await supabase
      .from('featured_players')
      .update(playerData)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Delete featured player
export const DeleteFeaturedPlayer = async (id: number) => {
  try {
    const { error } = await supabase
      .from('featured_players')
      .delete()
      .eq('id', id);

    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
};

// Toggle active status
export const ToggleFeaturedPlayerStatus = async (
  id: number,
  isActive: boolean,
) => {
  try {
    const { data, error } = await supabase
      .from('featured_players')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get featured player by ID
export const GetFeaturedPlayerById = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('featured_players')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Reset featured stats (for testing or maintenance)
export const ResetFeaturedPlayerStats = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('featured_players')
      .update({
        last_featured_date: null,
        featured_count: 0,
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};
