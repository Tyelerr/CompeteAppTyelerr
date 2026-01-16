@echo off
echo Clearing Metro cache and restarting app...
echo.

echo Step 1: Clearing Metro cache...
npx expo start --clear

echo.
echo If the above doesn't work, try these manual steps:
echo 1. Stop the current Metro bundler (Ctrl+C)
echo 2. Delete node_modules folder
echo 3. Run: npm install
echo 4. Run: npx expo start --clear
echo.
pause
