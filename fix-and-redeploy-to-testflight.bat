@echo off
echo ========================================
echo Fix Runtime Crash and Redeploy to TestFlight
echo ========================================
echo.
echo This script will:
echo 1. Remove expo-dev-client (causes Xcode 16 issues)
echo 2. Fix all dependency versions
echo 3. Clear caches
echo 4. Rebuild for production
echo 5. Submit to TestFlight
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Removing expo-dev-client...
call npm uninstall expo-dev-client

echo.
echo Step 2: Fixing all dependencies...
call npx expo install --fix

echo.
echo Step 3: Clearing caches...
if exist node_modules (
    rd /s /q node_modules
)
if exist package-lock.json (
    del /f /q package-lock.json
)

echo.
echo Step 4: Reinstalling dependencies...
call npm install

echo.
echo Step 5: Clearing Metro cache...
call npx expo start --clear

echo.
echo ========================================
echo Dependencies Fixed!
echo ========================================
echo.
echo Now building for production with Xcode 16...
echo This will take 10-20 minutes.
echo.
pause

echo.
echo Step 6: Building for iOS...
call eas build --platform ios --profile production

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed
    echo Check the error messages above
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build Succeeded!
echo ========================================
echo.
echo Now submitting to TestFlight...
pause

echo.
echo Step 7: Submitting to TestFlight...
call eas submit --platform ios

echo.
echo ========================================
echo Complete!
echo ========================================
echo.
echo Your app has been submitted to TestFlight.
echo.
echo Check TestFlight on your iPhone in a few minutes.
echo The new build should work without crashing.
echo.
pause
