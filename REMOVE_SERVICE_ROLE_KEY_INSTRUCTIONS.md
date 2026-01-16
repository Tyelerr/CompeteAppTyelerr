# 🔒 Remove Service Role Key from Client - CRITICAL SECURITY STEP

## ⚠️ IMPORTANT: You Must Do This Manually

For security reasons, I cannot read or modify `.env` files. You need to do this yourself.

## Step-by-Step Instructions

### 1. Open Your .env File

Location: `CompeteApp/.env`

Open this file in your text editor (VS Code, Notepad, etc.)

### 2. Find and Remove This Line

Look for a line that looks like this:

```env
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**DELETE this entire line** or comment it out by adding `#` at the beginning:

```env
# EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Your .env File Should Only Have These Lines

After removal, your `.env` file should look like this:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ SERVICE ROLE KEY REMOVED FOR SECURITY
# Service role operations are now handled server-side via Edge Functions
# See: CompeteApp/supabase/functions/
```

### 4. Save the File

Save `CompeteApp/.env` after making the change.

### 5. Set the Service Role Key in Supabase (Server-Side Only)

**DO NOT skip this step!** The Edge Function needs the service role key, but it should only exist on the server:

#### Option A: Via Supabase Dashboard (Easiest)

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Project Settings** > **Edge Functions** > **Secrets**
4. Click "Add new secret"
5. Name: `SUPABASE_SERVICE_ROLE_KEY`
6. Value: (Paste your service role key - get it from Settings > API > service_role)
7. Click "Save"

#### Option B: Via Supabase CLI (If you have it installed)

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 6. Verify the Change

After removing from `.env` and adding to Supabase secrets:

1. **Check your app still works** for normal operations (login, viewing data, etc.)
2. **The Edge Function will now have access** to the service role key server-side only
3. **Your React Native app no longer has** the service role key (secure!)

## ✅ Why This Is Critical

**Before (INSECURE):**

- ❌ Service role key in `.env` file
- ❌ Anyone who downloads your app can extract it
- ❌ They could delete your entire database, create admin users, etc.

**After (SECURE):**

- ✅ Service role key only on Supabase servers
- ✅ Only your Edge Functions can use it
- ✅ No one can extract it from your app

## 🆘 Troubleshooting

### "My app stopped working after removing the key"

- This is expected for admin functions (SignUp with 'create-user', DeleteUser)
- Email updates will work fine via the Edge Function
- Other admin functions need separate Edge Functions (future work)

### "How do I get my service role key?"

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings > API
4. Copy the "service_role" key (keep it secret!)

### "I accidentally deleted the wrong line"

- Check `.env.example` for reference
- You need to keep:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- You need to remove:
  - `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

## 📋 Checklist

- [ ] Opened `CompeteApp/.env` file
- [ ] Found the `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` line
- [ ] Deleted or commented out that line
- [ ] Saved the file
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY` as a secret in Supabase Dashboard
- [ ] Verified the secret is saved in Supabase
- [ ] Tested that the app still works

---

**Once you complete these steps, your secure email update system will be fully operational!**
