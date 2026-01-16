# Supabase CLI Installation Guide for Windows

## ❌ Problem

The error you encountered:

```
Installing Supabase CLI as a global module is not supported.
Please use one of the supported package managers
```

This means `npm install -g supabase` no longer works. Supabase CLI must be installed using alternative methods.

---

## ✅ Solution: Install via Scoop (Recommended for Windows)

### Step 1: Install Scoop (if not already installed)

Open PowerShell and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### Step 2: Install Supabase CLI

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 3: Verify Installation

```powershell
supabase --version
```

You should see output like: `1.x.x`

---

## Alternative: Use npx (No Installation Required)

If you don't want to install Scoop, you can use `npx` to run Supabase CLI commands without installing it globally:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy send-push
```

**Note:** This will download the CLI each time, so it's slower but requires no installation.

---

## Alternative: Manual Binary Download

1. Go to: https://github.com/supabase/cli/releases
2. Download the latest Windows binary (supabase_windows_amd64.zip)
3. Extract the zip file
4. Add the extracted folder to your PATH environment variable
5. Restart your terminal
6. Verify: `supabase --version`

---

## Next Steps After Installation

Once Supabase CLI is installed, follow these steps to deploy the edge function:

### 1. Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### 2. Link Your Project

```bash
cd CompeteApp
supabase link --project-ref <your-project-ref>
```

**To find your project ref:**

- Go to your Supabase dashboard
- Look at the URL: `https://supabase.com/dashboard/project/<project-ref>`
- Or go to Settings → General → Reference ID

### 3. Deploy the Edge Function

```bash
supabase functions deploy send-push
```

### 4. Verify Deployment

```bash
supabase functions list
```

You should see `send-push` in the list.

### 5. Test the Function

```bash
node get-user-id-and-test-push.js
```

---

## Troubleshooting

### "supabase: command not found" after Scoop installation

1. Close and reopen your terminal
2. Or manually add Scoop's bin directory to PATH:
   - Open System Properties → Environment Variables
   - Add `C:\Users\<YourUsername>\scoop\shims` to PATH
   - Restart terminal

### "Project not linked" error

Make sure you're in the CompeteApp directory when running `supabase link`:

```bash
cd c:\APP\CompeteApp
supabase link --project-ref <your-project-ref>
```

### Edge function deployment fails

1. Check you're logged in: `supabase login`
2. Check you're linked: `supabase projects list`
3. Verify the function folder exists: `dir supabase\functions\send-push`

---

## Quick Reference

```bash
# Install via Scoop (recommended)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or use npx (no installation)
npx supabase <command>

# Deploy workflow
cd CompeteApp
supabase login
supabase link --project-ref <your-ref>
supabase functions deploy send-push
supabase functions list

# Test
node get-user-id-and-test-push.js
```

---

## Additional Resources

- Supabase CLI Documentation: https://supabase.com/docs/guides/cli
- Scoop Package Manager: https://scoop.sh/
- Edge Functions Guide: https://supabase.com/docs/guides/functions
