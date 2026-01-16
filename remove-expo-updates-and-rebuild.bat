@echo off
echo ========================================
echo Remove expo-updates and Rebuild
echo ========================================
echo.
echo This will:
echo 1. Remove expo-updates from package.json
echo 2. Delete node_modules
echo 3. Reinstall dependencies
echo 4. Build without expo-updates
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Uninstalling expo-updates...
call npm uninstall expo-updates

echo.
echo Step 2: Removing node_modules...
rd /s /q node_modules

echo.
echo Step 3: Removing package-lock.json...
del /f /q package-lock.json

echo.
echo Step 4: Reinstalling dependencies...
call npm install

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Now you can build with:
echo   eas build --platform ios --profile production
echo.
echo The build will work without expo-updates.
echo.
pause
