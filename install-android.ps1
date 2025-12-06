# AthleteX Android Install Script
# This script installs the APK on a connected Android device

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX Android Install Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if APK exists
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "❌ APK not found! Please build the app first." -ForegroundColor Red
    Write-Host "Run: .\build-android.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if adb is available
Write-Host "Checking for ADB (Android Debug Bridge)..." -ForegroundColor Yellow
$adbPath = "android\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    # Try system adb
    try {
        adb version | Out-Null
        $adbPath = "adb"
    } catch {
        Write-Host "❌ ADB not found!" -ForegroundColor Red
        Write-Host "Please install Android SDK Platform Tools" -ForegroundColor Yellow
        exit 1
    }
}
Write-Host "✅ ADB found!" -ForegroundColor Green
Write-Host ""

# Check for connected devices
Write-Host "Checking for connected devices..." -ForegroundColor Yellow
$devices = & $adbPath devices
if ($devices -match "device$") {
    Write-Host "✅ Device connected!" -ForegroundColor Green
    Write-Host ""
    
    # Install APK
    Write-Host "Installing AthleteX APK..." -ForegroundColor Yellow
    & $adbPath install -r $apkPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  INSTALLATION SUCCESSFUL!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✅ AthleteX has been installed on your device!" -ForegroundColor Green
        Write-Host "📱 You can now open the app from your device" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Installation failed!" -ForegroundColor Red
        Write-Host "Make sure USB debugging is enabled on your device" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ No device connected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Connect your Android device via USB" -ForegroundColor White
    Write-Host "2. Enable USB Debugging in Developer Options" -ForegroundColor White
    Write-Host "3. Accept the USB debugging prompt on your device" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
}
