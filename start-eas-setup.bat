@echo off
echo ========================================
echo EAS Build Setup for TestFlight
echo ========================================
echo.
echo This script will guide you through the EAS setup process.
echo.
echo PREREQUISITES:
echo 1. Expo account (FREE) - Sign up at https://expo.dev
echo 2. Apple Developer account ($99/year)
echo.
echo ========================================
echo Step 1: Login to EAS
echo ========================================
echo.
echo Please run: eas login
echo Enter your Expo account credentials when prompted.
echo.
pause
echo.
echo ========================================
echo Step 2: Configure Project
echo ========================================
echo.
echo Please run: eas build:configure
echo This will generate a unique project ID and update your app.json
echo.
pause
echo.
echo ========================================
echo Step 3: Set Up Apple Credentials
echo ========================================
echo.
echo Please run: eas credentials
echo Choose iOS > Production and follow prompts
echo.
pause
echo.
echo ========================================
echo Step 4: Build for TestFlight
echo ========================================
echo.
echo Please run: eas build --platform ios --profile production
echo This will create your iOS build for TestFlight
echo.
pause
echo.
echo ========================================
echo Step 5: Submit to TestFlight
echo ========================================
echo.
echo Please run: eas submit --platform ios
echo This will submit your app to TestFlight
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo For detailed instructions, see EAS_SETUP_GUIDE.md
echo.
pause
