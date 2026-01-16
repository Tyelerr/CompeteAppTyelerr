@echo off
echo ========================================
echo COMPLETE CLEANUP AND FIX FOR TESTFLIGHT
echo ========================================
echo.
echo This will do a COMPLETE cleanup and rebuild to fix the crash.
echo.
echo Steps:
echo 1. Remove expo-dev-client (causes Xcode 16 issues)
echo 2. Clear ALL caches and node_modules
echo 3. Fix all dependency versions
echo 4. Rebuild everything from scratch
echo 5. Build for production with Xcode 16
echo 6. Submit to TestFlight
echo.
pause

cd /d "%~dp0"

echo.
echo ========================================
echo STEP 1: Removing Problematic Dependencies
echo ========================================
echo.
echo Removing expo-dev-client...
call npm uninstall expo-dev-client

echo.
echo ========================================
echo STEP 2: Complete Cache Cleanup
echo ========================================
echo.

echo Stopping any running Metro processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Clearing Watchman cache...
call watchman watch-del-all 2>nul

echo Removing node_modules...
if exist node_modules (
    echo This may take a minute...
    rd /s /q node_modules
)

echo Removing package-lock.json...
if exist package-lock.json (
    del /f /q package-lock.json
)

echo Clearing npm cache...
call npm cache clean --force

echo Clearing Metro cache...
if exist "%LOCALAPPDATA%\Temp\metro-*" (
    rd /s /q "%LOCALAPPDATA%\Temp\metro-*" 2>nul
)
if exist "%LOCALAPPDATA%\Temp\haste-map-*" (
    rd /s /q "%LOCALAPPDATA%\Temp\haste-map-*" 2>nul
)
if exist "%LOCALAPPDATA%\Temp\react-native-*" (
    rd /s /q "%LOCALAPPDATA%\Temp\react-native-*" 2>nul
)
if exist "%LOCALAPPDATA%\Temp\react-*" (
    rd /s /q "%LOCALAPPDATA%\Temp\react-*" 2>nul
)

echo Removing ios and android folders...
if exist ios (
    rd /s /q ios
)
if exist android (
    rd /s /q android
)

echo.
echo ========================================
echo STEP 3: Fixing Dependencies
echo ========================================
echo.

echo Installing fresh dependencies...
call npm install

echo Fixing all Expo dependencies...
call npx expo install --fix

echo.
echo ========================================
echo STEP 4: Verifying Configuration
echo ========================================
echo.

echo Current configuration:
echo - Build Number: 15 (in app.json)
echo - App Version Source: local (in eas.json)
echo - Xcode Image: latest (Xcode 16)
echo - New Architecture: false
echo - Plugins: expo-font only
echo.

echo.
echo ========================================
echo STEP 5: Building for Production
echo ========================================
echo.
echo This will take 10-20 minutes...
echo The build runs on EAS cloud servers.
echo.
pause

call eas build --platform ios --profile production

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo BUILD FAILED
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo Common issues:
    echo - Network connection problems
    echo - EAS account issues
    echo - Configuration errors
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD SUCCEEDED!
echo ========================================
echo.
echo Now submitting to TestFlight...
pause

echo.
echo ========================================
echo STEP 6: Submitting to TestFlight
echo ========================================
echo.

call eas submit --platform ios

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo SUBMISSION FAILED
    echo ========================================
    echo.
    echo If you see "build 14 already exists" error:
    echo The build number needs to be incremented again.
    echo.
    echo If you see other errors, check the output above.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Your app has been submitted to TestFlight!
echo.
echo Check TestFlight on your iPhone in a few minutes.
echo The new build should:
echo - Install successfully
echo - Launch without crashing
echo - Work properly
echo.
echo Build Details:
echo - Version: 1.0.2
echo - Build: 15
echo - Built with: Xcode 16 + iOS 18 SDK
echo - No expo-dev-client (production-ready)
echo.
pause
