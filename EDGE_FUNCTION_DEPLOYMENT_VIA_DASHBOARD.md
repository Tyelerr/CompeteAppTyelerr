# Deploy Edge Function via Supabase Dashboard (No CLI Required)

Since the Supabase CLI has installation issues on Windows, you can deploy the Edge Function directly through the Supabase Dashboard UI.

## Step 1: Access Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Click on "Edge Functions" in the left sidebar

## Step 2: Create New Edge Function

1. Click "Create a new function"
2. Function name: `update-user-email`
3. Click "Create function"

## Step 3: Copy the Edge Function Code

1. In the Supabase Dashboard, you'll see a code editor
2. Delete any template code
3. Copy the ENTIRE contents from: `CompeteApp/supabase/functions/update-user-email/index.ts`
4. Paste it into the dashboard editor
5. Click "Deploy" or "Save"

## Step 4: Verify Deployment

1. In the Edge Functions list, you should see `update-user-email` with status "Active"
2. Note the function URL (it will be something like):
   ```
   https://[your-project-ref].supabase.co/functions/v1/update-user-email
   ```

## Step 5: Test the Edge Function

You can test it directly in the dashboard:

1. Click on your `update-user-email` function
2. Go to the "Invocations" or "Test" tab
3. Use this test payload (replace with real values):

```json
{
  "newEmail": "newemail@example.com",
  "currentPassword": "your_current_password"
}
```

4. Add Authorization header:
   - Get your access token from your app's session
   - Header: `Authorization: Bearer YOUR_ACCESS_TOKEN`

## Alternative: Manual Deployment via Supabase CLI (If You Get It Working)

If you manage to install Supabase CLI using Scoop or another method:

```bash
# Install via Scoop (Windows Package Manager)
# First install Scoop: https://scoop.sh/
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Then deploy
cd CompeteApp
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy update-user-email
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 6: Configure Environment Secrets

The Edge Function needs access to your service role key:

### Via Dashboard:

1. Go to Project Settings > Edge Functions
2. Look for "Secrets" or "Environment Variables"
3. Add secret:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your service role key (from Settings > API > service_role)

### Via CLI (if installed):

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 7: Update Your Client App

1. **Remove service role key from client:**

   - Edit your `.env` file
   - Remove or comment out: `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...`

2. **Verify Edge Function URL in EdgeFunctionService.tsx:**
   - The URL is automatically constructed from `EXPO_PUBLIC_SUPABASE_URL`
   - Format: `${SUPABASE_URL}/functions/v1/update-user-email`

## Verification Checklist

- [ ] Edge Function visible in Supabase Dashboard
- [ ] Function status shows "Active" or "Deployed"
- [ ] Service role key set as secret (not in client)
- [ ] Client `.env` file has service role key removed
- [ ] Edge Function URL is correct in `EdgeFunctionService.tsx`

## Troubleshooting

### Function not found (404)

- Verify function is deployed and active in dashboard
- Check the function URL matches your project
- Ensure function name is exactly `update-user-email`

### Unauthorized errors

- Verify service role key is set as a secret
- Check that the key is correct (from Settings > API)
- Ensure the key has not been regenerated

### "Invalid JWT" errors

- User must be logged in before calling the function
- Session token must be valid and not expired
- Check Authorization header is being sent correctly

## Next Steps After Deployment

Once the Edge Function is deployed:

1. Update `FormUserEditor.tsx` to use the new secure flow
2. Add password input field for email changes
3. Test the email update process
4. Verify email confirmation emails are sent
5. Test login with new email after confirmation

See `SECURE_EMAIL_UPDATE_IMPLEMENTATION_COMPLETE.md` for complete integration instructions.
