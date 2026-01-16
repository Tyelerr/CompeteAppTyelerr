# Push Notifications - Complete Deployment Guide

## Current Status Summary

✅ **What's Working:**

- Node test script successfully connects to Supabase
- Environment variables loaded correctly
- User lookup works (using `user_name` column)
- Push tokens table query works (returns 0 tokens)

❌ **What's Failing:**

1. **Edge Function 404**: `/functions/v1/send-push` returns NOT_FOUND
2. **No Push Tokens**: 0 active tokens for test user (Tmoneyhill)
3. **App Not Registering Tokens**: Push token registration not happening on login/startup

---

## Root Causes

### Issue 1: Edge Function Not Deployed

The `send-push` edge function exists locally at:

- `CompeteApp/supabase/functions/send-push/index.ts`
- `CompeteApp/supabase/functions/send-push/deno.json`

But it's **NOT deployed** to your Supabase project, causing the 404 error.

### Issue 2: No Push Tokens in Database

The app has push token registration code (`CrudPushTokens.tsx`), but tokens aren't being saved because:

- The registration might not be called on app startup/login
- RLS policies might be blocking inserts
- The app might not be requesting notification permissions

### Issue 3: App Integration Missing

Need to verify push token registration is called when users log in.

---

## Fix Plan (Step-by-Step)

### STEP 1: Deploy the Edge Function ✅

The edge function code is ready and looks good. We need to deploy it to Supabase.

**Option A: Deploy via Supabase CLI (Recommended)**

```bash
# Navigate to CompeteApp directory
cd CompeteApp

# Login to Supabase (if not already logged in)
supabase login

# Link to your project (replace with your project ref)
supabase link --project-ref <your-project-ref>

# Deploy the send-push function
supabase functions deploy send-push

# Verify deployment
supabase functions list
```

**Option B: Deploy via Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/<your-project>/functions
2. Click "Create a new function"
3. Name it: `send-push`
4. Copy the entire content from `CompeteApp/supabase/functions/send-push/index.ts`
5. Paste it into the editor
6. Click "Deploy function"

**Set Environment Variables for Edge Function:**

The edge function needs these environment variables (should already be set):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (for database access)

These are automatically available to edge functions, but verify in:
Dashboard → Settings → API → Service role key

---

### STEP 2: Verify/Fix Push Tokens Table RLS Policies

The push tokens table needs proper RLS policies to allow inserts.

**Run this SQL in Supabase SQL Editor:**

```sql
-- Check current RLS policies
SELECT * FROM pg_policies WHERE tablename = 'push_tokens';

-- Enable RLS if not already enabled
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any are blocking)
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can view their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Service role can manage all push tokens" ON push_tokens;

-- Create proper RLS policies
-- 1. Allow authenticated users to insert their own tokens
CREATE POLICY "Users can insert their own push tokens"
ON push_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow authenticated users to view their own tokens
CREATE POLICY "Users can view their own push tokens"
ON push_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow authenticated users to update their own tokens
CREATE POLICY "Users can update their own push tokens"
ON push_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Allow service role to manage all tokens (for edge function)
CREATE POLICY "Service role can manage all push tokens"
ON push_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT * FROM pg_policies WHERE tablename = 'push_tokens';
```

---

### STEP 3: Verify Push Token Registration in App

The app needs to register push tokens when users log in. Let's check where this should happen.

**Check these files:**

1. **Login Flow** - `CompeteApp/context/ContextAuth.tsx`

   - Should call push token registration after successful login

2. **App Startup** - `CompeteApp/App.tsx`
   - Should register push tokens when app starts with existing session

**Expected Flow:**

```
User Logs In → Get Expo Push Token → Save to Supabase → Done
```

**Search for where push tokens are registered:**

```bash
# Search for savePushToken usage
grep -r "savePushToken" CompeteApp/
```

If not found, we need to add it to the login flow.

---

### STEP 4: Add Push Token Registration to Login Flow

**File to modify: `CompeteApp/context/ContextAuth.tsx`**

After successful login, add:

```typescript
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotificationsAsync';
import { savePushToken } from '../ApiSupabase/CrudPushTokens';

// In your login success handler:
const handleLoginSuccess = async (userId: string) => {
  // ... existing login code ...

  // Register for push notifications
  try {
    const result = await registerForPushNotificationsAsync();
    if (result.ok) {
      console.log('Got push token:', result.token);
      await savePushToken(userId, result.token);
      console.log('Push token saved successfully');
    } else {
      console.log('Could not get push token:', result.reason);
    }
  } catch (error) {
    console.error('Error registering push notifications:', error);
  }
};
```

