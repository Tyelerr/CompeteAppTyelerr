# When to Rebuild vs Update Your App

## Quick Answer

**You CAN update without rebuilding** for most code changes!

**You MUST rebuild** only when you change native dependencies or configuration.

---

## ✅ Changes That DON'T Require Rebuild

You can update these with **Over-The-Air (OTA) updates** - users get updates instantly without downloading from TestFlight:

### JavaScript/TypeScript Code

- ✅ All React components (screens, modals, etc.)
- ✅ Business logic changes
- ✅ API calls and data fetching
- ✅ UI styling and layouts
- ✅ Navigation changes
- ✅ Bug fixes in your code
- ✅ New features (if no new native dependencies)

### Assets

- ✅ Images
- ✅ Fonts (if already configured)
- ✅ JSON data files

### Configuration (some)

- ✅ Environment variables (EXPO*PUBLIC*\*)
- ✅ App logic configuration

**How to update:**

```bash
cd CompeteApp
eas update --branch production --message "Fixed tournament display bug"
```

Users get the update **immediately** next time they open the app!

---

## ❌ Changes That REQUIRE Rebuild

You MUST rebuild and resubmit to TestFlight for:

### Native Dependencies

- ❌ Adding/removing npm packages with native code
- ❌ Updating Expo SDK version
- ❌ Adding/removing Expo plugins
- ❌ Changing React Native version

### App Configuration

- ❌ Changing app.json settings:
  - Bundle identifier
  - App name
  - Permissions (camera, location, etc.)
  - Build number
  - Version number
  - Splash screen
  - App icon
- ❌ Changing eas.json build settings
- ❌ iOS/Android specific configurations

### Native Code

- ❌ Custom native modules
- ❌ Xcode project changes
- ❌ Android gradle changes

**How to rebuild:**

```bash
cd CompeteApp
# Increment build number in app.json first!
eas build --platform ios --profile production
eas submit --platform ios
```

---

## Your Current Situation

**Right now, you MUST rebuild** because:

1. ❌ Need to remove expo-dev-client (native dependency)
2. ❌ Need to fix dependency versions (native code)
3. ❌ App is crashing (requires clean build)

**After this rebuild, you can update freely** for:

- ✅ Fixing bugs in your screens
- ✅ Adding new tournament features
- ✅ Updating UI/styling
- ✅ Changing business logic
- ✅ Most day-to-day development

---

## Typical Development Workflow

### Daily Development (No Rebuild Needed)

```bash
# Make code changes to your screens, components, etc.
# Then publish update:
eas update --branch production --message "Your change description"
```

Users get updates in **seconds**, not days!

### Monthly/When Needed (Rebuild Required)

```bash
# When you add new native dependencies or change config:
# 1. Update build number in app.json
# 2. Build and submit:
eas build --platform ios --profile production
eas submit --platform ios
```

Takes 10-20 minutes, users get it through TestFlight.

---

## EAS Update Setup

To enable OTA updates, you need to set up EAS Update once:

```bash
cd CompeteApp
npm install expo-updates
eas update:configure
```

Then in your app.json, add:

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/YOUR_PROJECT_ID"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

After this, you can push updates instantly!

---

## Cost Comparison

### With OTA Updates (Recommended)

- **Code changes**: Free, instant updates
- **Native changes**: Rebuild only when needed (rare)
- **User experience**: Updates in seconds

### Without OTA Updates

- **Every change**: Full rebuild + TestFlight submission
- **Wait time**: 10-20 minutes per change
- **User experience**: Must download from TestFlight

---

## Summary

**For your current crash fix:**

- ✅ Run `COMPLETE_CLEANUP_AND_FIX.bat` (MUST rebuild)

**After the fix:**

- ✅ Most changes = `eas update` (instant)
- ❌ Native changes = `eas build` + `eas submit` (rare)

You'll rarely need to rebuild after this initial fix!
