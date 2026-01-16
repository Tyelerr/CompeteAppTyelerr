@echo off
echo ========================================
echo React Native Version Mismatch Fix
echo ========================================
echo.
echo This script will:
echo 1. Clear all caches (Metro, Watchman, npm)
echo 2. Reinstall dependencies
echo 3. Rebuild the native app
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Clearing Watchman cache...
call watchman watch-del-all 2>nul
if %errorlevel% neq 0 (
    echo Watchman not found or already cleared
)

echo.
echo Step 3: Clearing Metro cache...
if exist "%LOCALAPPDATA%\Temp\metro-*" (
    rd /s /q "%LOCALAPPDATA%\Temp\metro-*"
)
if exist "%LOCALAPPDATA%\Temp\haste-map-*" (
    rd /s /q "%LOCALAPPDATA%\Temp\haste-map-*"
)

echo.
echo Step 4: Clearing React Native cache...
if exist "%LOCALAPPDATA%\Temp\react-native-*" (
    rd /s /q "%LOCALAPPDATA%\Temp\react-native-*"
)
if exist "%LOCALAPPDATA%\Temp\react-*" (
    rd /s /q "%LOCALAPPDATA%\Temp\react-*"
)

echo.
echo Step 5: Removing node_modules...
if exist node_modules (
    rd /s /q node_modules
)

echo.
echo Step 6: Removing package-lock.json...
if exist package-lock.json (
    del /f /q package-lock.json
)

echo.
echo Step 7: Clearing npm cache...
call npm cache clean --force

echo.
echo Step 8: Reinstalling dependencies...
call npm install

echo.
echo Step 9: Clearing Expo cache...
call npx expo start --clear

echo.
echo ========================================
echo Cache clearing complete!
echo ========================================
echo.
echo IMPORTANT: You must now rebuild the app on your device:
echo.
echo For iOS:
echo   1. Delete the Compete app from your iPhone
echo   2. Run: npx expo run:ios
echo   OR
echo   2. Build with EAS: eas build --platform ios --profile development
echo.
echo For Android:
echo   1. Delete the Compete app from your Android device
echo   2. Run: npx expo run:android
echo   OR
echo   2. Build with EAS: eas build --platform android --profile development
echo.
echo The version mismatch occurs because the native code on your
echo device is different from the JavaScript bundle. Rebuilding
echo the app will sync both versions.
echo.
pause
