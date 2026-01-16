@echo off
echo ========================================
echo Deploying send-push Edge Function
echo with Broadcast Support
echo ========================================
echo.

cd /d "%~dp0"

echo Checking if Supabase CLI is installed...
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Supabase CLI is not installed!
    echo.
    echo Please install it first:
    echo npm install -g supabase
    echo.
    pause
    exit /b 1
)

echo.
echo Supabase CLI found!
echo.
echo Deploying send-push function to project: ofcroxehpuiylonrakrf
echo.

supabase functions deploy send-push --project-ref ofcroxehpuiylonrakrf

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Deployment Successful!
    echo ========================================
    echo.
    echo The send-push function is now live with:
    echo   ✅ Deno-style imports
    echo   ✅ Broadcast support
    echo   ✅ Targeted push notifications
    echo   ✅ Automatic token hygiene
    echo.
    echo Function URL:
    echo https://ofcroxehpuiylonrakrf.supabase.co/functions/v1/send-push
    echo.
    echo Next steps:
    echo 1. Test broadcast: node test-broadcast-push.js
    echo 2. Test targeted: node test-send-push.js
    echo 3. Check logs in Supabase Dashboard
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Deployment Failed!
    echo ========================================
    echo.
    echo Please check the error message above.
    echo.
    echo Common issues:
    echo 1. Not logged in: Run 'supabase login'
    echo 2. Wrong project ref
    echo 3. Network issues
    echo.
)

pause
