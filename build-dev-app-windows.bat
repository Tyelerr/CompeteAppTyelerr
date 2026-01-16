@echo off
echo ========================================
echo Build Development App (Windows - EAS Cloud)
echo ========================================
echo.
echo Since you're on Windows, iOS apps must be built in the cloud using EAS Build.
echo This script will guide you through the process.
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Checking if EAS CLI is installed...
call eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo EAS CLI not found. Installing...
    call npm install -g eas-cli
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install EAS CLI
        pause
        exit /b 1
    )
)

echo.
echo Step 2: Checking EAS login status...
call eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo You need to log in to EAS.
    echo.
    call eas login
    if %errorlevel% neq 0 (
        echo ERROR: Failed to log in to EAS
        pause
        exit /b 1
    )
)

echo.
echo Step 3: Installing expo-dev-client (if not already installed)...
call npx expo install expo-dev-client

echo.
echo Step 4: Checking eas.json configuration...
if not exist eas.json (
    echo Creating eas.json...
    call eas build:configure
)

echo.
echo ========================================
echo Ready to Build!
echo ========================================
echo.
echo You have two options:
echo.
echo 1. Development Build (for testing on your device)
echo    - Includes dev tools
echo    - Can connect to Metro bundler
echo    - Best for active development
echo.
echo 2. Preview Build (closer to production)
echo    - No dev tools
echo    - Standalone app
echo    - Good for testing before production
echo.
echo Which would you like to build?
echo   [1] Development Build (recommended)
echo   [2] Preview Build
echo   [3] Cancel
echo.
set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" goto dev_build
if "%choice%"=="2" goto preview_build
if "%choice%"=="3" goto cancel
echo Invalid choice. Exiting.
goto end

:dev_build
echo.
echo Building Development Build for iOS...
echo This will take 10-20 minutes.
echo.
echo The build will run in the cloud on EAS servers.
echo You can close this window and check status at: https://expo.dev
echo.
pause
call eas build --platform ios --profile development
goto build_complete

:preview_build
echo.
echo Building Preview Build for iOS...
echo This will take 10-20 minutes.
echo.
echo The build will run in the cloud on EAS servers.
echo You can close this window and check status at: https://expo.dev
echo.
pause
call eas build --platform ios --profile preview
goto build_complete

:cancel
echo Build cancelled.
goto end

:build_complete
echo.
echo ========================================
echo Build Submitted!
echo ========================================
echo.
echo Your build is now running in the cloud.
echo.
echo To check the status:
echo   1. Visit: https://expo.dev
echo   2. Go to your project
echo   3. Click on "Builds"
echo.
echo Once the build completes:
echo   1. You'll receive an email notification
echo   2. Download the .ipa file or scan the QR code
echo   3. Install on your iOS device
echo.
echo To install on your device:
echo   - Scan the QR code from the build page with your camera
echo   - Or download and install via TestFlight
echo.
echo After installation:
echo   1. Run: npx expo start --dev-client
echo   2. Scan the QR code with your development app
echo   3. Your app will load with hot reloading enabled
echo.
pause

:end
echo.
echo ========================================
echo Script Complete
echo ========================================