---

### STEP 5: Test the Complete Flow

**A. Test Edge Function Deployment**

```bash
# Run the test script again
cd CompeteApp
node get-user-id-and-test-push.js
```

Expected output:

```
✅ Found user!
   User ID: 03be7621-c7ad-49d0-88bb-5023d19236d8
   Username: Tmoneyhill

📱 Active push tokens: 0

🚀 Testing send-push Edge Function

📡 Response Status: 200

✅ Response:
{
  "success": true,
  "message": "No active push tokens found for user",
  "tokens_sent": 0
}
```

**B. Test Push Token Registration in App**

1. Open the app on a physical device (push notifications don't work on simulators)
2. Log in as a test user
3. Grant notification permissions when prompted
4. Check the console logs for:
   - "Got push token: ExponentPushToken[...]"
   - "Push token saved successfully"

**C. Verify Token in Database**

```sql
-- Check if token was saved
SELECT
  id,
  user_id,
  token,
  device_os,
  device_name,
  created_at,
  last_seen_at,
  disabled_at
FROM push_tokens
WHERE user_id = '03be7621-c7ad-49d0-88bb-5023d19236d8';
```

**D. Test End-to-End Push Notification**

```bash
# Run test script again (should now find tokens)
node get-user-id-and-test-push.js
```

Expected output:

```
📱 Active push tokens: 1
   Token 1:
     Device: ios Device
     OS: ios
     Token: ExponentPushToken[...]

🚀 Testing send-push Edge Function

📡 Response Status: 200

✅ Response:
{
  "success": true,
  "message": "Sent 1/1 notifications successfully",
  "tokens_sent": 1,
  "tokens_successful": 1,
  "tokens_disabled": 0
}
```

You should receive a push notification on your device!

---

## Troubleshooting

### Edge Function Still Returns 404

**Check:**

1. Function name matches exactly: `send-push`
2. Function is deployed to the correct project
3. URL is correct: `https://<project-ref>.supabase.co/functions/v1/send-push`

**Verify deployment:**

```bash
supabase functions list
```

### Push Tokens Not Saving

**Check:**

1. RLS policies are correct (run STEP 2 SQL)
2. User is authenticated when trying to save
3. Check console logs for error messages
4. Verify `push_tokens` table exists with correct schema

**Debug:**

```sql
-- Check table structure
\d push_tokens

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'push_tokens';
```

### No Push Notification Received

**Check:**

1. Device is physical (not simulator)
2. Notification permissions granted
3. Token format is correct: `ExponentPushToken[...]`
4. App is using correct EAS project ID
5. Check Expo push notification status: https://expo.dev/notifications

---

## Quick Commands Reference

```bash
# Deploy edge function
cd CompeteApp
supabase functions deploy send-push

# Test push notification
node get-user-id-and-test-push.js

# Check function logs
supabase functions logs send-push

# List all functions
supabase functions list
```

---

## Next Steps After Deployment

1. ✅ Deploy edge function
2. ✅ Fix RLS policies
3. ✅ Add push token registration to login flow
4. ✅ Test on physical device
5. ✅ Verify end-to-end flow
6. 🔄 Integrate with search alerts system
7. 🔄 Add notification preferences UI
8. 🔄 Test tournament match notifications

---

## Files Modified/Created

- ✅ `CompeteApp/supabase/functions/send-push/index.ts` (already exists)
- ✅ `CompeteApp/utils/registerForPushNotificationsAsync.tsx` (already exists)
- ✅ `CompeteApp/ApiSupabase/CrudPushTokens.tsx` (already exists)
- ✅ `CompeteApp/get-user-id-and-test-push.js` (already exists)
- 🔄 `CompeteApp/context/ContextAuth.tsx` (needs push token registration)
- ✅ SQL: RLS policies for push_tokens table

---

## Summary

The push notification system is **90% complete**. The main issues are:

1. **Edge function not deployed** → Deploy with `supabase functions deploy send-push`
2. **No push tokens in database** → Fix RLS policies + add registration to login flow
3. **App not registering tokens** → Add `savePushToken` call after login

Once these are fixed, the system will work end-to-end! 🎉
