@echo off
echo ========================================
echo Setup EAS Secrets for Production Build
echo ========================================
echo.
echo This script will configure your Supabase credentials as EAS Secrets
echo so they are available in production builds.
echo.
echo Your .env file contains:
echo   EXPO_PUBLIC_SUPABASE_URL
echo   EXPO_PUBLIC_SUPABASE_ANON_KEY
echo   EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
echo   EXPO_PUBLIC_RESEND_KEY
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Setting EXPO_PUBLIC_SUPABASE_URL...
call eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://ofcroxehpuiylonrakrf.supabase.co" --type string

echo.
echo Step 2: Setting EXPO_PUBLIC_SUPABASE_ANON_KEY...
call eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mY3JveGVocHVpeWxvbnJha3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTQwNzIsImV4cCI6MjA2NTg3MDA3Mn0.vyTCOpEc0ihWul2SK738frQTt9NO4RSWYP27g8gfAWk" --type string

echo.
echo Step 3: Setting EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY...
call eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mY3JveGVocHVpeWxvbnJha3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI5NDA3MiwiZXhwIjoyMDY1ODcwMDcyfQ.NbJFzWBhDgNX_eHss4-8VK-fXlPSHwPamCJGvqbwN9o" --type string

echo.
echo Step 4: Setting EXPO_PUBLIC_RESEND_KEY...
call eas secret:create --scope project --name EXPO_PUBLIC_RESEND_KEY --value "re_LK2Kp5cH_6sHDJiqgKM6HDYEPWfYKxDhJ" --type string

echo.
echo ========================================
echo Secrets Created!
echo ========================================
echo.
echo To verify the secrets were created:
echo   eas secret:list
echo.
echo Now you can build with:
echo   eas build --platform ios --profile production
echo.
echo The secrets will be automatically injected as environment variables
echo during the build process.
echo.
pause
