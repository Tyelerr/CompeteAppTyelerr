# Node.js Version Compatibility Fix

## Issue Resolved

The EAS build was failing with the error:

```
error react-native@0.81.4: The engine "node" is incompatible with this module. Expected version ">= 20.19.4". Got "20.18.0"
```

## Root Cause

React Native 0.81.4 requires Node.js version >= 20.19.4, but EAS was configured to use Node.js 20.18.0.

## Solution Applied

Updated `eas.json` to use Node.js 22.11.0 across all build profiles:

```json
{
  "build": {
    "development": {
      "node": "22.11.0"
    },
    "preview": {
      "node": "22.11.0"
    },
    "production": {
      "node": "22.11.0"
    }
  }
}
```

## Benefits

- ✅ Resolves React Native 0.81.4 compatibility issue
- ✅ Uses latest stable Node.js LTS version
- ✅ Ensures consistent Node.js version across all build environments
- ✅ Future-proofs against Node.js version requirements

## Combined Fixes Applied

1. **Xcode 16/iOS 18 SDK**: `"image": "latest"` for Apple's new requirements
2. **Node.js Version**: `"node": "22.11.0"` for React Native compatibility
3. **Legacy Peer Dependencies**: `"NPM_CONFIG_LEGACY_PEER_DEPS": "true"` for dependency resolution
4. **Cache Disabled**: `"cache": {"disabled": true}` for clean builds

The build should now succeed with both Apple's SDK requirements and Node.js compatibility resolved.
