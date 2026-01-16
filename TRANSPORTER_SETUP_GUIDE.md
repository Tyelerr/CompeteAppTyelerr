# 🚀 Transporter with JWT Authentication Setup Guide

This guide will help you set up Transporter with JWT authentication for uploading your React Native app to App Store Connect using the App Store Connect API.

## 📋 Prerequisites

### Required Accounts & Tools

- **Apple Developer Account** ($99/year) - Required for App Store Connect access
- **App Store Connect API Access** - Create API keys in App Store Connect
- **Node.js** (v18 or later) - For running the JWT generation and upload scripts
- **Transporter** - Apple's command-line tool for uploading binaries

### System Requirements

- **macOS** (recommended) - Transporter works best on macOS
- **Windows** - Limited support, some features may not work
- **Linux** - Not officially supported by Apple

## 🔑 Step 1: Create App Store Connect API Key

### 1.1 Access App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Navigate to **Users and Access** > **Keys**

### 1.2 Create API Key

1. Click the **+** button to create a new key
2. Enter a **Key Name** (e.g., "Transporter Upload Key")
3. Select **Access Level**: Choose **Developer** or **Admin**
4. Click **Generate**

### 1.3 Download and Save Key Information

1. **Download the .p8 file** immediately (you can only download it once!)
2. Note down the **Key ID** (e.g., `ABC123DEF4`)
3. Note down the **Issuer ID** (found at the top of the Keys page)

### 1.4 Secure Storage

```bash
# Create a secure directory for your keys
mkdir -p CompeteApp/keys
chmod 700 CompeteApp/keys

# Move your downloaded key file
mv ~/Downloads/AuthKey_ABC123DEF4.p8 CompeteApp/keys/
chmod 600 CompeteApp/keys/AuthKey_ABC123DEF4.p8
```

## 📦 Step 2: Install Transporter

### Option 1: Mac App Store (Recommended)

