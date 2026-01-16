# Quick Fix for Windows Users

## The Problem

You're seeing two errors:

1. **React Native version mismatch** (JS: 0.79.5 vs Native: 0.81.4)
2. **Expo Go SDK mismatch** (Expo Go: SDK 54 vs Project: SDK 51)

## Why This Happens

- **Expo Go** (from App Store) only works with SDK 54
- **Your project** uses SDK 51
- **The native app** on your device is outdated

## The Solution (Windows)

Since you're on **Windows**, you **cannot** build iOS apps locally. You must use **EAS Build** (cloud builds).

### Step 1: Run the Automated Script

```bash
cd CompeteApp
build-dev-app-windows.bat
```

This will:

- Install expo-dev-client
- Set up EAS CLI
- Log you into EAS
- Start a cloud build

### Step 2: Wait for Build (10-20 minutes)

The build runs on EAS servers (macOS in the cloud). You can:

- Close the terminal and check status at https://expo.dev
- Or wait for the email notification

### Step 3: Install on Your iPhone

Once the build completes:

1. Open the build page on https://expo.dev
2. Scan the QR code with your iPhone camera
3. Install the development app

### Step 4: Start Development

```bash
cd CompeteApp
npx expo start --dev-client
```

Then scan the QR code with your development app (not Expo Go).

## Alternative: Manual Commands

If you prefer manual control:

```bash
# 1. Install expo-dev-client
cd CompeteApp
npx expo install expo-dev-client

# 2. Install EAS CLI
npm install -g eas-cli

# 3. Login to EAS
eas login

# 4. Build in the cloud
eas build --platform ios --profile development

# 5. After build completes and you install it, start dev server
npx expo start --dev-client
```

## Important Notes

### ❌ Don't Use Expo Go

Expo Go has SDK restrictions. Your development build will work like Expo Go but without limitations.

### ✅ Use Development Builds

- No SDK version restrictions
- Works with SDK 51 (your current version)
- Can include custom native code
- More production-like

### 💡 Why EAS Build?

- **Windows cannot build iOS apps locally** (requires macOS + Xcode)
- EAS Build uses macOS servers in the cloud
- It's the official Expo solution for Windows/Linux users

## Troubleshooting

### "iOS apps can only be built on macOS"

This is expected on Windows. Use `eas build` instead of `npx expo run:ios`.

### "Not logged in to EAS"

Run: `eas login`

### "Build failed"

Check the build logs at https://expo.dev for specific errors.

## Summary

1. ✅ Run `build-dev-app-windows.bat`
2. ✅ Wait for cloud build to complete
3. ✅ Install the app on your iPhone
4. ✅ Use `npx expo start --dev-client` for development
5. ❌ Stop using Expo Go

Your app will work perfectly with SDK 51 using development builds!
