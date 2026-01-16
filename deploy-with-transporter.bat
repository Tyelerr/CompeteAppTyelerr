@echo off
echo.
echo ========================================
echo   Deploy to App Store with Transporter
echo ========================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Navigate to CompeteApp directory
cd /d "%~dp0"

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found! Make sure you're in the CompeteApp directory.
    pause
    exit /b 1
)

echo 📁 Current directory: %CD%
echo.

REM Check for App Store Connect credentials
if not exist ".env" (
    if not exist "app-store-connect-config.json" (
        echo ❌ App Store Connect credentials not found!
        echo.
        echo Please set up your credentials using one of these methods:
        echo.
        echo 1. Create .env file with:
        echo    APP_STORE_CONNECT_ISSUER_ID=your-issuer-id
        echo    APP_STORE_CONNECT_KEY_ID=your-key-id
        echo    APP_STORE_CONNECT_PRIVATE_KEY_PATH=./keys/AuthKey_KEYID.p8
        echo.
        echo 2. Create app-store-connect-config.json file
        echo    Copy from app-store-connect-config.json.example
        echo.
        echo Get credentials from: App Store Connect ^> Users and Access ^> Keys
        pause
        exit /b 1
    )
)

echo ✅ App Store Connect credentials configured
echo.

REM Menu for deployment options
echo Choose deployment option:
echo.
echo 1. Build with EAS and upload with Transporter
echo 2. Upload existing IPA file with Transporter
echo 3. Test JWT token generation only
echo 4. Install Transporter (macOS only)
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto build_and_upload
if "%choice%"=="2" goto upload_existing
if "%choice%"=="3" goto test_jwt
if "%choice%"=="4" goto install_transporter

echo ❌ Invalid choice. Please select 1-4.
pause
exit /b 1

:build_and_upload
echo.
echo 🚀 Building with EAS and uploading with Transporter...
echo.

REM Check if EAS CLI is installed
eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ EAS CLI not found! Installing...
    npm install -g @expo/eas-cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install EAS CLI
        pause
        exit /b 1
    )
)

echo ✅ EAS CLI found
echo.

REM Login to EAS
echo 🔐 Logging into EAS...
eas login
if %errorlevel% neq 0 (
    echo ❌ EAS login failed
    pause
    exit /b 1
)

echo.
echo 🏗️ Building iOS app...
eas build --platform ios --profile production --non-interactive
if %errorlevel% neq 0 (
    echo ❌ EAS build failed
    pause
    exit /b 1
)

echo.
echo 📥 Downloading latest build...
eas build:download --latest --platform ios
if %errorlevel% neq 0 (
    echo ❌ Build download failed
    pause
    exit /b 1
)

REM Find the downloaded IPA file
for %%f in (*.ipa) do set "ipa_file=%%f"

if not defined ipa_file (
    echo ❌ No IPA file found in current directory
    echo Please download your IPA manually and use option 2
    pause
    exit /b 1
)

echo ✅ Found IPA file: %ipa_file%
echo.

REM Upload with Transporter
echo ⬆️ Uploading to App Store Connect with Transporter...
node scripts/transporter-upload.js "%ipa_file%" --verbose
if %errorlevel% neq 0 (
    echo ❌ Transporter upload failed
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment completed successfully!
echo 📱 Check App Store Connect for your build: https://appstoreconnect.apple.com
goto end

:upload_existing
echo.
set /p ipa_path="Enter path to your IPA file: "

if not exist "%ipa_path%" (
    echo ❌ IPA file not found: %ipa_path%
    pause
    exit /b 1
)

echo.
echo ⬆️ Uploading to App Store Connect with Transporter...
node scripts/transporter-upload.js "%ipa_path%" --verbose
if %errorlevel% neq 0 (
    echo ❌ Transporter upload failed
    pause
    exit /b 1
)

echo.
echo 🎉 Upload completed successfully!
echo 📱 Check App Store Connect for your build: https://appstoreconnect.apple.com
goto end

:test_jwt
echo.
echo 🔐 Testing JWT token generation...
node scripts/jwt-auth.js
if %errorlevel% neq 0 (
    echo ❌ JWT token generation failed
    pause
    exit /b 1
)

echo.
echo ✅ JWT token generation successful!
goto end

:install_transporter
echo.
echo 📦 Installing Transporter...
echo.
echo Transporter installation options:
echo.
echo 1. Download from Mac App Store (Recommended):
echo    https://apps.apple.com/app/transporter/id1450874784
echo.
echo 2. Download from Apple Developer:
echo    https://developer.apple.com/transporter/
echo.
echo 3. Install via Xcode Command Line Tools:
echo    xcode-select --install
echo.
echo After installation, Transporter will be available at:
echo /Applications/Transporter.app/Contents/itms/bin/iTMSTransporter
echo.
echo Note: This script is for Windows, but Transporter is primarily for macOS.
echo For Windows, you'll need to use alternative methods or run on macOS.
goto end

:end
echo.
echo ========================================
echo   Deployment process completed
echo ========================================
echo.
pause
