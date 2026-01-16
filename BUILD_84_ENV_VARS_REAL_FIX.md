# Build 84 - Real Environment Variables Fix

## The Real Problem

The issue is that `eas secret` (deprecated) doesn't automatically inject variables into builds. We need to use the new `eas env` system OR explicitly set them in app.json/app.config.js.

## Solution: Use app.config.js

Since the secrets are already stored in EAS, the simplest solution is to create an `app.config.js` that reads from a `.env` file during build time.

## Steps to Fix:

### Option 1: Create .env file in the project root (Recommended)

1. Create a `.env` file in CompeteApp directory with your actual values:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Make sure `.env` is in `.gitignore` (it should be)

3. The build process will automatically read from `.env` during EAS Build

### Option 2: Migrate to new eas env system

Run these commands to migrate from deprecated secrets to new env system:

```bash
cd CompeteApp

# List current secrets
eas secret:list

# For each secret, create a new environment variable
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "your_value" --scope project
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_value" --scope project

# Verify
eas env:list
```

### Option 3: Hardcode in app.config.js (Not recommended for security)

Create `app.config.js` instead of `app.json`:

```javascript
export default {
  expo: {
    // ... all your existing app.json content
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
```

## Why the Previous Fix Didn't Work

The `@secret-name` syntax in eas.json only works with the NEW `eas env` system, not the deprecated `eas secret` system. Your secrets are stored in the old system, so they weren't being injected.

## Recommended Action

**Use Option 1**: Create a `.env` file with your actual Supabase credentials. EAS Build will automatically read it during the build process.

After creating the `.env` file:

1. Increment build number to 85
2. Run `eas build --platform ios --profile production`
3. Submit to TestFlight
4. Test the email update feature

## Important Note

The `.env` file should contain your ACTUAL Supabase URL and anon key values, not references to secrets. EAS Build will read this file during the build process and inject the values into your app.
