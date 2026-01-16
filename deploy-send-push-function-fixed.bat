@echo off
echo ========================================
echo Deploying send-push Edge Function
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Step 2: Logging in to Supabase...
echo This will open a browser window for authentication.
echo.
npx supabase login
if errorlevel 1 (
    echo ERROR: Login failed!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo Step 3: Linking to project...
echo.
npx supabase link --project-ref ofcroxehpuiylonrakrf
if errorlevel 1 (
    echo ERROR: Project linking failed!
    echo Please verify the project reference is correct.
    pause
    exit /b 1
)

echo.
echo Step 4: Deploying send-push function...
echo.
npx supabase functions deploy send-push
if errorlevel 1 (
    echo ERROR: Function deployment failed!
    echo Please check the function code and try again.
    pause
    exit /b 1
)

echo.
echo Step 5: Verifying deployment...
echo.
npx supabase functions list
if errorlevel 1 (
    echo WARNING: Could not list functions, but deployment may have succeeded.
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo The send-push function should now be available at:
echo https://ofcroxehpuiylonrakrf.supabase.co/functions/v1/send-push
echo.
echo Next steps:
echo 1. Test the function using: node get-user-id-and-test-push.js
echo 2. Check the Supabase dashboard for function logs
echo.
pause
