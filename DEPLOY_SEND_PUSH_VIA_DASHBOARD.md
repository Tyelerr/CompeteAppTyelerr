# Deploy send-push Edge Function via Supabase Dashboard

## ✅ Current Status

- **Function exists locally**: `CompeteApp/supabase/functions/send-push/`
- **Function code verified**: Correctly queries `token` column with `disabled_at IS NULL` filter
- **Problem**: Function NOT deployed to production (404 at https://ofcroxehpuiylonrakrf.supabase.co/functions/v1/send-push)

## 🎯 Goal

Deploy the `send-push` function so it's accessible at:

```
https://ofcroxehpuiylonrakrf.supabase.co/functions/v1/send-push
```

## 📋 Manual Deployment Steps

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select the **CompeteDB** project (ofcroxehpuiylonrakrf)

### Step 2: Navigate to Edge Functions

1. In the left sidebar, click on **Edge Functions**
2. You should see existing functions:
   - admin-create-user
   - update-user-email
   - request-email-change

### Step 3: Create New Function

1. Click the **"New Edge Function"** or **"Create Function"** button
2. Enter function name: `send-push`
3. Click **Create**

### Step 4: Copy Function Code

1. Open the file: `CompeteApp/supabase/functions/send-push/index.ts`
2. Copy ALL the code from that file
3. Paste it into the Supabase Dashboard code editor

**The code should be:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PushRequest {
  user_id: string;
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
    const { user_id, title, body, data }: PushRequest = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: user_id, title, body',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log(
      `Sending push notification to user ${user_id}: "${title}" - "${body}"`,
    );

    // Get active push tokens for this user
    const { data: tokens, error: tokenError } = await supabaseClient
      .from('push_tokens')
      .select('id, token, device_os, device_name')
      .eq('user_id', user_id)
      .is('disabled_at', null);

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
      console.log(`No active push tokens found for user ${user_id}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active push tokens found for user',
          tokens_sent: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log(`Found ${tokens.length} active tokens for user ${user_id}`);

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
```

### Step 5: Deploy the Function

1. Click **"Deploy"** or **"Save"** button in the dashboard
2. Wait for deployment to complete (usually takes 10-30 seconds)
3. You should see a success message

### Step 6: Verify Deployment

1. Go back to the Edge Functions list
2. Confirm `send-push` now appears in the list with status **ACTIVE**
3. Note the function URL: `https://ofcroxehpuiylonrakrf.supabase.co/functions/v1/send-push`

### Step 7: Test the Function

Run this test to verify it works:

```bash
node CompeteApp/get-user-id-and-test-push.js
```

Or manually test with curl:

```bash
curl -X POST https://ofcroxehpuiylonrakrf.supabase.co/functions/v1/send-push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "user_id": "03be7621-c7ad-49d0-88bb-5023d19236d8",
    "title": "Test Notification",
    "body": "Testing push notifications!"
  }'
```

## ✅ Success Criteria

After deployment, you should:

1. See `send-push` in the Edge Functions list (ACTIVE status)
2. Get a 200 response (not 404) when calling the function
3. Receive push notifications on your device

## 🔍 Troubleshooting

### If you still get 404:

- Refresh the Edge Functions page
- Wait 1-2 minutes for DNS propagation
- Check the function name is exactly `send-push` (no typos)

### If deployment fails:

- Check for syntax errors in the code
- Ensure you copied the COMPLETE code
- Try deploying again

### If function deploys but doesn't work:

- Check the function logs in the Supabase dashboard
- Verify your push_tokens table has data
- Confirm the `token` column exists (not `push_token`)

## 📝 Notes

- The function uses environment variables (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) which are automatically available in Supabase Edge Functions
- The function correctly queries the `token` column with `disabled_at IS NULL` filter
- Token hygiene is built-in: invalid tokens are automatically disabled

## 🎉 Once Deployed

Your push notifications system will be fully operational!
