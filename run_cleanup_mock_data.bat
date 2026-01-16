@echo off
echo.
echo ========================================
echo   Mock Tournament Data Cleanup Script
echo ========================================
echo.
echo This script will remove all mock tournaments from the database.
echo Make sure you have updated the Supabase credentials in run_cleanup_mock_data.js
echo.
pause
echo.
echo Running cleanup script...
node run_cleanup_mock_data.js
echo.
echo Cleanup completed!
pause
