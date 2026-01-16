@echo off
echo ========================================
echo    Node 20 and Expo 51 Upgrade Script
echo ========================================
echo.

echo Step 1: Clean install with new dependencies...
echo Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Step 2: Installing updated dependencies...
npm install

echo.
echo Step 3: Installing Expo CLI and updating...
npm install -g @expo/cli@latest
npx expo install --fix

echo.
echo Step 4: Checking for any peer dependency issues...
npm audit fix

echo.
echo ========================================
echo    Upgrade Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Test the app locally: npm start
echo 2. Try building again: eas build --platform ios --profile production
echo.
pause
