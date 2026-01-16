@echo off
echo ========================================
echo Supabase Edge Function Deployment
echo ========================================
echo.

REM Check if Supabase CLI is already installed
where supabase >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Supabase CLI is already installed!
    supabase --version
    echo.
    goto :deploy
)

echo Supabase CLI is not installed.
echo.
echo ========================================
echo Installation Options:
echo ========================================
echo.
echo Option 1: Install via Scoop (Recommended for Windows)
echo   1. Install Scoop: https://scoop.sh/
echo   2. Run: scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
echo   3. Run: scoop install supabase
echo.
echo Option 2: Install via npm (in project directory)
echo   Run: npm install supabase --save-dev
echo   Then use: npx supabase [command]
echo.
echo Option 3: Download standalone binary
echo   Visit: https://github.com/supabase/cli/releases
echo   Download supabase_windows_amd64.zip
echo   Extract and add to PATH
echo.
echo ========================================
echo.
echo Would you like to try installing via npm in this project? (Y/N)
set /p install_npm="Enter choice: "

if /i "%install_npm%"=="Y" (
    echo.
    echo Installing Supabase CLI locally via npm...
    npm install supabase --save-dev
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install Supabase CLI
        echo Please try one of the other installation methods above
        pause
        exit /b 1
    )
    
    echo.
    echo Supabase CLI installed locally!
    echo You can now use: npx supabase [command]
    echo.
    set SUPABASE_CMD=npx supabase
) else (
    echo.
    echo Please install Supabase CLI using one of the methods above
    echo Then run this script again
    pause
    exit /b 1
)

:deploy
if not defined SUPABASE_CMD (
    set SUPABASE_CMD=supabase
)

echo.
echo ========================================
echo Ready to Deploy!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Login to Supabase:
echo    %SUPABASE_CMD% login
echo.
echo 2. Link your project (get project ref from Supabase dashboard):
echo    %SUPABASE_CMD% link --project-ref YOUR_PROJECT_REF
echo.
echo 3. Deploy the Edge Function:
echo    %SUPABASE_CMD% functions deploy update-user-email
echo.
echo 4. Set the service role key (get from Supabase dashboard):
echo    %SUPABASE_CMD% secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
echo.
echo ========================================
echo.
echo Would you like to continue with login now? (Y/N)
set /p continue="Enter choice: "

if /i "%continue%"=="Y" (
    echo.
    echo Opening browser for Supabase login...
    %SUPABASE_CMD% login
    
    echo.
    echo Please enter your Supabase project reference ID
    echo (Find this in: Supabase Dashboard ^> Settings ^> General ^> Reference ID)
    set /p project_ref="Project Ref: "
    
    if not "%project_ref%"=="" (
        echo.
        echo Linking project...
        %SUPABASE_CMD% link --project-ref %project_ref%
        
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo Project linked successfully!
            echo.
            echo Deploying Edge Function...
            %SUPABASE_CMD% functions deploy update-user-email
            
            if %ERRORLEVEL% EQU 0 (
                echo.
                echo ========================================
                echo Edge Function deployed successfully!
                echo ========================================
                echo.
                echo IMPORTANT: Now set your service role key
                echo.
                echo Get your service role key from:
                echo Supabase Dashboard ^> Settings ^> API ^> service_role key
                echo.
                echo Then run:
                echo %SUPABASE_CMD% secrets set SUPABASE_SERVICE_ROLE_KEY=your_key_here
                echo.
            ) else (
                echo.
                echo ERROR: Failed to deploy Edge Function
                echo Check the error messages above
            )
        ) else (
            echo.
            echo ERROR: Failed to link project
            echo Make sure the project ref is correct
        )
    )
)

echo.
echo ========================================
echo Deployment script complete
echo ========================================
echo.
echo See SECURE_EMAIL_UPDATE_IMPLEMENTATION_COMPLETE.md for full instructions
echo.
pause
