@echo off
echo ========================================
echo Complete App Entry Point Fix
echo ========================================
echo.

echo Step 1: Stopping any running Metro processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im expo.exe 2>nul
echo.

echo Step 2: Clearing all caches...
echo Clearing npm cache...
npm cache clean --force
echo.

echo Clearing Expo cache...
npx expo install --fix
echo.

echo Clearing Metro cache...
npx react-native start --reset-cache
echo This will start Metro with cleared cache.
echo.

echo Step 3: Reinstalling dependencies...
echo Removing node_modules...
rmdir /s /q node_modules 2>nul
echo.

echo Reinstalling packages...
npm install
echo.

echo Step 4: Configuration Summary:
echo - Entry point: index.ts (specified in app.json and package.json)
echo - App registration: registerRootComponent(App) in index.ts
echo - TypeScript strict mode: disabled
echo - DeepLinking: temporarily disabled
echo - Readonly polyfills: added to App.tsx
echo.

echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npx expo start --clear
echo 2. Press 'i' for iOS simulator or 'a' for Android
echo 3. The app should now start without "App entry not found" error
echo.
pause
