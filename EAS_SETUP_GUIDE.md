# EAS Build Setup Guide for TestFlight

## 📋 Prerequisites

### Required Accounts:

1. **Expo Account** (FREE) - Sign up at https://expo.dev
2. **Apple Developer Account** ($99/year) - Required for TestFlight

## 🚀 Step-by-Step Setup

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to EAS

```bash
eas login
```

Enter your Expo account credentials when prompted.

### Step 3: Configure Your Project

```bash
cd CompeteApp
eas build:configure
```

This will:

- Generate a unique project ID
- Update your `app.json` with the project ID
- Validate your `eas.json` configuration

### Step 4: Set Up Apple Developer Credentials

```bash
eas credentials
```

Choose:

- iOS
- Production
- Follow prompts to connect your Apple Developer account

### Step 5: Build for TestFlight

```bash
eas build --platform ios --profile production
```

### Step 6: Submit to TestFlight

```bash
eas submit --platform ios
```

## 📝 Configuration Files Created

### `eas.json`

- **development**: For internal testing
- **preview**: For stakeholder review
- **production**: For App Store/TestFlight

### `app.json` Updates

- Added `buildNumber` for iOS
- Added EAS project configuration
- Ready for TestFlight submission

## 🔧 Troubleshooting

### Common Issues:

1. **Apple Developer Account**: Ensure you have an active paid account
2. **Bundle ID**: Must match your Apple Developer account app registration
3. **Certificates**: EAS will handle provisioning profiles automatically

### Build Commands:

```bash
# Development build (for testing)
eas build --platform ios --profile development

# Production build (for TestFlight)
eas build --platform ios --profile production

# Check build status
eas build:list
```

## 📱 TestFlight Process

1. Build completes successfully
2. Submit to App Store Connect
3. App appears in TestFlight
4. Add internal/external testers
5. Distribute for testing

## 🔗 Useful Links

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [TestFlight Guide](https://docs.expo.dev/submit/ios/)
- [Apple Developer Portal](https://developer.apple.com/)

## 📞 Support

If you encounter issues:

1. Check the EAS build logs
2. Review Apple Developer account settings
3. Ensure all certificates are valid
