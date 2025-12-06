# AthleteX Android APK Build Script
# This script automates the process of building an Android APK

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX Android APK Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if Java is installed
Write-Host "Checking Java installation..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✓ Java is installed: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Java JDK is not installed!" -ForegroundColor Red
    Write-Host "Please install JDK 17 from https://adoptium.net/" -ForegroundColor Red
    exit 1
}

# Step 1: Install dependencies
Write-Host ""
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 2: Install Capacitor if not already installed
Write-Host ""
Write-Host "Step 2: Installing Capacitor..." -ForegroundColor Yellow
npm install @capacitor/core @capacitor/cli @capacitor/android --save

# Step 3: Check if capacitor.config.json exists
if (-not (Test-Path "capacitor.config.json")) {
    Write-Host ""
    Write-Host "Step 3: Initializing Capacitor..." -ForegroundColor Yellow
    npx cap init "AthleteX" "com.athletex.app" --web-dir=dist
} else {
    Write-Host ""
    Write-Host "Step 3: Capacitor already initialized" -ForegroundColor Green
}

# Step 4: Build the web app
Write-Host ""
Write-Host "Step 4: Building web application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Web app built successfully" -ForegroundColor Green

# Step 5: Add Android platform if not exists
if (-not (Test-Path "android")) {
    Write-Host ""
    Write-Host "Step 5: Adding Android platform..." -ForegroundColor Yellow
    npx cap add android
} else {
    Write-Host ""
    Write-Host "Step 5: Android platform already exists" -ForegroundColor Green
}

# Step 6: Sync web assets to Android
Write-Host ""
Write-Host "Step 6: Syncing web assets to Android..." -ForegroundColor Yellow
npx cap sync android

# Step 7: Copy web assets
Write-Host ""
Write-Host "Step 7: Copying web assets..." -ForegroundColor Yellow
npx cap copy android

# Step 8: Update Android project
Write-Host ""
Write-Host "Step 8: Updating Android project..." -ForegroundColor Yellow
npx cap update android

# Step 9: Build APK
Write-Host ""
Write-Host "Step 9: Building Android APK..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

Set-Location android

# Build debug APK
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ APK build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Check if APK was created
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ APK Built Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK Location:" -ForegroundColor Cyan
    Write-Host "  $apkPath" -ForegroundColor White
    Write-Host ""
    
    # Get APK size
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Install on device: adb install $apkPath" -ForegroundColor White
    Write-Host "  2. Or run: .\install-apk.ps1" -ForegroundColor White
    Write-Host "  3. For release build, see BUILD_ANDROID_APK.md" -ForegroundColor White
    Write-Host ""
    
    # Ask if user wants to open the folder
    $openFolder = Read-Host "Open APK folder? (Y/N)"
    if ($openFolder -eq "Y" -or $openFolder -eq "y") {
        explorer.exe "android\app\build\outputs\apk\debug"
    }
} else {
    Write-Host "✗ APK file not found!" -ForegroundColor Red
    Write-Host "Check the build logs above for errors" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build completed successfully! 🎉" -ForegroundColor Green
