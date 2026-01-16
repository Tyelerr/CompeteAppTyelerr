@echo off
echo ========================================
echo Clearing Metro Bundler Cache for Build 131
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Stopping any running Metro processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Clearing Metro bundler cache...
call npx react-native start --reset-cache
if errorlevel 1 (
    echo Failed to clear cache with react-native, trying expo...
    call npx expo start -c
)

echo.
echo ========================================
echo Cache cleared! Metro bundler starting...
echo ========================================
echo.
echo The app should reload with Build 131 fixes.
echo If the issue persists, try:
echo 1. Close the app completely on your device
echo 2. Reopen the app
echo 3. Navigate to Bar Owner Dashboard
echo ========================================
pause
