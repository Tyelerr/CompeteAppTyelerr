# 📱 App Store Connect Setup for TestFlight

## What You Need to Do in App Store Connect

### 🚀 Initial Setup (One-Time Only)

#### 1. Create Your App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Click **"My Apps"** → **"+"** → **"New App"**
4. Fill in:
   - **Platform**: iOS
   - **Name**: Compete (or your app name)
   - **Primary Language**: English
   - **Bundle ID**: `com.tyelerr.app` (should match your app.json)
   - **SKU**: Any unique identifier (e.g., "compete-app-2024")

#### 2. Fill Required App Information

1. **App Information**:
   - Category: Games or Sports (choose appropriate)
   - Content Rights: Check if you own rights
2. **Pricing and Availability**:
   - Price: Free (or set your price)
   - Availability: All countries or select specific ones

### 📋 After Your First Upload (via `eas submit`)

#### 3. Set Up TestFlight

1. **Go to TestFlight Tab** in your app
2. **Internal Testing**:
   - Click **"+"** to create a new group
   - Name it "Internal Testers" or similar
   - Add your build (it will appear after EAS upload)
   - Add testers by email address

#### 4. Add Test Information

1. **Test Information**:
   - **What to Test**: Describe what testers should focus on
   - **App Description**: Brief description of your app
   - **Feedback Email**: Your email for tester feedback
   - **Marketing URL**: Optional
   - **Privacy Policy URL**: Required if you collect data

### 🔄 Regular Workflow (After Setup)

#### Every Time You Upload a New Build:

1. **EAS uploads your build automatically** ✅
2. **Wait for processing** (1-2 hours)
3. **Go to App Store Connect** → **TestFlight**
4. **Your new build appears** in the builds list
5. **Add it to your test group**:
   - Click on your Internal Testing group
   - Click **"+"** next to builds
   - Select your new build
   - Click **"Add"**
6. **Testers get notified automatically** 📧

### 👥 Managing Testers

#### Add Internal Testers (Up to 100):

1. **TestFlight** → **Internal Testing**
2. Click your test group
3. **Testers** section → **"+"**
4. Enter email addresses
5. Click **"Add"**

#### Add External Testers (Up to 10,000):

1. **TestFlight** → **External Testing**
2. Create external group (requires App Review)
3. Add testers by email or public link

### 📧 What Testers Need to Do

1. **Receive email invitation**
2. **Download TestFlight app** from App Store
3. **Tap "Accept" in email** or enter code in TestFlight
4. **Install your app** from TestFlight
5. **Provide feedback** through TestFlight

### ⚠️ Important Notes

- **First upload**: May take longer to process
- **Build expiration**: TestFlight builds expire after 90 days
- **Version numbers**: Each build needs a unique build number
- **App Review**: External testing requires Apple review
- **Internal testing**: No review needed, immediate access

### 🔍 Monitoring Your App

#### Check Build Status:

- **App Store Connect** → **TestFlight** → **iOS Builds**
- Status shows: Processing → Testing → Ready for Testing

#### View Crash Reports:

- **TestFlight** → **Crashes** tab
- See detailed crash logs and user feedback

### 🎯 Summary: Your Action Items

1. **First Time**: Create app in App Store Connect
2. **Run**: `eas submit --platform ios` (uploads automatically)
3. **Wait**: 1-2 hours for processing
4. **Set up**: TestFlight internal testing group
5. **Add**: Tester email addresses
6. **Done**: Testers receive invitations automatically!

### 📞 Need Help?

- **App Store Connect Help**: https://developer.apple.com/support/app-store-connect/
- **TestFlight Guide**: https://developer.apple.com/testflight/
- **Contact Apple**: Through Developer Support if you get stuck

The key point: **EAS handles the upload automatically** - you just need to set up the TestFlight testing groups and add testers in App Store Connect!
