# Upgrade to Node 20 and Modern Dependencies Plan

## Current Issues:

- Expo SDK 54 (outdated, causing build failures)
- React Native 0.81.4 (very old)
- React 19.1.0 (too new for old RN version)
- Node version compatibility issues

## Step-by-Step Upgrade Plan:

### 1. Update Node.js to Version 20

```bash
# Install Node 20 (if not already installed)
# Download from: https://nodejs.org/en/download/
# Or use nvm: nvm install 20 && nvm use 20
```

### 2. Update Expo SDK (54 → 52)

```bash
npx expo install --fix
npx expo upgrade 52
```

### 3. Update Core Dependencies

```bash
# Update React Native and React to compatible versions
npm install react@18.3.1 react-dom@18.3.1
npm install react-native@0.76.3
```

### 4. Update Expo Dependencies

```bash
npx expo install --fix
npm install expo@52.0.0
```

### 5. Update Navigation Dependencies

```bash
npm install @react-navigation/native-stack@^7.3.21
npm install @react-navigation/bottom-tabs@^7.4.2
npm install react-native-screens@~4.16.0
```

### 6. Update TypeScript and Build Tools

```bash
npm install --save-dev typescript@~5.8.3
npm install --save-dev @types/react@~18.3.12
npm install --save-dev @types/react-native@^0.76.0
```

### 7. Add Node 20 Engine Specification

Add to package.json:

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

### 8. Update EAS Build Configuration

Add to eas.json:

```json
{
  "build": {
    "production": {
      "node": "20.18.0",
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  }
}
```

## Files That Need Updates:

### package.json - Major Version Updates Needed:

- expo: 54.0.6 → 52.0.0
- react: 19.1.0 → 18.3.1
- react-dom: 19.1.0 → 18.3.1
- react-native: 0.81.4 → 0.76.3
- @types/react: ~19.0.10 → ~18.3.12
- @types/react-native: ^0.73.0 → ^0.76.0

### app.json - SDK Version Update:

- Update Expo SDK version reference

### Metro Configuration:

- May need metro.config.js updates for new RN version

## Potential Breaking Changes:

1. **React 19 → 18**: Some newer React features may need adjustment
2. **RN 0.81 → 0.76**: Navigation and component changes
3. **Expo SDK 54 → 52**: Some Expo APIs may have changed

## Testing Required After Upgrade:

1. App compilation and startup
2. Navigation functionality
3. Supabase integration
4. Image picker and location services
5. All custom components

## Recommended Approach:

1. Create a backup branch
2. Update dependencies incrementally
3. Test after each major update
4. Fix any breaking changes
5. Re-run EAS build

Would you like me to start implementing these updates?