1. Download from [Mac App Store](https://apps.apple.com/app/transporter/id1450874784)
2. Install and launch once to complete setup

### Option 2: Direct Download

1. Visit [Apple Developer - Transporter](https://developer.apple.com/transporter/)
2. Download the latest version
3. Install following Apple's instructions

### Option 3: Command Line Tools

```bash
# Install Xcode Command Line Tools (includes Transporter)
xcode-select --install
```

### Verify Installation

```bash
# Check if Transporter is installed
/Applications/Transporter.app/Contents/itms/bin/iTMSTransporter -version

# Or if in PATH
iTMSTransporter -version
```

## ⚙️ Step 3: Configure Credentials

### Option 1: Environment Variables (Recommended)

Create a `.env` file in your `CompeteApp` directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your credentials:

```env
APP_STORE_CONNECT_ISSUER_ID=12345678-1234-1234-1234-123456789012
APP_STORE_CONNECT_KEY_ID=ABC123DEF4
APP_STORE_CONNECT_PRIVATE_KEY_PATH=./keys/AuthKey_ABC123DEF4.p8
BUNDLE_ID=com.tyelerr.app
```

### Option 2: Configuration File

Create `app-store-connect-config.json`:

```bash
# Copy the example file
cp app-store-connect-config.json.example app-store-connect-config.json
```

Edit with your credentials:

```json
{
  "issuerId": "12345678-1234-1234-1234-123456789012",
  "keyId": "ABC123DEF4",
  "privateKeyPath": "./keys/AuthKey_ABC123DEF4.p8",
  "bundleId": "com.tyelerr.app"
}
```

## 🧪 Step 4: Test Your Setup

### Test JWT Token Generation

```bash
# Navigate to your project directory
cd CompeteApp

# Test JWT token generation
node scripts/jwt-auth.js
```

Expected output:

```
🚀 Starting JWT token generation...
🔐 Generating JWT token...
✅ Private key loaded successfully
✅ JWT token generated successfully
📝 Token length: 847 characters
✅ Token validation passed
📅 Token expires at: 2024-01-15T10:30:00.000Z

🎉 JWT Token Generated Successfully!
📋 Copy this token for use with Transporter:

eyJhbGciOiJFUzI1NiIsImtpZCI6IkFCQzEyM0RFRjQiLCJ0eXAiOiJKV1QifQ...
```

### Test Transporter Installation

```bash
# Test Transporter with dry run
node scripts/transporter-upload.js --help
```

## 🚀 Step 5: Deploy Your App

### Method 1: Complete Build and Upload

```bash
# Run the complete deployment script
./deploy-with-transporter.bat

# Or on macOS/Linux
chmod +x deploy-with-transporter.sh
./deploy-with-transporter.sh
```

### Method 2: Upload Existing IPA

```bash
# If you already have an IPA file
node scripts/transporter-upload.js path/to/your/app.ipa --verbose
```

### Method 3: Manual Steps

#### Build with EAS

```bash
# Login to EAS
eas login

# Build for iOS
eas build --platform ios --profile production

# Download the build
eas build:download --latest --platform ios
```

#### Upload with Transporter

```bash
# Upload the downloaded IPA
node scripts/transporter-upload.js ./YourApp.ipa --verbose
```

## 🔧 Advanced Configuration

### Custom Transporter Options

You can modify the upload script to include additional Transporter options:

```javascript
// In scripts/transporter-upload.js, modify buildTransporterCommand()
const command = [
  this.transporterPath,
  '-m',
  'upload',
  '-f',
  ipaPath,
  '-jwt',
  tokenPath,
  '-t',
  'Signiant', // Transport method
  '-k',
  '100000', // Timeout in milliseconds
  '-v',
  'eXtreme', // Verbose logging
  '-WarnAsError', // Treat warnings as errors
];
```

### Environment-Specific Configurations

Create different configuration files for different environments:

```bash
# Development
app-store-connect-config.dev.json

# Production
app-store-connect-config.prod.json

# Staging
app-store-connect-config.staging.json
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Private key file not found"

```bash
# Check file path and permissions
ls -la CompeteApp/keys/
chmod 600 CompeteApp/keys/AuthKey_*.p8
```

#### 2. "Transporter not found"

```bash
# Check installation paths
ls -la /Applications/Transporter.app/Contents/itms/bin/iTMSTransporter
which iTMSTransporter
```

#### 3. "JWT token expired"

- JWT tokens expire after 20 minutes
- The script generates fresh tokens automatically
- If you see this error, just retry the upload

#### 4. "Upload failed with authentication error"

- Verify your Issuer ID and Key ID are correct
- Ensure the .p8 file matches your Key ID
- Check that your API key has sufficient permissions

#### 5. "Bundle ID mismatch"

- Ensure the bundle ID in your configuration matches your app
- Check `app.json` for the correct bundle identifier

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Enable verbose output
node scripts/transporter-upload.js your-app.ipa --verbose

# Test with dry run (validation only)
node scripts/transporter-upload.js your-app.ipa --dry-run
```

### Log Files

Transporter creates log files in:

- macOS: `~/Library/Logs/Transporter/`
- Check these logs for detailed error information

## 🔒 Security Best Practices

### 1. Protect Your Private Keys

```bash
# Set restrictive permissions
chmod 600 CompeteApp/keys/AuthKey_*.p8

# Never commit keys to version control
echo "keys/" >> .gitignore
echo ".env" >> .gitignore
echo "app-store-connect-config.json" >> .gitignore
```

### 2. Rotate API Keys Regularly

- Create new API keys every 6-12 months
- Revoke old keys after successful migration
- Monitor key usage in App Store Connect

### 3. Use Environment Variables in CI/CD

```bash
# In your CI/CD pipeline
export APP_STORE_CONNECT_ISSUER_ID="your-issuer-id"
export APP_STORE_CONNECT_KEY_ID="your-key-id"
export APP_STORE_CONNECT_PRIVATE_KEY_PATH="/secure/path/to/key.p8"
```

## 📚 Additional Resources

### Apple Documentation

- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- [Transporter User Guide](https://help.apple.com/itc/transporteruserguide/)
- [Creating API Keys](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api)

### JWT Resources

- [JWT.io](https://jwt.io/) - JWT token debugger
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT specification

### EAS Documentation

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** - Enable verbose mode and check Transporter logs
2. **Verify credentials** - Test JWT generation separately
3. **Check Apple's status** - Visit [Apple System Status](https://www.apple.com/support/systemstatus/)
4. **Review documentation** - Check Apple's latest Transporter documentation

## 🎉 Success!

Once everything is set up correctly, you should see:

```
🎉 Upload completed successfully!
📱 Your app should appear in App Store Connect within a few minutes.
🔗 Check status at: https://appstoreconnect.apple.com
```

Your app will then be available in TestFlight for internal testing and can be submitted to the App Store for review.
