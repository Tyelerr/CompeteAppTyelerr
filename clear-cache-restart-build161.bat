@echo off
echo ========================================
echo  CLEARING CACHE FOR BUILD 161
echo  Tournament Filters Fix
echo ========================================
echo.

echo Step 1: Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Clearing npm cache...
call npm cache clean --force

echo.
echo Step 3: Removing node_modules...
if exist node_modules (
    echo Removing node_modules directory...
    rmdir /s /q node_modules
)

echo.
echo Step 4: Removing package-lock.json...
if exist package-lock.json (
    del package-lock.json
)

echo.
echo Step 5: Clearing Expo cache...
if exist .expo (
    rmdir /s /q .expo
)

echo.
echo Step 6: Clearing Metro cache...
if exist %TEMP%\metro-* (
    rmdir /s /q %TEMP%\metro-*
)
if exist %TEMP%\react-* (
    rmdir /s /q %TEMP%\react-*
)

echo.
echo Step 7: Clearing Watchman cache...
call watchman watch-del-all 2>nul

echo.
echo Step 8: Reinstalling dependencies...
call npm install

echo.
echo Step 9: Starting Expo with cache cleared...
echo.
echo ========================================
echo  CACHE CLEARED - STARTING EXPO
echo  BUILD 161 - Tournament Filters Fix
echo ========================================
echo.

call npx expo start --clear

pause
