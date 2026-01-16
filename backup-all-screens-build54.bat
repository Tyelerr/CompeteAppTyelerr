@echo off
echo Creating backups of all screen files for Build 54...
echo.

xcopy /S /I /Y "CompeteApp\screens\*.tsx" "CompeteApp\screens_BACKUP_BUILD54\"

echo.
echo Backup complete! All screen files backed up to CompeteApp\screens_BACKUP_BUILD54\
echo.
pause
