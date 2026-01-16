@echo off
echo ========================================
echo  TestFlight Deployment Script (Fixed)
echo ========================================
echo.

echo Step 1: Checking EAS CLI installation...
eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo EAS CLI not found. Installing...
    npm install -g @expo/eas-cli
) else (
    echo EAS CLI is already installed.
)

echo.
echo Step 2: Logging into EAS...
eas login

echo.
echo Step 3: Checking project configuration...
eas project:info

echo.
echo Step 4: Building for iOS (production)...
eas build --platform ios --profile production

echo.
echo Step 5: Submitting to TestFlight...
eas submit --platform ios --latest

echo.
echo ========================================
echo  TestFlight Deployment Complete!
echo ========================================
echo.
echo Your app has been submitted to TestFlight.
echo Check your email and App Store Connect for updates.
echo.
pause
