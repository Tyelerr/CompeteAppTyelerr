@echo off
echo ========================================
echo    NVM + Node 20 + Expo 51 Upgrade
echo ========================================
echo.

echo Step 1: Check if NVM is installed...
nvm version >nul 2>&1
if errorlevel 1 (
    echo ❌ NVM not found. Please install NVM for Windows first:
    echo    https://github.com/coreybutler/nvm-windows/releases
    echo.
    echo Or install via Chocolatey: choco install nvm
    echo Or install via Scoop: scoop install nvm
    echo.
    pause
    exit /b 1
) else (
    echo ✅ NVM is installed
    nvm version
)

echo.
echo Step 2: Install and switch to Node 20...
nvm install 20.18.0
nvm use 20.18.0

echo.
echo Step 3: Verify Node version...
node --version
npm --version

echo.
echo Step 4: Clean install with new dependencies...
echo Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Step 5: Installing updated dependencies...
npm install

echo.
echo Step 6: Installing latest Expo CLI...
npm install -g @expo/cli@latest

echo.
echo Step 7: Fixing Expo dependencies...
npx expo install --fix

echo.
echo Step 8: Checking for peer dependency issues...
npm audit fix

echo.
echo ========================================
echo    Upgrade Complete!
echo ========================================
echo.
echo Current Node version:
node --version
echo.
echo Next steps:
echo 1. Test the app locally: npm start
echo 2. Try building again: eas build --platform ios --profile production
echo 3. If issues, switch to Node 18: nvm use 18.19.0
echo.
echo NVM Commands for future use:
echo - Switch to Node 20: nvm use 20.18.0
echo - Switch to Node 18: nvm use 18.19.0
echo - List versions: nvm list
echo - Use .nvmrc file: nvm use
echo.
pause
