@echo off
echo ========================================
echo Remove expo-dev-client for Production Build
echo ========================================
echo.
echo expo-dev-client is incompatible with Xcode 16 due to the
echo TARGET_IPHONE_SIMULATOR error in expo-dev-menu.
echo.
echo This script will:
echo 1. Remove expo-dev-client from package.json
echo 2. Remove expo-dev-client from app.json plugins
echo 3. Reinstall dependencies
echo 4. Prepare for production build
echo.
echo NOTE: You can reinstall expo-dev-client later for development builds
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Uninstalling expo-dev-client...
call npm uninstall expo-dev-client

echo.
echo Step 2: Removing node_modules and reinstalling...
if exist node_modules (
    rd /s /q node_modules
)
if exist package-lock.json (
    del /f /q package-lock.json
)

call npm install

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo expo-dev-client has been removed.
echo.
echo Now you can build for production:
echo   eas build --platform ios --profile production
echo.
echo After the build succeeds, submit to TestFlight:
echo   eas submit --platform ios
echo.
echo If you need expo-dev-client for development later:
echo   npm install expo-dev-client
echo   (But only use it for development builds, not production)
echo.
pause
