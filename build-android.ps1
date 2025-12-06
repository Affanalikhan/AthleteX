# AthleteX Android Build Script
# This script builds the Android APK for AthleteX

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX Android Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build React App
Write-Host "[1/4] Building React application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ React build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ React build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Sync with Capacitor
Write-Host "[2/4] Syncing with Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Capacitor sync completed!" -ForegroundColor Green
Write-Host ""

# Step 3: Build APK
Write-Host "[3/4] Building Android APK..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
cd android
.\gradlew assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ APK build failed!" -ForegroundColor Red
    cd ..
    exit 1
}
cd ..
Write-Host "✅ APK build completed!" -ForegroundColor Green
Write-Host ""

# Step 4: Locate APK
Write-Host "[4/4] Locating APK file..." -ForegroundColor Yellow
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "✅ APK created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📱 APK Location: $apkPath" -ForegroundColor White
    Write-Host "📦 APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Transfer APK to your Android device" -ForegroundColor White
    Write-Host "2. Enable 'Install from Unknown Sources' in device settings" -ForegroundColor White
    Write-Host "3. Install the APK" -ForegroundColor White
    Write-Host ""
    Write-Host "Or run: .\install-android.ps1 (if device is connected via USB)" -ForegroundColor Cyan
} else {
    Write-Host "❌ APK file not found at expected location!" -ForegroundColor Red
    exit 1
}
