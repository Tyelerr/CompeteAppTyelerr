# Build 88 - Deploy Edge Function Via Supabase Dashboard

## Current Status

✅ Password field is visible in the app (Build 88 deployed)
❌ "No API key found in request" error - Edge function needs redeployment
❌ Supabase CLI not installed on your system

## Solution: Deploy Via Supabase Dashboard

Since Supabase CLI is not installed, you must deploy the edge function through the Supabase Dashboard.

### Step-by-Step Instructions

#### 1. Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select your project

#### 2. Navigate to Edge Functions

1. In the left sidebar, click on "Edge Functions"
2. Find the function named `update-user-email`
3. Click on it to open the editor

#### 3. Copy the Updated Code

Open the file: `CompeteApp/supabase/functions/update-user-email/index.ts`

Copy the ENTIRE contents (all 247 lines)

#### 4. Paste and Deploy

1. In the Supabase Dashboard editor, DELETE all existing code
2. PASTE the entire contents from `index.ts`
3. Click the "Deploy" button
4. Wait for deployment to complete

#### 5. Verify Deployment

After deployment, try updating your email again. The logs should show:

- ✅ "Validating current password..." (instead of "Skipping password validation")
- ✅ "Password validated successfully"
- ✅ NO "No API key found" errors

### What the Updated Edge Function Includes

The updated code has these critical fixes:

1. **Password Validation** - Lines 74-82, 114-141
2. **API Key in Admin Calls** - Lines 173, 217 (`apikey: SERVICE_ROLE_KEY`)

### After Edge Function is Deployed

The app (Build 88) is already deployed with the password field. Once you redeploy the edge function:

1. Password field will work correctly
2. Password will be validated
3. API key error will be resolved
4. Email updates will succeed

### Alternative: Install Supabase CLI (Optional)

If you want to use CLI in the future:

```bash
npm install -g supabase
```

Then you can deploy with:

```bash
cd CompeteApp
supabase functions deploy update-user-email
```

---

**IMPORTANT:** The code is ready. You just need to copy-paste the edge function code into the Supabase Dashboard and click Deploy.
