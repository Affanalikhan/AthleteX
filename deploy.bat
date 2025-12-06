@echo off
echo.
echo ========================================
echo   AthleteX Deployment Script
echo ========================================
echo.

REM Check if netlify-cli is installed
where netlify >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Netlify CLI...
    call npm install -g netlify-cli
)

REM Build the project
echo Building project...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful!
    echo.
    echo Deploying to Netlify...
    call netlify deploy --prod
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo   Deployment Successful!
        echo   Your site is now live!
        echo ========================================
    ) else (
        echo.
        echo Deployment failed. Please check the error messages above.
        exit /b 1
    )
) else (
    echo.
    echo Build failed. Please fix the errors and try again.
    exit /b 1
)

pause
