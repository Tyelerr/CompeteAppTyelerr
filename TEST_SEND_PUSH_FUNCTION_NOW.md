# Test Send-Push Edge Function - Quick Guide

## Status: ✅ Function is Deployed and Live

The `send-push` edge function is **already deployed** and reachable at your Supabase endpoint.

**Confirmation:** The endpoint returns `401 (Unauthorized)` instead of `404 (Not Found)`, which confirms:

- ✅ The function exists
- ✅ The function is live and deployed
- ✅ The function is checking for authorization (working as expected)

## Next Step: Test with Valid Authorization

You need to call the function with a valid `Authorization` header using your **anon key** or **service role key**.

---

## Option 1: Using the Automated Test Script (Recommended)

### Step 1: Set Environment Variables

Open PowerShell in the `CompeteApp` directory and run:

```powershell
# Set your Supabase credentials
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="your-anon-key-here"

# Or use EXPO_PUBLIC versions if you have those
$env:EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

### Step 2: Run the Test Script

```powershell
cd CompeteApp
node get-user-id-and-test-push.js
```

This script will:

1. Look up the user ID for username "Tmoneyhill"
2. Check for active push tokens
3. Send a test push notification
4. Display the response

---

## Option 2: Using curl (Manual Test)

### Step 1: Get Your User ID

Go to your Supabase Dashboard → SQL Editor and run:

```sql
SELECT id, user_name
FROM profiles
WHERE user_name = 'Tmoneyhill';
```

Copy the `id` (UUID format).

### Step 2: Send Test Request

Replace the placeholders and run in PowerShell:

```powershell
$url = "https://YOUR_PROJECT.supabase.co/functions/v1/send-push"
$headers = @{
    "Authorization" = "Bearer YOUR_ANON_KEY_HERE"
    "Content-Type" = "application/json"
    "apikey" = "YOUR_ANON_KEY_HERE"
}
$body = @{
    user_id = "YOUR_USER_UUID_HERE"
    title = "Test Notification"
    body = "This is a test push notification!"
    data = @{
        type = "test"
        timestamp = (Get-Date).ToString("o")
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
```

---

## Option 3: Using Postman or Insomnia

### Request Configuration:

**Method:** `POST`

**URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/send-push`

**Headers:**

```
Authorization: Bearer YOUR_ANON_KEY_HERE
Content-Type: application/json
apikey: YOUR_ANON_KEY_HERE
```

**Body (JSON):**

```json
{
  "user_id": "YOUR_USER_UUID_HERE",
  "title": "Test Notification",
  "body": "This is a test push notification!",
  "data": {
    "type": "test",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Expected Responses

### ✅ Success (With Active Tokens):

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

### ⚠️ Success (No Active Tokens):

```json
{
  "success": true,
  "message": "No active push tokens found for user",
  "tokens_sent": 0
}
```

**This means:**

- The function works correctly
- The user hasn't registered any push tokens yet
- You need to open the TestFlight app and grant notification permissions

### ❌ Error (Missing Authorization):

```json
{
  "error": "Unauthorized"
}
```

**This means:** You forgot to include the Authorization header or apikey.

### ❌ Error (Invalid User ID):

```json
{
  "error": "user_id is required"
}
```

**This means:** The user_id parameter is missing or invalid.

---

## Where to Find Your Credentials

### Supabase URL:

1. Go to Supabase Dashboard
2. Click on your project
3. Go to Settings → API
4. Copy the "Project URL"

### Anon Key:

1. Same location (Settings → API)
2. Copy the "anon public" key

### Service Role Key (Optional, for server-side only):

1. Same location (Settings → API)
2. Copy the "service_role" key
3. ⚠️ **Never expose this in client code!**

---

## Troubleshooting

### Issue: "No active push tokens found"

**Solution:**

1. Open the TestFlight app on your iOS device
2. Grant notification permissions when prompted
3. The app should automatically register your push token
4. Try sending the notification again

### Issue: "DeviceNotRegistered" error

**Solution:**

- The push token is invalid or expired
- The function will automatically disable it
- Reinstall the TestFlight app and grant permissions again

### Issue: Still getting 401 Unauthorized

**Check:**

1. ✅ Authorization header is present: `Bearer YOUR_KEY`
2. ✅ apikey header is present: `YOUR_KEY`
3. ✅ Both headers use the same key (anon or service role)
4. ✅ No typos in the key
5. ✅ Key is from the correct Supabase project

### Issue: Function not found (404)

**This shouldn't happen since you confirmed it returns 401**, but if it does:

- Verify the URL is correct
- Check the function name is `send-push` (not `send_push`)
- Ensure the function is deployed in your Supabase project

---

## Next Steps After Successful Test

Once you receive a successful response:

1. ✅ Verify you received the notification on your iOS device
2. ✅ Check the Supabase Edge Functions logs for any errors
3. ✅ Review the Expo response JSON for delivery status
4. ✅ Confirm invalid tokens are being disabled properly

---

## Function Features

- ✅ Sends push notifications to iOS devices via Expo
- ✅ Supports multiple devices per user
- ✅ Automatically disables invalid/expired tokens
- ✅ Provides detailed logging
- ✅ Returns comprehensive response with Expo details
- ✅ Handles errors gracefully
- ✅ CORS enabled for web requests

---

## Security Notes

- The function uses the service role key internally (server-side only)
- Client apps should call this function with the anon key
- The function validates all inputs
- Invalid tokens are automatically cleaned up
- User can only send notifications to their own user_id (RLS enforced)

---

**Created:** 2024  
**Function Status:** ✅ Deployed and Live  
**Returns:** 401 (Unauthorized) - Ready for authorized requests
