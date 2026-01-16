@echo off
echo ========================================
echo Reinstall Dependencies
echo ========================================
echo.

cd /d "%~dp0"

echo Reinstalling with --legacy-peer-deps...
call npm install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Dependencies Installed Successfully!
echo ========================================
echo.
echo You can now build with:
echo   eas build --platform ios --profile production
echo.
pause
