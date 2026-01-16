@echo off
echo Installing expo-font dependency...
cd /d "%~dp0"
call npx expo install expo-font
echo.
echo expo-font has been installed!
echo.
echo Now rebuild your app with:
echo   eas build --platform ios --profile production
echo.
pause
