# Edge Function No Logs Issue - Complete Fix

## Problem Summary

When testing the edit profile modal, no logs appear in the Supabase console, meaning the app isn't reaching the edge function or database.

## Root Cause Identified

The diagnostic test revealed: **Environment variables are missing**

- `EXPO_PUBLIC_SUPABASE_URL` is not set
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` is not set

This means:

1. The app doesn't know where to send requests
2. The edge function URL is undefined
3. No requests are being made to Supabase

## Solution

### Step 1: Verify Your .env File

Open `CompeteApp/.env` and ensure it contains:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**To find these values:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Restart Your Development Server

After updating the `.env` file:

```bash
# Stop the current Expo server (Ctrl+C)
# Clear cache and restart
cd CompeteApp
npx expo start --clear
```

### Step 3: Verify Edge Function is Deployed

Check if the edge function exists in Supabase:

1. Go to Supabase Dashboard → **Edge Functions**
2. Look for `update-user-email`
3. If it's NOT listed, deploy it:

```bash
cd CompeteApp
npx supabase functions deploy update-user-email
```

### Step 4: Set Edge Function Secrets

The edge function needs these secrets set in Supabase:

```bash
npx supabase secrets set SUPABASE_URL=https://your-project.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To find the service role key:**

1. Supabase Dashboard → **Settings** → **API**
2. Copy the **service_role** key (keep this secret!)

### Step 5: Test the Connection

Run the diagnostic script again:

```bash
cd CompeteApp
node test_edge_function_connection.js
```

You should see:

- ✓ SUPABASE_URL: Set
- ✓ SUPABASE_ANON_KEY: Set
- Status: 401 (Unauthorized) - This is GOOD! It means the function is reachable

### Step 6: Test in Your App

1. Open your app in Expo
2. Navigate to Profile → Edit Profile
3. Try to change your email
4. Check **TWO places** for logs:

**A. React Native Console (Metro bundler terminal):**
Look for:

```
EdgeFunctionService: Calling update-user-email function
EdgeFunctionService: Making request to Edge Function
EdgeFunctionService: Response status: XXX
```

**B. Supabase Dashboard:**

1. Go to **Edge Functions** → **update-user-email** → **Logs** tab
2. You should see console.log output from the edge function
3. Refresh the page if needed

## Common Issues & Solutions

### Issue 1: "Environment variables still missing"

**Solution:**

- Make sure the `.env` file is in the `CompeteApp` directory (not the root)
- Restart your terminal/IDE
- Clear Expo cache: `npx expo start --clear`

### Issue 2: "404 Not Found when calling edge function"

**Solution:**

- The edge function isn't deployed
- Run: `npx supabase functions deploy update-user-email`

### Issue 3: "500 Internal Server Error"

**Solution:**

- Edge function secrets are missing
- Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as shown in Step 4

### Issue 4: "No logs in Supabase Dashboard"

**Possible causes:**

1. Edge function not being called (check React Native console first)
2. Edge function not deployed
3. Wrong Supabase project selected in dashboard

### Issue 5: "Logs in React Native but not in Supabase"

**Solution:**

- The request is failing before reaching the edge function
- Check the response status in React Native console
- Verify the edge function URL is correct

## Verification Checklist

- [ ] `.env` file has EXPO_PUBLIC_SUPABASE_URL
- [ ] `.env` file has EXPO_PUBLIC_SUPABASE_ANON_KEY
- [ ] Expo server restarted after updating .env
- [ ] Edge function `update-user-email` is deployed
- [ ] Edge function secrets are set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Diagnostic script shows environment variables are set
- [ ] React Native console shows EdgeFunctionService logs
- [ ] Supabase Dashboard shows edge function logs

## Expected Behavior After Fix

When you try to update your email in the app:

1. **React Native Console** shows:

   ```
   === FormUserEditor: __SaveTheDetails CALLED ===
   EdgeFunctionService: Calling update-user-email function
   EdgeFunctionService: Making request to Edge Function
   EdgeFunctionService: Response status: 200
   ```

2. **Supabase Dashboard** (Edge Functions → update-user-email → Logs) shows:
   ```
   === EMAIL UPDATE REQUEST ===
   newEmail: newemail@example.com
   User ID: xxx-xxx-xxx
   Current email: oldemail@example.com
   Password validated successfully
   Updating auth.users with email_confirm: false...
   === EMAIL UPDATE COMPLETE ===
   ```

## Still Having Issues?

If you've followed all steps and still see no logs:

1. Check if you're looking at the correct Supabase project
2. Verify your internet connection
3. Try updating a different field (like name) to confirm the modal works
4. Check browser/app console for any JavaScript errors
5. Ensure you're logged in to the app with a valid session

## Next Steps

Once logs are appearing:

- If you see errors in the logs, we can debug the specific error
- If email update fails, check the error message in the logs
- Verify RLS policies on the profiles table allow updates
