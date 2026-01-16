@echo off
echo ========================================
echo  CLEANING UP OLD FILTER MODAL FILES
echo  BUILD 161 - Removing Unused Files
echo ========================================
echo.

cd /d "%~dp0"

echo Deleting old filter modal files...
echo.

if exist "screens\Billiard\ScreenBilliardModalFilters_Fixed.tsx" (
    del "screens\Billiard\ScreenBilliardModalFilters_Fixed.tsx"
    echo ✓ Deleted ScreenBilliardModalFilters_Fixed.tsx
)

if exist "screens\Billiard\ScreenBilliardModalFilters_AbsoluteFixed.tsx" (
    del "screens\Billiard\ScreenBilliardModalFilters_AbsoluteFixed.tsx"
    echo ✓ Deleted ScreenBilliardModalFilters_AbsoluteFixed.tsx
)

if exist "screens\Billiard\ScreenBilliardModalFilters_StyledFixed.tsx" (
    del "screens\Billiard\ScreenBilliardModalFilters_StyledFixed.tsx"
    echo ✓ Deleted ScreenBilliardModalFilters_StyledFixed.tsx
)

if exist "screens\Billiard\ScreenBilliardModalFilters_FinalFix.tsx" (
    del "screens\Billiard\ScreenBilliardModalFilters_FinalFix.tsx"
    echo ✓ Deleted ScreenBilliardModalFilters_FinalFix.tsx
)

if exist "screens\Billiard\ScreenBilliardModalFilters_Perfect.tsx" (
    del "screens\Billiard\ScreenBilliardModalFilters_Perfect.tsx"
    echo ✓ Deleted ScreenBilliardModalFilters_Perfect.tsx
)

if exist "screens\Billiard\ScreenBilliardModalFilters_WorkingFix.tsx" (
    del "screens\Billiard\ScreenBilliardModalFilters_WorkingFix.tsx"
    echo ✓ Deleted ScreenBilliardModalFilters_WorkingFix.tsx
)

if exist "screens\Billiard\ScreenBilliardModalFilters_Final.tsx" (
    del "screens\Billiard\ScreenBilliardModalFilters_Final.tsx"
    echo ✓ Deleted ScreenBilliardModalFilters_Final.tsx
)

if exist "screens\Billiard\ScreenBilliardHomeFixed.tsx" (
    del "screens\Billiard\ScreenBilliardHomeFixed.tsx"
    echo ✓ Deleted ScreenBilliardHomeFixed.tsx
)

echo.
echo ========================================
echo  CLEANUP COMPLETE
echo  Keeping only:
echo  - ScreenBilliardModalFilters.tsx (original)
echo  - ScreenBilliardModalFilters_BUILD161.tsx (new working version)
echo  - ScreenBilliardHome.tsx (updated to use BUILD161)
echo ========================================
echo.

pause
