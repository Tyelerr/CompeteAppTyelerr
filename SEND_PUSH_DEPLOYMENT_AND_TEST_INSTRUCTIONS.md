# Send-Push Function Deployment and Testing Instructions

## Overview

The `send-push` Edge Function is ready to be deployed and tested. This function sends push notifications to users via Expo's push notification service.

## Prerequisites

- Supabase CLI installed and configured
- Project linked to Supabase
- Environment variables set up
- TestFlight app installed on your iOS device with notifications enabled

## Step 1: Deploy the Function

The function is already coded at `CompeteApp/supabase/functions/send-push/index.ts`.

### Deploy via Supabase CLI:

```bash
cd CompeteApp
npx supabase functions deploy send-push
```

### Or Deploy via Supabase Dashboard:

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Create a new function called `send-push`
4. Copy the contents of `CompeteApp/supabase/functions/send-push/index.ts`
5. Paste and deploy

## Step 2: Get Your User ID

You need your actual UUID user_id (not just username). You can find this by:

### Option A: Via Supabase Dashboard

1. Go to Authentication > Users
2. Find user "Tmoneyhill"
3. Copy the UUID (it looks like: `123e4567-e89b-12d3-a456-426614174000`)

### Option B: Via SQL Query

Run this in your Supabase SQL Editor:

```sql
SELECT id, username, user_name
FROM profiles
WHERE username = 'Tmoneyhill' OR user_name = 'Tmoneyhill';
```

## Step 3: Test the Function

### Method 1: Using the Test Script (Recommended)

1. Set your environment variables in your terminal:

```bash
# Windows PowerShell
$env:SUPABASE_URL="your_supabase_url_here"
$env:SUPABASE_ANON_KEY="your_anon_key_here"

# Then run:
cd CompeteApp
node get-user-id-and-test-push.js
```

### Method 2: Using curl

```bash
curl -X POST "YOUR_SUPABASE_URL/functions/v1/send-push" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "user_id": "YOUR_USER_UUID_HERE",
    "title": "Test Notification",
    "body": "This is a test push notification!",
    "data": {
      "type": "test",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }'
```

### Method 3: Using Postman or Insomnia

**URL:** `YOUR_SUPABASE_URL/functions/v1/send-push`

**Method:** POST

**Headers:**

- `Authorization`: `Bearer YOUR_SUPABASE_ANON_KEY`
- `Content-Type`: `application/json`
- `apikey`: `YOUR_SUPABASE_ANON_KEY`

**Body (JSON):**

```json
{
  "user_id": "YOUR_USER_UUID_HERE",
  "title": "Test Notification",
  "body": "This is a test push notification from send-push!",
  "data": {
    "type": "test",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Step 4: Check for Success

### Expected Response (Success):

```json
{
  "success": true,
  "message": "Sent 1/1 notifications successfully",
  "tokens_sent": 1,
  "tokens_successful": 1,
  "tokens_disabled": 0,
  "expo_response": {
    "data": [
      {
        "status": "ok",
        "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
      }
    ]
  },
  "results": [
    {
      "token_id": "...",
      "device_name": "iPhone",
      "device_os": "iOS",
      "status": "ok"
    }
  ]
}
```

### Expected Response (No Tokens):

```json
{
  "success": true,
  "message": "No active push tokens found for user",
  "tokens_sent": 0
}
```

This means you need to:

1. Open the TestFlight app on your iOS device
2. Enable notifications when prompted
3. The app should register your push token
4. Try sending the notification again

## Step 5: View Function Logs

### Via Supabase Dashboard:

1. Go to Edge Functions
2. Click on `send-push`
3. View the Logs tab

### Via CLI:

```bash
npx supabase functions logs send-push
```

## Troubleshooting

### Issue: "No active push tokens found"

**Solution:** Make sure you've:

- Opened the TestFlight app
- Granted notification permissions
- The app has registered your device token

### Issue: "DeviceNotRegistered" error

**Solution:** The push token is invalid or expired. The function will automatically disable it. Try:

- Reinstalling the TestFlight app
- Granting notifications permission again

### Issue: Function not found

**Solution:** Make sure the function is deployed:

```bash
npx supabase functions list
```

### Issue: Missing environment variables

**Solution:** The function uses these environment variables (automatically available in Edge Functions):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

These are automatically injected by Supabase, so you don't need to set them manually.

## What the Function Does

1. **Validates Input**: Checks that user_id, title, and body are provided
2. **Fetches Push Tokens**: Gets all active push tokens for the user from the `push_tokens` table
3. **Sends to Expo**: Sends the notification to Expo's push service
4. **Handles Responses**: Processes the response and disables invalid tokens
5. **Returns Results**: Provides detailed information about the send operation

## Next Steps

After successful testing:

1. ✅ Verify you received the notification on your iOS device
2. ✅ Check the function logs for any errors
3. ✅ Review the Expo response JSON
4. ✅ Confirm invalid tokens are being disabled properly

## Function Features

- ✅ Sends push notifications to iOS devices via Expo
- ✅ Supports multiple devices per user
- ✅ Automatically disables invalid/expired tokens
- ✅ Provides detailed logging
- ✅ Returns comprehensive response with Expo details
- ✅ Handles errors gracefully
- ✅ CORS enabled for web requests

## Security Notes

- The function uses the service role key (server-side only)
- Client apps should call this function with the anon key
- The function validates all inputs
- Invalid tokens are automatically cleaned up

---

**Created:** 2024
**Function Location:** `CompeteApp/supabase/functions/send-push/index.ts`
**Test Script:** `CompeteApp/get-user-id-and-test-push.js`
