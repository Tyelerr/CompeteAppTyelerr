@echo off
echo ========================================
echo Switch from Expo Go to Development Builds
echo ========================================
echo.
echo This script will:
echo 1. Install expo-dev-client
echo 2. Update app.json configuration
echo 3. Clear caches
echo 4. Prepare for building
echo.
echo After this, you'll need to build the app with:
echo   npx expo run:ios
echo   OR
echo   eas build --platform ios --profile development
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Installing expo-dev-client...
call npx expo install expo-dev-client

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install expo-dev-client
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo Step 2: Checking app.json configuration...
echo.
echo IMPORTANT: You need to manually add expo-dev-client to app.json plugins array.
echo.
echo Open CompeteApp/app.json and ensure the plugins array includes:
echo   "plugins": ["expo-dev-client"]
echo.
echo Current app.json shows: "plugins": []
echo.
echo Would you like me to show you the exact change needed?
pause

echo.
echo ========================================
echo Add this to your app.json:
echo ========================================
echo.
echo In the "expo" section, change:
echo   "plugins": [],
echo.
echo To:
echo   "plugins": ["expo-dev-client"],
echo.
echo ========================================
echo.
pause

echo.
echo Step 3: Clearing caches...
call npx expo start --clear

echo.
echo Step 4: Removing old builds...
if exist ios (
    echo Removing ios folder...
    rd /s /q ios
)
if exist android (
    echo Removing android folder...
    rd /s /q android
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo 1. Update app.json to include expo-dev-client in plugins
echo.
echo 2. Build the development app:
echo.
echo    For iOS (local):
echo      npx expo run:ios
echo.
echo    For iOS (EAS - recommended):
echo      eas build --platform ios --profile development
echo.
echo 3. Install the built app on your device
echo.
echo 4. Start the development server:
echo      npx expo start --dev-client
echo.
echo 5. Scan the QR code with your development app
echo.
echo ========================================
echo.
echo Benefits of Development Builds:
echo   ✓ No SDK version restrictions
echo   ✓ Works with any Expo SDK version
echo   ✓ Can include custom native code
echo   ✓ More like your production app
echo   ✓ Better for serious development
echo.
pause
