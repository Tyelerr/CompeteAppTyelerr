@echo off
echo ========================================
echo Deploying send-push Edge Function
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Logging in to Supabase...
echo This will open a browser window for authentication.
echo.
npx supabase login
if errorlevel 1 (
    echo ERROR: Login failed!
    pause 
    exit /b 1
)

echo.
echo Step 2: Linking to project...
echo.
npx supabase link --project-ref ofcroxehpuiylonrakrf
if errorlevel 1 (
    echo ERROR: Project linking failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Deploying send-push function...
echo.
npx supabase functions deploy send-push
if errorlevel 1 (
    echo ERROR: Function deployment failed!
    pause
    exit /b 1
)

echo.
echo Step 4: Verifying deployment...
echo.
npx supabase functions list

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
