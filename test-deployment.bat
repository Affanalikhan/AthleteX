@echo off
echo ========================================
echo AthleteX Deployment Test Script
echo ========================================
echo.

echo [1/5] Checking if build folder exists...
if exist "build" (
    echo ✓ Build folder exists
) else (
    echo ✗ Build folder not found
    echo Running build command...
    call npm run build
)
echo.

echo [2/5] Checking build contents...
if exist "build\index.html" (
    echo ✓ index.html found
) else (
    echo ✗ index.html not found - build may have failed
)

if exist "build\static\js" (
    echo ✓ JavaScript files found
) else (
    echo ✗ JavaScript files not found
)

if exist "build\_redirects" (
    echo ✓ _redirects file found (SPA routing configured)
) else (
    echo ⚠ _redirects file not found - may cause routing issues
)
echo.

echo [3/5] Checking configuration files...
if exist "netlify.toml" (
    echo ✓ netlify.toml found
) else (
    echo ✗ netlify.toml not found
)

if exist "public\_redirects" (
    echo ✓ public\_redirects found
) else (
    echo ⚠ public\_redirects not found
)
echo.

echo [4/5] Build folder size:
dir build /s | find "File(s)"
echo.

echo [5/5] Testing local server...
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Install serve if you haven't already:
echo    npm install -g serve
echo.
echo 2. Start local server:
echo    npx serve -s build
echo.
echo 3. Test these URLs in your browser:
echo    - http://localhost:3000/
echo    - http://localhost:3000/trainer/login
echo    - http://localhost:3000/sai-login
echo.
echo 4. If they work locally but not on Netlify:
echo    - Clear Netlify cache
echo    - Redeploy
echo    - Check Netlify build logs
echo.
echo 5. Open test-routes.html in your browser
echo    to test all routes systematically
echo.
echo ========================================
echo.

pause
