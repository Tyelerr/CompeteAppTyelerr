# TestFlight Edge Function Deployment Guide

## Problem Summary

Your TestFlight build doesn't have the edge function code because it was built before the edge function was added. You need to deploy the edge function and create a new TestFlight build.

## Solution: Deploy Edge Function via Supabase Dashboard

Since the CLI requires login, it's easier to deploy via the Supabase Dashboard:

### Step 1: Deploy Edge Function via Dashboard

1. **Go to Supabase Dashboard**

   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**

   - Click on "Edge Functions" in the left sidebar
   - Click "Create a new function" or "Deploy function"

3. **Create the Function**

   - Function name: `update-user-email`
   - Copy the code from: `CompeteApp/supabase/functions/update-user-email/index.ts`
   - Paste it into the editor
   - Click "Deploy"

4. **Set Environment Variables (Secrets)**
   - In the Edge Functions page, click on your function
   - Go to "Settings" or "Secrets" tab
   - Add these secrets:
     - `SUPABASE_URL`: Your Supabase project URL (from Settings → API)
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings → API)

### Step 2: Verify Edge Function is Working

Test the edge function in the Supabase Dashboard:

1. Go to Edge Functions → update-user-email → "Invocations" or "Test"
2. You should see it listed and ready to receive requests

### Step 3: Build New TestFlight Version

Now that the edge function is deployed, build a new app version:

```bash
cd CompeteApp

# 1. Update version number in app.json
# Increment the version (e.g., from 1.0.0 to 1.0.1)

# 2. Build for iOS
eas build --platform ios --profile production

# 3. After build completes, submit to TestFlight
eas submit --platform ios
```

### Step 4: Wait for Apple Review

- Apple will review your build (usually 24-48 hours)
- Once approved, it will appear in TestFlight
- Install the NEW build on your device

### Step 5: Test the New Build

1. Open the app from TestFlight
2. Go to Profile → Edit Profile
3. Change your email and enter your password
4. Press Save
5. Check Supabase Dashboard → Edge Functions → update-user-email → Logs
6. You should now see logs appearing!

## Alternative: Deploy via CLI (If You Want)

If you prefer to use the CLI, you need to login first:

```bash
# Login to Supabase
npx supabase login

# Then deploy
cd CompeteApp
npx supabase functions deploy update-user-email

# Set secrets
npx supabase secrets set SUPABASE_URL=your_url
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Why This is Necessary

**The current TestFlight build:**

- Was created BEFORE the edge function code was added
- Doesn't have `FormUserEditor_SecureEmail.tsx` with edge function calls
- Doesn't have `EdgeFunctionService.tsx` with `callUpdateUserEmail`
- Console.log statements are stripped in production builds

**The new TestFlight build will:**

- Include all the edge function integration code
- Call the edge function when you update your email
- Show logs in Supabase Dashboard (not in the app)

## Important Notes

1. **Logs Location**: Edge function logs appear in Supabase Dashboard → Edge Functions → Logs, NOT in your app
2. **Production Builds**: console.log statements don't appear in TestFlight builds
3. **Build Time**: Creating a new build takes 15-30 minutes
4. **Apple Review**: Can take 24-48 hours for TestFlight approval
5. **Version Number**: Always increment the version in app.json before building

## Quick Checklist

- [ ] Edge function deployed to Supabase
- [ ] Edge function secrets set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Version number incremented in app.json
- [ ] New build created with `eas build`
- [ ] Build submitted to TestFlight with `eas submit`
- [ ] Apple approved the build
- [ ] New build installed from TestFlight
- [ ] Tested email update feature
- [ ] Checked Supabase Dashboard for logs

## Summary

The issue isn't with your code - it's that you're testing an OLD TestFlight build that doesn't have the edge function code. Once you deploy the edge function and create a new build, everything will work correctly!
