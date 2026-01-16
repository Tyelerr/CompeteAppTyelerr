# 🚀 How to Deploy Your App to TestFlight

## Quick Start Commands

Open your terminal in the `CompeteApp` folder and run these commands in order:

### 1. Login to Expo

```bash
eas login
```

- Enter your Expo account email and password
- If you don't have an account, create one at https://expo.dev (FREE)

### 2. Configure Your Project

```bash
eas build:configure
```

- This generates a unique project ID
- Updates your app.json automatically
- Validates your eas.json configuration

### 3. Set Up Apple Developer Credentials

```bash
eas credentials
```

- Choose: **iOS** → **Production**
- Follow prompts to connect your Apple Developer account
- EAS will handle certificates and provisioning profiles automatically

### 4. Build for TestFlight

```bash
eas build --platform ios --profile production
```

- This creates your iOS app build
- Takes 10-20 minutes to complete
- You'll get a download link when finished

### 5. Submit to TestFlight

```bash
eas submit --platform ios
```

- Automatically uploads your build to App Store Connect
- Your app will appear in TestFlight within 1-2 hours

## 📋 Prerequisites

### Required Accounts:

1. **Expo Account** (FREE)

   - Sign up at: https://expo.dev
   - Used for EAS build service

2. **Apple Developer Account** ($99/year)
   - Required for TestFlight and App Store
   - Sign up at: https://developer.apple.com

### Before You Start:

- Ensure you're in the `CompeteApp` directory
- Your app configuration is ready (already done!)
- EAS CLI is installed (already done!)

## 🔧 Alternative: Interactive Setup

Run the interactive setup script:

```bash
start-eas-setup.bat
```

This will guide you through each step with prompts.

## 📱 After Deployment

1. **Check TestFlight**: Your app appears in TestFlight within 1-2 hours
2. **Add Testers**: Invite users via email in App Store Connect
3. **Test**: Download and test your app from TestFlight
4. **Submit to App Store**: When ready, submit for App Store review

## 🆘 Common Issues

### "Not logged in"

```bash
eas login
```

### "Project not configured"

```bash
eas build:configure
```

### "No Apple Developer account"

- You need a paid Apple Developer account ($99/year)
- Sign up at https://developer.apple.com

### Build fails

- Check the build logs in your terminal
- Ensure all dependencies are compatible
- Try: `npm install` then rebuild

## 📞 Need Help?

- Check the detailed guide: `EAS_SETUP_GUIDE.md`
- Expo Documentation: https://docs.expo.dev/build/
- TestFlight Guide: https://docs.expo.dev/submit/ios/

## 🎯 Summary

The deployment process is:
**Login** → **Configure** → **Credentials** → **Build** → **Submit** → **TestFlight**

Your app is already configured and ready to deploy!
