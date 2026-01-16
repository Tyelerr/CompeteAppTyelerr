# 🤖 Deploy Edge Function via Supabase AI Assistant (Easiest Method)

## Perfect! You're using the AI Assistant - this is the easiest way!

### Step 1: Click "Via AI Assistant"

You've already found it in the Supabase Dashboard. Click on "Via AI Assistant".

### Step 2: Provide This Prompt to the AI

Copy and paste this EXACT prompt into the Supabase AI Assistant:

```
Create an Edge Function called "update-user-email" that securely updates a user's email in both auth.users and the profiles table.

Requirements:
1. Accept newEmail and currentPassword in the request body
2. Validate the user is authenticated via JWT token
3. Re-authenticate the user with their current password before allowing email change
4. Check if the new email is already in use by another user
5. Update auth.users using Admin API with email_confirm: false (to trigger confirmation email)
6. Update the profiles table with the new email
7. If profiles update fails, rollback the auth.users change
8. Return JSON response with success, message, and requiresConfirmation fields
9. Handle all errors with proper HTTP status codes
10. Include CORS headers for cross-origin requests

The function should use:
- Deno.env.get('SUPABASE_URL') for the Supabase URL
- Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') for admin operations
- Authorization header from the request for user authentication
```

### Step 3: Review and Refine

The AI will generate the function. Then:

1. **Compare with our implementation:** Open `CompeteApp/supabase/functions/update-user-email/index.ts`
2. **Copy our complete code** and paste it to replace what the AI generated (our code is production-ready)
3. Click "Deploy"

### Step 4: Set Service Role Key Secret

After deployment:

1. Go to Project Settings > Edge Functions > Secrets
2. Add new secret:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (Get from Settings > API > service_role key)
3. Save

### Step 5: Verify Deployment

1. Check that `update-user-email` appears in your Edge Functions list
2. Status should show "Active" or "Deployed"
3. Note the function URL (you'll need this for testing)

## ✅ After Deployment

Once deployed, you need to:

1. **Remove service role key from client:**

   - Edit `CompeteApp/.env`
   - Delete or comment out: `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...`

2. **Update FormUserEditor.tsx:**

   - See `SECURE_EMAIL_UPDATE_IMPLEMENTATION_COMPLETE.md` for integration code

3. **Test the flow:**
   - Try changing email with correct password
   - Try changing email with wrong password
   - Verify email confirmation is sent

## 🎯 Quick Reference

**Edge Function Code Location:**
`CompeteApp/supabase/functions/update-user-email/index.ts`

**Client Service:**
`CompeteApp/ApiSupabase/EdgeFunctionService.tsx`

**Complete Guide:**
`CompeteApp/SECURE_EMAIL_UPDATE_IMPLEMENTATION_COMPLETE.md`

---

**This is the easiest deployment method - the AI Assistant will handle most of the setup for you!**
