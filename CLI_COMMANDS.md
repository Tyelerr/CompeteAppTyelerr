# CLI Commands Reference

## Working Commands (Use These)

### Development Server

```bash
npm start                    # Start Expo development server with QR code
npm run tunnel              # Start with tunnel mode (for external access)
npm run web                 # Start web version
```

### Build Commands

```bash
npm run android             # Run on Android
npm run ios                 # Run on iOS
npm run prebuild            # Clean prebuild (regenerate native projects)
```

### Utility Commands

```bash
npm install                 # Install dependencies
npm run doctor              # Run expo doctor (when CLI is fixed)
```

## Problematic Commands (Avoid These)

```bash
npx expo start --tunnel     # ❌ Fails due to npx PATH issue
npx expo doctor             # ❌ Fails due to npx PATH issue
expo start                  # ❌ Expo CLI not in PATH
```

## Current Status

- ✅ **npm start** - Working perfectly with QR code
- ✅ **npm run tunnel** - Added for tunnel mode
- ✅ **Development server** - Running at exp://10.0.23.19:8081
- ✅ **Production build** - Available at https://expo.dev/accounts/tyelerr/projects/app/builds/afecd48a-3708-44c6-9ea5-5e2d6d1d4eec

## Testing Options

1. **Expo Go**: Scan QR code from `npm start` output
2. **Production Build**: Download from the build link above
3. **Web**: Use `npm run web` for browser testing

All major build and dependency issues have been resolved!
