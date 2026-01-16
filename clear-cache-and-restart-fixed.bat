@echo off
echo Clearing Metro cache and restarting...
cd /d "%~dp0"
npx expo start --clear --tunnel
pause
