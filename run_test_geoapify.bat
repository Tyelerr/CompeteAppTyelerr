@echo off
echo Testing Geoapify Integration...
echo.
cd /d "%~dp0"
node test_geoapify_integration.js
echo.
echo Test completed. Press any key to exit...
pause >nul
