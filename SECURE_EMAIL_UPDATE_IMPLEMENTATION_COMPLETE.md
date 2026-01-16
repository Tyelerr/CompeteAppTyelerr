# Secure Email Update Implementation - Complete Guide

## ✅ What Has Been Implemented

### Phase 1: Security Vulnerability Fixed

- ✅ Removed `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from client
- ✅ Updated `supabase.tsx` to remove `supabaseAdmin` client
- ✅ Updated `CrudUser.tsx` imports to use Edge Function service
- ✅ Added security warnings in code comments

### Phase 2: Edge Function Infrastructure Created

- ✅ Created Supabase Edge Function: `update-user-email`
  - Location: `CompeteApp/supabase/functions/update-user-email/index.ts`
  - Features:
    - Password re-authentication required
    - Atomic transaction handling with rollback
    - Email uniqueness validation
    - Proper error handling
    - Email confirmation flow
- ✅ Created Edge Function configuration
  - Location: `CompeteApp/supabase/functions/update-user-email/deno.json`

### Phase 3: Client-Side Service Created

- ✅ Created `EdgeFunctionService.tsx` for secure API calls
  - Location: `CompeteApp/ApiSupabase/EdgeFunctionService.tsx`
  - Features:
    - Automatic session token handling
    - Comprehensive error handling
    - Type-safe interfaces

## 🚧 What Still Needs To Be Done

### 1. Update FormUserEditor.tsx

The form needs to be updated to:

- Add password input field for re-authentication
- Call the Edge Function via `callUpdateUserEmail` instead of `UpdateProfile` for email changes
- Handle the new response format

### 2. Deploy Edge Function to Supabase

The Edge Function needs to be deployed to your Supabase project.

### 3. Update Environment Variables

Remove the service role key from client-side environment variables.

### 4. Fix Remaining supabaseAdmin Usage

Some functions still use `supabaseAdmin` and need Edge Functions:

- `SignUp` (create-user type) - Line 652
- `DeleteUser` - Lines 954, 1073
- These will need separate Edge Functions or alternative approaches

### 5. Create RLS Policies

Ensure proper Row Level Security policies for the profiles table.

### 6. Testing

Comprehensive testing of the email update flow.

## 📋 Step-by-Step Deployment Guide

### Step 1: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

### Step 2: Link Your Project

```bash
cd CompeteApp
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings > General
4. Copy the "Reference ID"

### Step 3: Deploy the Edge Function

```bash
# Deploy the update-user-email function
supabase functions deploy update-user-email

# Verify deployment
supabase functions list
```

### Step 4: Set Environment Variables (Server-Side Only)

The Edge Function needs access to environment variables:

```bash
# Set the service role key (server-side only - NEVER in client)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

To find your service role key:

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings > API
4. Copy the "service_role" key (keep this secret!)

### Step 5: Update Client Environment Variables

Edit your `.env` file and REMOVE the service role key:

```env
# .env file - CLIENT SIDE ONLY
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# ❌ REMOVE THIS LINE - Service role should NEVER be in client
# EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...
```

### Step 6: Update FormUserEditor.tsx

The form needs to be updated to use the new secure email update flow. Here's what needs to change:

#### Current Flow (INSECURE):

```typescript
// Email is updated directly in UpdateProfile
const NewData: any = {
  email: email.trim(), // ❌ Insecure - updates only profiles table
  // ... other fields
};
await UpdateProfile(userId, NewData);
```

#### New Flow (SECURE):

```typescript
import { callUpdateUserEmail } from '../../ApiSupabase/EdgeFunctionService';

// For email updates, use Edge Function
if (emailChanged) {
  const result = await callUpdateUserEmail(
    newEmail.trim(),
    currentPassword, // ✅ Requires password re-authentication
  );

  if (!result.success) {
    setErrorForm(result.error || 'Failed to update email');
    return;
  }
}

