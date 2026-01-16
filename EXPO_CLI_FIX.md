# Expo CLI --eager Argument Fix

## Issue Resolved

The EAS build was failing with the error:

```
CommandError: Unknown arguments: --eager
error Command failed with exit code 1.
yarn expo export:embed --eager --platform ios --dev false exited with non-zero code: 1
```

## Root Cause

The `--eager` argument is not supported in the current version of Expo CLI. This argument was used in older versions but has been deprecated or removed.

## Solution Applied

Added `EXPO_USE_FAST_RESOLVER` environment variable to the EAS production build configuration:

```json
{
  "production": {
    "env": {
      "NPM_CONFIG_LEGACY_PEER_DEPS": "true",
      "EXPO_USE_FAST_RESOLVER": "1"
    }
  }
}
```

## What This Fix Does

- **EXPO_USE_FAST_RESOLVER**: Enables the fast resolver which replaces the functionality that `--eager` used to provide
- **Maintains Performance**: Ensures fast bundling without deprecated arguments
- **Future Compatibility**: Uses the modern approach for Expo CLI optimization

## Combined Fixes Now Applied

1. **Xcode 16/iOS 18 SDK**: `"image": "latest"` for Apple's new requirements
2. **Node.js Version**: `"node": "22.11.0"` for React Native compatibility
3. **Legacy Peer Dependencies**: `"NPM_CONFIG_LEGACY_PEER_DEPS": "true"` for dependency resolution
4. **Fast Resolver**: `"EXPO_USE_FAST_RESOLVER": "1"` to replace deprecated --eager argument
5. **Cache Disabled**: `"cache": {"disabled": true}` for clean builds

The build should now succeed with all compatibility issues resolved.
