// ============================================
// EDGE FUNCTION: match-tournament-alerts
// ============================================
// Matches a tournament against all enabled search alerts
// Sends push notifications for new matches (with deduplication)
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

interface MatchRequest {
  tournament_id: string;
}

interface Tournament {
  uuid: string;
  id_unique_number: number;
  tournament_name: string;
  game_type: string;
  format: string;
  equipment: string;
  reports_to_fargo: boolean;
  tournament_fee: number;
  max_fargo: number;
  required_fargo_games: number | null;
  table_size: string;
  is_open_tournament: boolean;
  city: string | null;
  state: string | null;
  address: string | null;
  venue: string | null;
  start_date: string;
}

interface SearchAlert {
  id: string;
  user_id: string;
  alert_name: string | null;
  game_type: string | null;
  format: string | null;
  equipment: string | null;
  reports_to_fargo: boolean | null;
  max_entry_fee: number | null;
  min_fargo: number | null;
  max_fargo: number | null;
  required_fargo_games: number | null;
  table_size: string | null;
  is_open_tournament: boolean | null;
  city: string | null;
  state: string | null;
  location_text: string | null;
  date_from: string | null;
  date_to: string | null;
}

serve(async (req) => {
  try {
    // Initialize Supabase client with service role for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { tournament_id }: MatchRequest = await req.json();

    if (!tournament_id) {
      return new Response(
        JSON.stringify({ error: 'tournament_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fetch tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('uuid', tournament_id)
      .single();

    if (tournamentError || !tournament) {
      return new Response(
        JSON.stringify({
          error: 'Tournament not found',
          details: tournamentError,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fetch all enabled search alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('search_alerts')
      .select('*')
      .eq('is_enabled', true);

    if (alertsError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch alerts',
          details: alertsError,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const matches: string[] = [];
    const pushResults: any[] = [];

    // Match tournament against each alert
    for (const alert of alerts || []) {
      if (matchesTournamentToAlert(tournament, alert)) {
        // Try to insert match (dedupe via UNIQUE constraint)
        const { data: matchData, error: matchError } = await supabase
          .from('search_alert_matches')
          .insert({
            alert_id: alert.id,
            tournament_id: tournament.uuid,
            user_id: alert.user_id,
            push_status: 'pending',
          })
          .select()
          .single();

        // If insert succeeded (new match), send push notification
        if (!matchError && matchData) {
          matches.push(alert.id);

          // Fetch active push tokens for this user
          const { data: tokens } = await supabase
            .from('push_tokens')
            .select('*')
            .eq('user_id', alert.user_id)
            .is('disabled_at', null);

          if (tokens && tokens.length > 0) {
            // Send push notifications
            const pushPromises = tokens.map((token) =>
              sendPushNotification(
                token.expo_push_token,
                tournament,
                alert,
                supabase,
                matchData.id,
              ),
            );

            const results = await Promise.allSettled(pushPromises);
            pushResults.push(...results);

            // Update match status
            await supabase
              .from('search_alert_matches')
              .update({
                push_sent_at: new Date().toISOString(),
                push_status: 'sent',
              })
              .eq('id', matchData.id);
          } else {
            // No tokens available
            await supabase
              .from('search_alert_matches')
              .update({ push_status: 'no_tokens' })
              .eq('id', matchData.id);
          }
        } else if (matchError?.code === '23505') {
          // Duplicate match (already exists) - this is expected
          console.log(
            `Duplicate match skipped: alert ${alert.id}, tournament ${tournament_id}`,
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tournament_id,
        tournament_name: tournament.tournament_name,
        matches_found: matches.length,
        pushes_sent: pushResults.filter((r) => r.status === 'fulfilled').length,
        pushes_failed: pushResults.filter((r) => r.status === 'rejected')
          .length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in match-tournament-alerts:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});

// ============================================
// MATCHING LOGIC
// ============================================

function matchesTournamentToAlert(
  tournament: Tournament,
  alert: SearchAlert,
): boolean {
  // Exact match filters
  if (alert.game_type && tournament.game_type !== alert.game_type) return false;
  if (alert.format && tournament.format !== alert.format) return false;
  if (alert.equipment && tournament.equipment !== alert.equipment) return false;
  if (
    alert.reports_to_fargo !== null &&
    tournament.reports_to_fargo !== alert.reports_to_fargo
  )
    return false;
  if (alert.table_size && tournament.table_size !== alert.table_size)
    return false;
  if (
    alert.is_open_tournament !== null &&
    tournament.is_open_tournament !== alert.is_open_tournament
  )
    return false;

  // Cap filters (tournament value must be <= alert value)
  if (
    alert.max_entry_fee !== null &&
    tournament.tournament_fee > alert.max_entry_fee
  )
    return false;
  if (alert.max_fargo !== null && tournament.max_fargo > alert.max_fargo)
    return false;

  // Floor filter (tournament value must be >= alert value)
  if (alert.min_fargo !== null && tournament.max_fargo < alert.min_fargo)
    return false;

  // Required games filter (only if tournament has this field)
  if (
    alert.required_fargo_games !== null &&
    tournament.required_fargo_games !== null
  ) {
    if (tournament.required_fargo_games < alert.required_fargo_games)
      return false;
  }

  // Location filters - CASE INSENSITIVE
  if (alert.city) {
    const alertCity = alert.city.trim().toLowerCase();
    const tournamentCity = (tournament.city || '').trim().toLowerCase();
    if (alertCity !== tournamentCity) return false;
  }

  if (alert.state) {
    const alertState = alert.state.trim().toUpperCase();
    const tournamentState = (tournament.state || '').trim().toUpperCase();
    if (alertState !== tournamentState) return false;
  }

  // Location text - ILIKE search with null safety
  if (alert.location_text) {
    const searchText = alert.location_text.toLowerCase();
    const address = (tournament.address || '').toLowerCase();
    const venue = (tournament.venue || '').toLowerCase();

    if (!address.includes(searchText) && !venue.includes(searchText)) {
      return false;
    }
  }

  // Date range filters
  if (alert.date_from) {
    const tournamentDate = new Date(tournament.start_date);
    const fromDate = new Date(alert.date_from);
    if (tournamentDate < fromDate) return false;
  }

  if (alert.date_to) {
    const tournamentDate = new Date(tournament.start_date);
    const toDate = new Date(alert.date_to);
    if (tournamentDate > toDate) return false;
  }

  return true; // All filters passed!
}

// ============================================
// PUSH NOTIFICATION SENDING
// ============================================

async function sendPushNotification(
  expoPushToken: string,
  tournament: Tournament,
  alert: SearchAlert,
  supabase: any,
  matchId: string,
): Promise<void> {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: '🎱 New Tournament Match!',
      body: `${tournament.tournament_name} matches your "${
        alert.alert_name || 'Unnamed'
      }" alert`,
      data: {
        tournament_id: tournament.uuid,
        tournament_id_unique_number: tournament.id_unique_number,
        alert_id: alert.id,
        match_id: matchId,
        type: 'tournament_alert',
      },
      priority: 'high',
      channelId: 'tournament-alerts',
    };

    const response = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    // Check if token is invalid
    if (result.data && result.data[0]?.status === 'error') {
      const errorDetails = result.data[0].details;
      if (
        errorDetails?.error === 'DeviceNotRegistered' ||
        errorDetails?.error === 'InvalidCredentials'
      ) {
        // Mark token as disabled
        await supabase
          .from('push_tokens')
          .update({ disabled_at: new Date().toISOString() })
          .eq('expo_push_token', expoPushToken);

        console.log(`Disabled invalid token: ${expoPushToken}`);
      }
      throw new Error(`Push failed: ${errorDetails?.error || 'Unknown error'}`);
    }

    console.log(`Push sent successfully to ${expoPushToken}`);
  } catch (error) {
    console.error(`Failed to send push to ${expoPushToken}:`, error);
    throw error;
  }
}