// For other profile updates, use regular UpdateProfile
const NewData: any = {
  name: name,
  // ... other fields (NOT email)
};
await UpdateProfile(userId, NewData);
```

### Step 7: Add Password Input to Form

Add a password field that appears when user changes email:

```typescript
const [currentPassword, setCurrentPassword] = useState('');
const [showPasswordField, setShowPasswordField] = useState(false);

// Show password field when email changes
useEffect(() => {
  const emailChanged = email.trim() !== userThatNeedToBeEdited.email;
  setShowPasswordField(emailChanged);
}, [email]);

// In the JSX:
{
  showPasswordField && (
    <LFInput
      keyboardType="default"
      label="Current Password"
      placeholder="Enter your current password to confirm"
      value={currentPassword}
      secureTextEntry={true}
      onChangeText={(text: string) => setCurrentPassword(text)}
      description="Required to change email address"
    />
  );
}
```

### Step 8: Test the Implementation

1. **Test email update with correct password**

   - Change email
   - Enter correct password
   - Verify both auth.users and profiles are updated
   - Check email for confirmation link

2. **Test email update with wrong password**

   - Change email
   - Enter wrong password
   - Verify update is rejected

3. **Test email update to existing email**

   - Try to change to an email already in use
   - Verify update is rejected

4. **Test email confirmation**

   - After successful update, check email
   - Click confirmation link
   - Verify new email is confirmed

5. **Test login after email change**
   - Try logging in with old email (should fail)
   - Try logging in with new email after confirmation (should work)

## 🔒 Security Improvements

### Before (INSECURE):

- ❌ Service role key exposed in React Native app
- ❌ Anyone with app access could extract the key
- ❌ No password re-authentication for email changes
- ❌ Only profiles table updated, not auth.users
- ❌ No atomic transaction handling

### After (SECURE):

- ✅ Service role key only on server (Edge Function)
- ✅ Password re-authentication required
- ✅ Both auth.users and profiles updated atomically
- ✅ Proper rollback on failure
- ✅ Email uniqueness validation
- ✅ Email confirmation flow

## 📝 Additional Notes

### Admin Functions Still Need Work

The following functions still use `supabaseAdmin` and need to be addressed:

1. **SignUp (create-user type)** - Used by admins to create users

   - Solution: Create `create-user` Edge Function
   - Or: Use Supabase Admin API from a secure backend

2. **DeleteUser** - Used to delete users and clear venue assignments
   - Solution: Create `delete-user` Edge Function
   - Or: Use Supabase Admin API from a secure backend

### RLS Policies

Ensure your `profiles` table has proper RLS policies:

```sql
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile (except email via this method)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### Email Confirmation Settings

In Supabase Dashboard:

1. Go to Authentication > Settings
2. Enable "Enable email confirmations"
3. Configure email templates as needed

## 🎯 Success Criteria

- [ ] Edge Function deployed successfully
- [ ] Service role key removed from client
- [ ] FormUserEditor updated with password field
- [ ] Email updates require password re-authentication
- [ ] Both auth.users and profiles updated atomically
- [ ] Email confirmation emails sent
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] App builds successfully

## 📚 Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 Troubleshooting

### Edge Function not found

- Verify deployment: `supabase functions list`
- Check project is linked: `supabase projects list`
- Redeploy: `supabase functions deploy update-user-email`

### "Invalid JWT" error

- Check that session token is being passed correctly
- Verify user is logged in before calling function

### Email not updating

- Check Edge Function logs: `supabase functions logs update-user-email`
- Verify service role key is set: `supabase secrets list`
- Check RLS policies on profiles table

### TypeScript errors

- Run `npm install` to ensure all dependencies are installed
- Check that `@supabase/supabase-js` is up to date

## 📞 Next Steps

1. Deploy the Edge Function (see Step 3 above)
2. Update FormUserEditor.tsx (see Step 6 above)
3. Test thoroughly (see Step 8 above)
4. Remove service role key from client environment variables
5. Deploy updated app to TestFlight/App Store

---

**Status**: Implementation 60% complete
**Last Updated**: [Current Date]
**Next Action**: Deploy Edge Function and update FormUserEditor.tsx
