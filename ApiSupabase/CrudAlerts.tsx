import { IAlert } from '../hooks/InterfacesGlobal';
import { supabase } from './supabase';

/**
 * Maps IAlert interface (with legacy fields) to search_alerts table schema
 * Legacy field names are mapped to new schema field names
 */
const AlertIAlertToObjectForData = (alert: IAlert) => {
  return {
    // Map legacy fields to new schema
    user_id: alert.creator_id || alert.user_id,
    alert_name: alert.name || alert.alert_name,
    game_type: alert.preffered_game || alert.game_type,
    format: alert.tournament_format || alert.format,
    table_size: alert.table_size,
    min_fargo: alert.fargo_range_from || alert.min_fargo,
    max_fargo: alert.fargo_range_to || alert.max_fargo,
    max_entry_fee: alert.max_entry_fee,
    location_text: alert.location || alert.location_text,
    city: alert.city,
    state: alert.state,
    reports_to_fargo: alert.reports_to_fargo,
    is_open_tournament:
      alert.checked_open_tournament ?? alert.is_open_tournament,
    required_fargo_games: alert.required_fargo_games,
    equipment: alert.equipment,
    date_from: alert.date_from,
    date_to: alert.date_to,
    is_enabled: alert.is_enabled ?? true,
  };
};

/**
 * Maps search_alerts table data back to IAlert interface
 * Includes both new and legacy field names for backward compatibility
 */
const MapSearchAlertToIAlert = (dbAlert: any): IAlert => {
  return {
    // New schema fields
    id: dbAlert.id,
    user_id: dbAlert.user_id,
    alert_name: dbAlert.alert_name,
    game_type: dbAlert.game_type,
    format: dbAlert.format,
    equipment: dbAlert.equipment,
    reports_to_fargo: dbAlert.reports_to_fargo,
    max_entry_fee: dbAlert.max_entry_fee,
    min_fargo: dbAlert.min_fargo,
    max_fargo: dbAlert.max_fargo,
    required_fargo_games: dbAlert.required_fargo_games,
    table_size: dbAlert.table_size,
    is_open_tournament: dbAlert.is_open_tournament,
    city: dbAlert.city,
    state: dbAlert.state,
    location_text: dbAlert.location_text,
    date_from: dbAlert.date_from,
    date_to: dbAlert.date_to,
    is_enabled: dbAlert.is_enabled,
    created_at: dbAlert.created_at,
    updated_at: dbAlert.updated_at,

    // Legacy fields for backward compatibility with UI
    creator_id: dbAlert.user_id,
    name: dbAlert.alert_name,
    preffered_game: dbAlert.game_type,
    tournament_format: dbAlert.format,
    fargo_range_from: dbAlert.min_fargo || 0,
    fargo_range_to: dbAlert.max_fargo || 0,
    location: dbAlert.location_text,
    checked_open_tournament: dbAlert.is_open_tournament,
  } as IAlert;
};

export const CreateAlert = async (newAlert: IAlert) => {
  try {
    const { data, error } = await supabase
      .from('search_alerts')
      .insert(AlertIAlertToObjectForData(newAlert))
      .select();

    return { error, data };
  } catch (error) {
    return { data: null, error };
  }
};

export const UpdateAlert = async (alertId: string, newDetailsAlert: IAlert) => {
  try {
    const { data, error } = await supabase
      .from('search_alerts')
      .update(AlertIAlertToObjectForData(newDetailsAlert))
      .eq('id', alertId)
      .select();

    return { error, data };
  } catch (error) {
    return { data: null, error };
  }
};

export const DeleteAlert = async (alertId: string) => {
  try {
    const { data, error } = await supabase
      .from('search_alerts')
      .delete()
      .eq('id', alertId);

    return { error, data };
  } catch (error) {
    return { data: null, error };
  }
};

export const GetAlerts = async (user_id: string): Promise<IAlert[]> => {
  try {
    const { data, error } = await supabase
      .from('search_alerts')
      .select('*')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })
      .limit(10);

    const alerts: IAlert[] = [];
    if (data !== null) {
      for (let i = 0; i < data.length; i++) {
        alerts.push(MapSearchAlertToIAlert(data[i]));
      }
    }
    return alerts;
  } catch (error) {
    return [];
  }
};

export const GetAlertById = async (alertId: string): Promise<IAlert | null> => {
  try {
    const { data, error } = await supabase
      .from('search_alerts')
      .select('*')
      .eq('id', alertId);

    if (data && data.length > 0) {
      return MapSearchAlertToIAlert(data[0]);
    }
    return null;
  } catch (error) {
    return null;
  }
};
