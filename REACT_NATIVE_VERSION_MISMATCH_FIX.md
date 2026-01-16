# React Native Version Mismatch Fix

## Problem

You're experiencing a React Native version mismatch error:

```
[runtime not ready]: console.error: React Native version mismatch.
JavaScript version: 0.79.5
Native version: 0.81.4
```

## Root Cause

This error occurs when the **JavaScript bundle** (the code running in Metro bundler) has a different React Native version than the **native code** (the compiled iOS/Android app installed on your device).

### Why This Happens:

1. **Outdated Native App**: The app installed on your device was built with an older or different version of React Native
2. **Cache Issues**: Stale caches can cause version mismatches
3. **Development vs Production Builds**: Different build configurations may have different versions

## Current Configuration

- **Expo SDK**: 51.0.28
- **React Native**: 0.74.5 (in package.json)
- **Expected Behavior**: Both JavaScript and Native should use 0.74.5

## Solution

### Quick Fix (Recommended)

1. **Run the automated fix script:**

   ```bash
   cd CompeteApp
   fix-react-native-version-mismatch.bat
   ```

2. **Delete the app from your device:**

   - iOS: Long press the Compete app icon → Delete
   - Android: Settings → Apps → Compete → Uninstall

3. **Rebuild and reinstall the app:**

   **Option A - Local Development Build:**

   ```bash
   # For iOS
   npx expo run:ios

   # For Android
   npx expo run:android
   ```

   **Option B - EAS Development Build:**

   ```bash
   # For iOS
   eas build --platform ios --profile development

   # For Android
   eas build --platform android --profile development
   ```

### Manual Fix Steps

If the automated script doesn't work, follow these manual steps:

#### Step 1: Clear All Caches

```bash
cd CompeteApp

# Stop Metro bundler
# Press Ctrl+C in the terminal running Metro

# Clear Watchman cache
watchman watch-del-all

# Clear Metro cache
npx expo start --clear

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

#### Step 2: Clear React Native Caches

```bash
# Windows
rd /s /q %LOCALAPPDATA%\Temp\metro-*
rd /s /q %LOCALAPPDATA%\Temp\haste-map-*
rd /s /q %LOCALAPPDATA%\Temp\react-native-*
rd /s /q %LOCALAPPDATA%\Temp\react-*
```

#### Step 3: Rebuild Native App

The key is to **completely rebuild** the native app:

```bash
# Clean prebuild
npx expo prebuild --clean

# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

## Why Clearing Cache Alone Isn't Enough

The error message suggests clearing caches:

```
watchman watch-del-all && npx react-native start --reset-cache
```

However, this **only clears the JavaScript bundle cache**. The native code on your device remains unchanged. You must **rebuild and reinstall the app** to sync the native code with the JavaScript version.

## Prevention

To avoid this issue in the future:

1. **Always rebuild after dependency updates:**

   ```bash
   npm install
   npx expo prebuild --clean
   npx expo run:ios  # or run:android
   ```

2. **Use EAS Build for consistency:**

   - EAS builds ensure the native code matches your package.json
   - Development builds can be installed via QR code

3. **Keep dependencies in sync:**
   - Don't manually edit native code without updating package.json
   - Use `expo install` for Expo-compatible packages

## Verification

After rebuilding, verify the fix:

1. Start Metro bundler:

   ```bash
   npx expo start --clear
   ```

2. Open the app on your device

3. Check that no version mismatch error appears

4. The app should load successfully

## Additional Notes

### For Expo Go Users

If you're using Expo Go (the development app from the App Store):

- Expo Go has its own React Native version
- You cannot control the React Native version in Expo Go
- **Solution**: Switch to development builds using `npx expo run:ios` or EAS Build

### For Production Builds

For TestFlight or Play Store builds:

- Always use EAS Build: `eas build --platform ios --profile production`
- EAS ensures version consistency
- Never mix development and production builds on the same device

## Troubleshooting

### Issue: Script doesn't clear caches

**Solution**: Manually delete cache folders in `%LOCALAPPDATA%\Temp\`

### Issue: Build fails with "command not found"

**Solution**: Ensure you have Xcode (iOS) or Android Studio (Android) properly installed

### Issue: Still seeing version mismatch after rebuild

**Solution**:

1. Completely uninstall the app from device
2. Restart your device
3. Clear all caches again
4. Rebuild from scratch

### Issue: Can't delete app from device

**Solution**:

- iOS: Settings → General → iPhone Storage → Compete → Delete App
- Android: Settings → Apps → Compete → Force Stop → Uninstall

## Summary

The React Native version mismatch is caused by **outdated native code on your device**. The solution is:

1. ✅ Clear all caches (Metro, Watchman, npm)
2. ✅ Delete the app from your device
3. ✅ Rebuild the native app completely
4. ✅ Reinstall on your device

Simply clearing caches or restarting Metro is **not sufficient** - you must rebuild the native app.
