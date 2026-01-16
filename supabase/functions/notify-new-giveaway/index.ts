import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  giveaway_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing required environment variables',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { giveaway_id }: NotifyRequest = await req.json();

    if (!giveaway_id) {
      return new Response(
        JSON.stringify({
          error: 'Missing giveaway_id',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log(`Notifying users about giveaway ${giveaway_id}`);

    // Fetch giveaway details
    const { data: giveaway, error: giveawayError } = await supabaseClient
      .from('giveaways')
      .select('title, prize_value, prize_details, description')
      .eq('id', giveaway_id)
      .single();

    if (giveawayError || !giveaway) {
      console.error('Error fetching giveaway:', giveawayError);
      return new Response(
        JSON.stringify({
          error: 'Giveaway not found',
          details: giveawayError,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Construct notification message
    const title = 'New Giveaway Added 🎁';
    const prizeText =
      giveaway.prize_value && Number(giveaway.prize_value) > 0
        ? `Prize: $${giveaway.prize_value}`
        : giveaway.prize_details ||
          giveaway.description ||
          'Exciting prize available!';
    const body = `${giveaway.title} - ${prizeText}`;

    console.log(`Sending notification: "${title}" - "${body}"`);

    // Call the deployed send-push function
    const sendPushUrl = `${supabaseUrl}/functions/v1/send-push`;

    console.log(`Broadcasting giveaway notification (broadcast=true)`);

    const sendPushResponse = await fetch(sendPushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        broadcast: true,
        title,
        body,
        data: {
          giveaway_id,
          type: 'giveaway_notification',
        },
      }),
    });

    const sendPushResult = await sendPushResponse.json().catch(() => ({}));

    console.log('Send-push response:', JSON.stringify(sendPushResult, null, 2));

    if (!sendPushResponse.ok) {
      console.error('Send-push function failed:', sendPushResult);
      return new Response(
        JSON.stringify({
          error: 'Failed to send notifications',
          send_push_response: sendPushResult,
        }),
        {
          status: sendPushResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const response = {
      success: true,
      notified_count:
        sendPushResult.notified_count ??
        sendPushResult.tokens_sent ??
        sendPushResult.success_count ??
        sendPushResult.sent ??
        0,
      send_push_response: sendPushResult,
    };

    console.log(
      `Giveaway notification summary: ${JSON.stringify(response, null, 2)}`,
    );

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in notify-new-giveaway function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
