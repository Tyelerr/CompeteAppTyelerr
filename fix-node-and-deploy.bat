@echo off
echo ========================================
echo    Node.js Setup and TestFlight Deploy
echo ========================================
echo.

echo This script will help you:
echo 1. Check if Node.js is installed
echo 2. Install EAS CLI
echo 3. Deploy to TestFlight
echo.

echo Step 1: Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found in PATH
    echo.
    echo SOLUTION OPTIONS:
    echo.
    echo Option A: Install Node.js directly
    echo   1. Go to https://nodejs.org
    echo   2. Download Node.js 20.x LTS
    echo   3. Install and restart this terminal
    echo   4. Run this script again
    echo.
    echo Option B: Use NVM (if installed)
    echo   1. Run: nvm install 20
    echo   2. Run: nvm use 20
    echo   3. Run this script again
    echo.
    echo Press any key to exit and install Node.js...
    pause >nul
    exit /b 1
) else (
    echo ✅ Node.js found
    node --version
)

echo.
echo Step 2: Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found
    echo Please reinstall Node.js
    pause
    exit /b 1
) else (
    echo ✅ npm found
    npm --version
)

echo.
echo Step 3: Installing/Updating EAS CLI...
npm install -g eas-cli
if errorlevel 1 (
    echo ❌ Failed to install EAS CLI
    echo Try running as administrator
    pause
    exit /b 1
)

echo.
echo Step 4: Verifying EAS CLI...
eas --version
if errorlevel 1 (
    echo ❌ EAS CLI not working
    echo Please restart your terminal and try again
    pause
    exit /b 1
)

echo.
echo Step 5: Checking EAS login...
eas whoami
if errorlevel 1 (
    echo ❌ Not logged in to EAS
    echo Please run: eas login
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Ready for TestFlight Deployment!
echo ========================================
echo.
echo Your setup is complete. Now you can:
echo.
echo 1. Build for iOS: eas build --platform ios --profile production
echo 2. Submit to TestFlight: eas submit --platform ios
echo.
echo Or run the automated script: deploy-testflight.bat
echo.
pause
