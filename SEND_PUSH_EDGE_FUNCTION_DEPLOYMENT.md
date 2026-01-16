# Send-Push Edge Function Deployment Guide

## Problem

The `send-push` Edge Function exists locally at `supabase/functions/send-push/index.ts` but is not deployed to the Supabase project, causing 404 errors when the app tries to call it.

## Solution

Deploy the Edge Function using npx (no Supabase CLI installation required).

## Deployment Steps

### Step 1: Login to Supabase

```bash
cd CompeteApp
npx supabase login
```

This will open a browser window for authentication.

### Step 2: Link to Your Project

```bash
npx supabase link --project-ref ofcroxehpuiylonrakrf
```

### Step 3: Deploy the Edge Function

```bash
npx supabase functions deploy send-push
```

### Step 4: Verify Deployment

```bash
npx supabase functions list
```

You should see `send-push` in the list of deployed functions.

## Edge Function Details

**Function Name:** send-push  
**Location:** `CompeteApp/supabase/functions/send-push/index.ts`  
**Purpose:** Sends push notifications to users via Expo Push Service

**Key Features:**

- Accepts user_id, title, body, and optional data
- Fetches active push tokens for the user
- Sends notifications via Expo Push Service
- Handles token hygiene (disables invalid tokens)
- Returns detailed response with success/failure counts

## Testing After Deployment

Once deployed, you can test the function using:

```bash
cd CompeteApp
node get-user-id-and-test-push.js
```

Or test directly via the Supabase dashboard:

1. Go to Edge Functions in your Supabase dashboard
2. Select `send-push`
3. Use the "Invoke" tab to test with sample data

## Sample Test Payload

```json
{
  "user_id": "your-user-uuid-here",
  "title": "Test Notification",
  "body": "This is a test push notification",
  "data": {
    "type": "test",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Troubleshooting

### 404 Error After Deployment

- Wait 1-2 minutes for the function to fully deploy
- Check the function URL in Supabase dashboard
- Verify the function name matches exactly: `send-push`

### Authentication Issues

- Make sure you're logged in: `npx supabase login`
- Check you're linked to the correct project: `npx supabase projects list`

### Deployment Fails

- Verify you're in the CompeteApp directory
- Check that the function folder exists: `dir supabase\functions\send-push`
- Ensure index.ts and deno.json are present

## Function URL

After deployment, the function will be available at:

```
https://ofcroxehpuiylonrakrf.supabase.co/functions/v1/send-push
```

## Environment Variables Required

The function uses these environment variables (automatically available in Supabase):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

These are automatically injected by Supabase and don't need to be configured manually.

## Deployment Complete Checklist

- [ ] Function deployed successfully
- [ ] Function appears in `supabase functions list`
- [ ] Function accessible via URL (no 404)
- [ ] Test notification sent successfully
- [ ] Push tokens table has data
- [ ] Invalid tokens are being disabled properly

## Next Steps After Deployment

1. Test the function with a real user ID
2. Verify push notifications are received on mobile devices
3. Monitor function logs in Supabase dashboard
4. Set up any necessary RLS policies for push_tokens table (if not already done)

## Related Files

- Function code: `CompeteApp/supabase/functions/send-push/index.ts`
- Function config: `CompeteApp/supabase/functions/send-push/deno.json`
- Test script: `CompeteApp/get-user-id-and-test-push.js`
- Push tokens CRUD: `CompeteApp/ApiSupabase/CrudPushTokens.tsx`
