# AthleteX Android Setup Script
# This script automates the Android app setup process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX Android App Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Installing Capacitor dependencies..." -ForegroundColor Yellow
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera @capacitor/geolocation @capacitor/network @capacitor/device @capacitor/app @capacitor/splash-screen @capacitor/status-bar

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install Capacitor dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Capacitor dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Building web application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to build web application" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Web application built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Adding Android platform..." -ForegroundColor Yellow

# Check if android folder already exists
if (Test-Path "android") {
    Write-Host "Android platform already exists. Syncing..." -ForegroundColor Yellow
    npx cap sync android
} else {
    Write-Host "Adding Android platform for the first time..." -ForegroundColor Yellow
    npx cap add android
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to add/sync Android platform" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Android platform ready" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Install Android Studio from https://developer.android.com/studio" -ForegroundColor White
Write-Host "2. Open the Android project:" -ForegroundColor White
Write-Host "   npx cap open android" -ForegroundColor Cyan
Write-Host "3. Build and run the app in Android Studio" -ForegroundColor White
Write-Host ""
Write-Host "Quick commands:" -ForegroundColor Yellow
Write-Host "  Build & sync:  npm run build && npx cap sync android" -ForegroundColor Cyan
Write-Host "  Open Android:  npx cap open android" -ForegroundColor Cyan
Write-Host "  Run on device: npx cap run android" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed instructions, see ANDROID_APP_SETUP.md" -ForegroundColor Yellow
Write-Host ""
