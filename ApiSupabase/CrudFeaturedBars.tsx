import { IFeaturedBar } from '../hooks/InterfacesGlobal';
import { supabase } from './supabase';

// Helper function to prepare data for database
const prepareFeaturedBarData = (bar: Partial<IFeaturedBar>) => {
  return {
    name: bar.name || '',
    address: bar.address || null,
    description: bar.description || null,
    phone_number: bar.phone_number || null,
    highlights: bar.highlights || [],
    website: bar.website || null,
    hours_of_operation: bar.hours_of_operation || null,
    special_features: bar.special_features || null,
    is_active: bar.is_active !== undefined ? bar.is_active : true,
    selection_weight: bar.selection_weight || 1,
  };
};

// Get all featured bars (for admin management)
export const GetAllFeaturedBars = async () => {
  try {
    const { data, error } = await supabase
      .from('featured_bars')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get active featured bars only
export const GetActiveFeaturedBars = async () => {
  try {
    const { data, error } = await supabase
      .from('featured_bars')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get random featured bar with weighted selection
export const GetRandomFeaturedBar = async () => {
  try {
    // First, try to get bars that haven't been featured recently (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentData, error: recentError } = await supabase
      .from('featured_bars')
      .select('*')
      .eq('is_active', true)
      .or(
        `last_featured_date.is.null,last_featured_date.lt.${sevenDaysAgo.toISOString()}`,
      )
      .order('featured_count', { ascending: true });

    if (recentError) {
      return { data: null, error: recentError };
    }

    // If we have bars that haven't been featured recently, use them
    let barsToChooseFrom = recentData;

    // If no "fresh" bars, fall back to all active bars
    if (!barsToChooseFrom || barsToChooseFrom.length === 0) {
      const { data: allData, error: allError } = await supabase
        .from('featured_bars')
        .select('*')
        .eq('is_active', true);

      if (allError) {
        return { data: null, error: allError };
      }

      barsToChooseFrom = allData;
    }

    if (!barsToChooseFrom || barsToChooseFrom.length === 0) {
      return {
        data: null,
        error: { message: 'No active featured bars found' },
      };
    }

    // Weighted random selection
    const totalWeight = barsToChooseFrom.reduce(
      (sum, bar) => sum + (bar.selection_weight || 1),
      0,
    );
    let randomWeight = Math.random() * totalWeight;

    let selectedBar = null;
    for (const bar of barsToChooseFrom) {
      randomWeight -= bar.selection_weight || 1;
      if (randomWeight <= 0) {
        selectedBar = bar;
        break;
      }
    }

    // Fallback to first bar if something goes wrong
    if (!selectedBar) {
      selectedBar = barsToChooseFrom[0];
    }

    // Update the selected bar's featured stats
    await supabase
      .from('featured_bars')
      .update({
        last_featured_date: new Date().toISOString(),
        featured_count: (selectedBar.featured_count || 0) + 1,
      })
      .eq('id', selectedBar.id);

    return { data: selectedBar, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Create new featured bar
export const CreateFeaturedBar = async (bar: Partial<IFeaturedBar>) => {
  try {
    const barData = prepareFeaturedBarData(bar);

    const { data, error } = await supabase
      .from('featured_bars')
      .insert(barData)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Update featured bar
export const UpdateFeaturedBar = async (
  id: number,
  bar: Partial<IFeaturedBar>,
) => {
  try {
    const barData = prepareFeaturedBarData(bar);

    const { data, error } = await supabase
      .from('featured_bars')
      .update(barData)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Delete featured bar
export const DeleteFeaturedBar = async (id: number) => {
  try {
    const { error } = await supabase
      .from('featured_bars')
      .delete()
      .eq('id', id);

    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
};

// Toggle active status
export const ToggleFeaturedBarStatus = async (
  id: number,
  isActive: boolean,
) => {
  try {
    const { data, error } = await supabase
      .from('featured_bars')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get featured bar by ID
export const GetFeaturedBarById = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('featured_bars')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Reset featured stats (for testing or maintenance)
export const ResetFeaturedBarStats = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('featured_bars')
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
