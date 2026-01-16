@echo off
echo.
echo ========================================
echo   Fix Dependencies and Build for TestFlight
echo ========================================
echo.

REM Navigate to CompeteApp directory
cd /d "%~dp0"

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found! Make sure you're in the CompeteApp directory.
    pause
    exit /b 1
)

echo ✅ Found package.json - we're in the right directory
echo.

echo Step 1: Backing up current package-lock.json...
if exist "package-lock.json" (
    copy "package-lock.json" "package-lock.json.backup" >nul
    echo ✅ Backup created: package-lock.json.backup
) else (
    echo ℹ️ No existing package-lock.json found
)

echo.
echo Step 2: Removing conflicting lock file...
if exist "package-lock.json" (
    del "package-lock.json"
    echo ✅ Removed outdated package-lock.json
)

echo.
echo Step 3: Clearing npm cache...
npm cache clean --force
if %errorlevel% neq 0 (
    echo ⚠️ Cache clean failed, continuing anyway...
)

echo.
echo Step 4: Installing dependencies with legacy peer deps...
npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ npm install failed
    echo.
    echo Trying alternative approach...
    npm install --force
    if %errorlevel% neq 0 (
        echo ❌ Both install methods failed
        echo.
        echo Please check the error messages above and try:
        echo 1. npm install --legacy-peer-deps
        echo 2. npm install --force
        echo 3. Or manually resolve dependency conflicts
        pause
        exit /b 1
    )
)

echo ✅ Dependencies installed successfully
echo.

echo Step 5: Verifying installation...
npm list --depth=0 >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Some dependency warnings exist, but continuing...
) else (
    echo ✅ All dependencies verified
)

echo.
echo Step 6: Checking EAS CLI...
eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ EAS CLI not found. Installing...
    npm install -g @expo/eas-cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install EAS CLI
        pause
        exit /b 1
    )
    echo ✅ EAS CLI installed successfully
) else (
    echo ✅ EAS CLI is available
)

echo.
echo Step 7: Building for TestFlight...
echo This will create a production build with:
echo - Xcode 16 + iOS 18 SDK
echo - Fixed dependencies
echo - Legacy peer deps support
echo.
echo Press any key to start the build...
pause >nul

eas build --platform ios --profile production --non-interactive
if %errorlevel% neq 0 (
    echo ❌ Build failed
    echo.
    echo Check the error messages above for details.
    echo You can also check build logs at: https://expo.dev/accounts/tyelerr/projects/compete/builds
    pause
    exit /b 1
)

echo.
echo ✅ Build completed successfully!
echo.

echo Step 8: Submitting to TestFlight...
echo Press any key to submit to App Store Connect...
pause >nul

eas submit --platform ios --non-interactive
if %errorlevel% neq 0 (
    echo ❌ Submission failed
    echo.
    echo You can try submitting manually with: eas submit --platform ios
    pause
    exit /b 1
)

echo.
echo ========================================
echo   🎉 SUCCESS! 
echo ========================================
echo.
echo Your app has been successfully:
echo ✅ Built with Xcode 16 + iOS 18 SDK
echo ✅ Dependencies resolved and fixed
echo ✅ Uploaded to App Store Connect
echo.
echo Next steps:
echo 1. Wait 1-2 hours for Apple to process your build
echo 2. Check App Store Connect: https://appstoreconnect.apple.com
echo 3. Your build will appear in TestFlight automatically
echo 4. Testers will be notified via email
echo.
echo Monitor progress:
echo - Build status: eas build:list
echo - Submission status: eas submit:list
echo.
pause
