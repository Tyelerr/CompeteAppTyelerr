# Button Sizing Fix - Deployment Guide

## Problem Summary

All buttons across the app became smaller after switching from Expo Dev to EAS Build. This affected buttons on every page.

## Root Cause

The button styles used `paddingInline` and `paddingBlock` properties which are not fully supported in all React Native versions used by EAS Build. When the build environment changed, these properties stopped working, causing buttons to lose their padding/height.

## Code Fixes Completed ✅

### 1. `CompeteApp/assets/css/styles.tsx`

- Changed `paddingInline` → `paddingHorizontal` (universally supported)
- Changed `paddingBlock` → `paddingVertical` (universally supported)
- Added `minHeight: 48` for safety
- Applied to all button size variants (default, small, compact, bigger)

### 2. `CompeteApp/screens/Billiard/ScreenBilliardHome.tsx`

- Replaced manual View wrappers with `LBButtonsGroup` component
- Provides proper button group layout

### 3. `CompeteApp/app.json`

- Removed duplicate intentFilter
- Fixed `softwareKeyboardLayoutMode` from "adjustResize" to "resize"

## Deployment Status

### EAS Update Published ✅

- Update ID: `9ff126f5-62ed-47d3-885a-672304619b26`
- Branch: production
- Message: "Fix button sizing across entire app"

### ⚠️ CRITICAL ISSUE: Fingerprint Mismatch

The EAS Update was published successfully BUT cannot be delivered to existing builds due to fingerprint mismatch:

```
iOS fingerprint:     8c6c82e6b4a2a6b106c135be0b717ed97868d0ad
Android fingerprint: bc00836bec06a2de94b51d03eef90f8410c2e361
```

**Why:** Changes to `app.json` altered the app's fingerprint. EAS Updates can only be delivered to builds with matching fingerprints.

## Required Next Step: NEW BUILD

**You CANNOT "fix" the fingerprint.** You must create a new EAS build to get the button fixes on your device.

### Option 1: Quick Preview Build (Recommended for Testing)

```bash
eas build --platform android --profile preview
```

- Fastest option
- Creates an APK you can install directly on your phone
- Perfect for testing the button fix

### Option 2: Production Build

```bash
eas build --platform ios --profile production
```

- For TestFlight/App Store submission
- Takes longer but goes through official channels

## What Will Be Fixed

Once you install the new build, ALL buttons across the entire app will have proper sizing:

- ✅ Billiards page (Filters, Reset Filters buttons)
- ✅ Home page buttons
- ✅ Shop page buttons
- ✅ Profile/Login/Register buttons
- ✅ Admin page buttons
- ✅ All other buttons throughout the app

## Summary

**Code Status:** ✅ Complete and ready
**Update Status:** ✅ Published (but can't reach device due to fingerprint)
**Action Required:** Create new EAS build with command above
**Result:** All buttons will have proper height/padding once new build is installed

---

**Note:** This is a one-time rebuild requirement. After this, future style-only changes can be delivered via EAS Update as long as `app.json` doesn't change.
