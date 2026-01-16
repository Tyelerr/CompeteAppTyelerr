import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PushRequest {
  user_id?: string;
  broadcast?: boolean;
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound?: string;
  data?: Record<string, any>;
}

interface ExpoPushResponse {
  data?: Array<{
    status: string;
    id?: string;
    message?: string;
    details?: any;
  }>;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse request body
    const { user_id, broadcast, title, body, data }: PushRequest =
      await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: title, body',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!broadcast && !user_id) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required field: user_id (required when broadcast=false)',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (broadcast) {
      console.log(
        `Broadcasting push notification to all users: "${title}" - "${body}"`,
      );
    } else {
      console.log(
        `Sending push notification to user ${user_id}: "${title}" - "${body}"`,
      );
    }

    // Get active push tokens
    let query = supabaseClient
      .from('push_tokens')
      .select('id, token, device_os, device_name, user_id')
      .is('disabled_at', null);

    if (!broadcast) {
      query = query.eq('user_id', user_id);
    }

    const { data: tokens, error: tokenError } = await query;

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch push tokens',
          details: tokenError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log(
        `No active push tokens found${
          broadcast ? ' for broadcast' : ` for user ${user_id}`
        }`,
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active push tokens found',
          tokens_sent: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log(
      `Found ${tokens.length} active tokens${
        broadcast ? ' for broadcast' : ` for user ${user_id}`
      }`,
    );

    // Prepare push messages for each token
    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token.token,
      title,
      body,
      sound: 'default',
      data: data || {},
    }));

    // Send to Expo push service
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const expoResult: ExpoPushResponse = await expoResponse.json();

    console.log('Expo push response:', JSON.stringify(expoResult, null, 2));

    // Process responses and handle token hygiene
    const results = [];
    let successCount = 0;
    let invalidTokenCount = 0;

    if (expoResult.data) {
      for (let i = 0; i < expoResult.data.length; i++) {
        const pushResult = expoResult.data[i];
        const token = tokens[i];

        results.push({
          token_id: token.id,
          device_name: token.device_name,
          device_os: token.device_os,
          status: pushResult.status,
          message: pushResult.message,
          details: pushResult.details,
        });

        if (pushResult.status === 'ok') {
          successCount++;
        } else if (
          pushResult.status === 'error' &&
          (pushResult.message?.includes('DeviceNotRegistered') ||
            pushResult.message?.includes('invalid') ||
            pushResult.details?.error === 'DeviceNotRegistered')
        ) {
          // Mark invalid token as disabled
          console.log(
            `Disabling invalid token ${token.id} (${token.device_name})`,
          );
          await supabaseClient
            .from('push_tokens')
            .update({ disabled_at: new Date().toISOString() })
            .eq('id', token.id);
          invalidTokenCount++;
        }
      }
    }

    // Handle any errors from Expo
    if (expoResult.errors && expoResult.errors.length > 0) {
      console.error('Expo push errors:', expoResult.errors);
    }

    const response = {
      success: successCount > 0,
      message: `Sent ${successCount}/${
        tokens.length
      } notifications successfully${
        invalidTokenCount > 0
          ? `, disabled ${invalidTokenCount} invalid tokens`
          : ''
      }`,
      tokens_sent: tokens.length,
      tokens_successful: successCount,
      tokens_disabled: invalidTokenCount,
      expo_response: expoResult,
      results,
    };

    console.log(
      `Push notification summary: ${JSON.stringify(response, null, 2)}`,
    );

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in send-push function:', error);
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
