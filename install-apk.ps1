# Install AthleteX APK on connected Android device

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX APK Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if adb is available
Write-Host "Checking ADB (Android Debug Bridge)..." -ForegroundColor Yellow
try {
    $adbVersion = adb version 2>&1 | Select-String "Android Debug Bridge"
    Write-Host "✓ ADB found: $adbVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ADB not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android SDK Platform Tools:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://developer.android.com/studio/releases/platform-tools" -ForegroundColor White
    Write-Host "  2. Extract and add to PATH" -ForegroundColor White
    Write-Host "  3. Or install Android Studio" -ForegroundColor White
    exit 1
}

# Check for connected devices
Write-Host ""
Write-Host "Checking for connected devices..." -ForegroundColor Yellow
$devices = adb devices | Select-String "device$"

if ($devices.Count -eq 0) {
    Write-Host "✗ No devices connected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Connect your Android device via USB" -ForegroundColor White
    Write-Host "  2. Enable USB Debugging in Developer Options" -ForegroundColor White
    Write-Host "  3. Accept the USB debugging prompt on your device" -ForegroundColor White
    Write-Host ""
    Write-Host "To enable Developer Options:" -ForegroundColor Yellow
    Write-Host "  Settings > About Phone > Tap 'Build Number' 7 times" -ForegroundColor White
    exit 1
}

Write-Host "✓ Device(s) connected:" -ForegroundColor Green
adb devices
Write-Host ""

# Find APK
$debugApk = "android\app\build\outputs\apk\debug\app-debug.apk"
$releaseApk = "android\app\build\outputs\apk\release\app-release.apk"

$apkPath = $null
if (Test-Path $debugApk) {
    $apkPath = $debugApk
    Write-Host "Found debug APK" -ForegroundColor Green
} elseif (Test-Path $releaseApk) {
    $apkPath = $releaseApk
    Write-Host "Found release APK" -ForegroundColor Green
} else {
    Write-Host "✗ No APK found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please build the APK first:" -ForegroundColor Yellow
    Write-Host "  .\build-android-apk.ps1" -ForegroundColor White
    exit 1
}

# Uninstall old version if exists
Write-Host ""
Write-Host "Checking for existing installation..." -ForegroundColor Yellow
$existingApp = adb shell pm list packages | Select-String "com.athletex.app"
if ($existingApp) {
    Write-Host "Uninstalling old version..." -ForegroundColor Yellow
    adb uninstall com.athletex.app
    Write-Host "✓ Old version uninstalled" -ForegroundColor Green
}

# Install APK
Write-Host ""
Write-Host "Installing APK..." -ForegroundColor Yellow
Write-Host "This may take a minute..." -ForegroundColor Gray

adb install -r $apkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ APK Installed Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "The AthleteX app is now installed on your device!" -ForegroundColor Cyan
    Write-Host ""
    
    # Ask if user wants to launch the app
    $launch = Read-Host "Launch the app now? (Y/N)"
    if ($launch -eq "Y" -or $launch -eq "y") {
        Write-Host "Launching AthleteX..." -ForegroundColor Yellow
        adb shell am start -n com.athletex.app/.MainActivity
        Write-Host "✓ App launched!" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "✗ Installation failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. USB debugging not enabled" -ForegroundColor White
    Write-Host "  2. Device not authorized (check device screen)" -ForegroundColor White
    Write-Host "  3. Insufficient storage on device" -ForegroundColor White
    Write-Host "  4. Incompatible Android version (requires 5.1+)" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Installation completed! 🎉" -ForegroundColor Green
