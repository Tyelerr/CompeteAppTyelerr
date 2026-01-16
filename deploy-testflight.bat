@echo off
echo ========================================
echo    TestFlight Deployment Script
echo ========================================
echo.

echo Checking if we're in the CompeteApp directory...
if not exist "app.json" (
    echo ERROR: Please run this script from the CompeteApp directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo ✅ Found app.json - we're in the right directory
echo.

echo Step 1: Checking EAS CLI installation...
eas --version >nul 2>&1
if errorlevel 1 (
    echo ❌ EAS CLI not found. Installing...
    npm install -g eas-cli
    if errorlevel 1 (
        echo ERROR: Failed to install EAS CLI
        pause
        exit /b 1
    )
    echo ✅ EAS CLI installed successfully
) else (
    echo ✅ EAS CLI is already installed
)

echo.
echo Step 2: Login to EAS (this will open a browser)...
echo Press any key to continue with login...
pause >nul
eas login

echo.
echo Step 3: Configure Apple credentials...
echo This will guide you through setting up your Apple Developer credentials
echo Press any key to continue...
pause >nul
eas credentials

echo.
echo Step 4: Build for TestFlight...
echo This will create a production build for iOS
echo Press any key to start the build...
pause >nul
eas build --platform ios --profile production

echo.
echo Step 5: Submit to TestFlight...
echo This will upload your app to App Store Connect
echo Press any key to submit...
pause >nul
eas submit --platform ios

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
echo.
echo Your app should appear in TestFlight within 1-2 hours.
echo You can check the status at: https://appstoreconnect.apple.com
echo.
echo To check build status: eas build:list
echo To view build details: eas build:view [build-id]
echo.
pause
