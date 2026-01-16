# Fix "Unable to Install - Integrity Could Not Be Verified" Error

## The Problem

You're seeing: **"This app cannot be installed because its integrity could not be verified."**

This happens because the October 3rd build is an **internal distribution build** that requires:

1. Your device to be registered in your Apple Developer account
2. Proper provisioning profile
3. Valid code signing certificate

## Solution: Create a New Ad Hoc or TestFlight Build

You need to create a **different type of build** that can be installed on your device.

### Option 1: Ad Hoc Build (Recommended - Fastest)

Ad Hoc builds can be installed directly on registered devices without TestFlight.

```bash
cd CompeteApp

# Build an ad hoc distribution
eas build --platform ios --profile preview
```

**What this does:**

- Creates an installable .ipa file
- Can be installed via direct download
- Works on up to 100 registered devices
- No TestFlight required

### Option 2: TestFlight Build (Best for Testing)

TestFlight builds are the most reliable for testing.

```bash
cd CompeteApp

# Build for TestFlight
eas build --platform ios --profile production
```

**Then:**

1. Wait for build to complete (10-20 minutes)
2. Submit to TestFlight: `eas submit --platform ios`
3. Install via TestFlight app from App Store
4. Open TestFlight and install "Compete"

### Option 3: Register Your Device for Internal Distribution

If you want to use the internal distribution build:

1. **Get your device UDID:**

   - Connect iPhone to computer
   - Open iTunes/Finder
   - Click on device
   - Click on serial number to reveal UDID
   - Copy it

2. **Register device in EAS:**
   ```bash
   eas device:create
   ```
3. **Rebuild with registered device:**
   ```bash
   eas build --platform ios --profile development
   ```

## Quick Fix Script

I'll create a script to build an ad hoc version you can install:

```bash
cd CompeteApp
build-adhoc-for-device.bat
```

## Why This Happened

The "internal distribution" build from October 3rd requires:

- ✅ Valid Apple Developer account
- ❌ Your device UDID registered in the provisioning profile
- ❌ Proper code signing setup

Since your device isn't registered, iOS blocks the installation for security.

## Recommended Next Steps

**For immediate testing:**

1. Run: `eas build --platform ios --profile preview`
2. Wait 10-20 minutes
3. Download and install the .ipa file
4. Trust the certificate in Settings

**For long-term testing:**

1. Use TestFlight (most reliable)
2. Run: `eas build --platform ios --profile production`
3. Submit to TestFlight: `eas submit --platform ios`
4. Install via TestFlight app

## Alternative: Use iOS Simulator

If you have a Mac, you can test in the iOS Simulator without any signing issues:

```bash
# On Mac only
npx expo run:ios
```

This opens the iOS Simulator and runs your app without code signing requirements.

## Summary

The October 3rd build can't be installed because your device isn't registered in the provisioning profile. You need to either:

1. ✅ **Create an ad hoc build** (fastest)
2. ✅ **Use TestFlight** (most reliable)
3. ✅ **Register your device and rebuild**
4. ✅ **Use iOS Simulator** (if you have a Mac)

I'll create a script to automate the ad hoc build process for you.
