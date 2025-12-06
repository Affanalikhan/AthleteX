# AthleteX - Quick APK Installer
# Run this script to install the app on your connected Android device

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX APK Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if APK exists
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "❌ APK not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "The APK should be at: $apkPath" -ForegroundColor Yellow
    Write-Host "Please build the app first by running: .\build-android.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Show APK info
$apk = Get-Item $apkPath
$sizeMB = [math]::Round($apk.Length / 1MB, 2)
Write-Host "✅ APK Found!" -ForegroundColor Green
Write-Host "   Location: $apkPath" -ForegroundColor White
Write-Host "   Size: $sizeMB MB" -ForegroundColor White
Write-Host "   Created: $($apk.LastWriteTime)" -ForegroundColor White
Write-Host ""

# Check for ADB
Write-Host "Checking for ADB (Android Debug Bridge)..." -ForegroundColor Yellow
try {
    $adbVersion = adb version 2>&1 | Select-Object -First 1
    Write-Host "✅ ADB found: $adbVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ADB not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android SDK Platform Tools:" -ForegroundColor Yellow
    Write-Host "https://developer.android.com/studio/releases/platform-tools" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use manual installation:" -ForegroundColor Yellow
    Write-Host "1. Copy APK to your phone" -ForegroundColor White
    Write-Host "2. Open the APK file on your phone" -ForegroundColor White
    Write-Host "3. Allow installation from unknown sources" -ForegroundColor White
    Write-Host "4. Install and enjoy!" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# Check for connected devices
Write-Host "Checking for connected Android devices..." -ForegroundColor Yellow
$devicesOutput = adb devices
$devices = $devicesOutput | Select-String "device$"

if ($devices.Count -eq 0) {
    Write-Host "❌ No Android device connected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Connect your Android device via USB" -ForegroundColor White
    Write-Host "2. Enable USB Debugging in Developer Options" -ForegroundColor White
    Write-Host "   (Settings > About Phone > Tap 'Build Number' 7 times)" -ForegroundColor Gray
    Write-Host "   (Settings > Developer Options > Enable 'USB Debugging')" -ForegroundColor Gray
    Write-Host "3. Accept the USB debugging prompt on your device" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use manual installation:" -ForegroundColor Yellow
    Write-Host "- Copy $apkPath to your phone" -ForegroundColor White
    Write-Host "- Open it and install" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Device connected!" -ForegroundColor Green
Write-Host ""

# Install APK
Write-Host "Installing AthleteX on your device..." -ForegroundColor Yellow
Write-Host "This may take a few seconds..." -ForegroundColor Gray
Write-Host ""

adb install -r $apkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  INSTALLATION SUCCESSFUL! 🎉" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ AthleteX has been installed on your device!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 You can now:" -ForegroundColor Yellow
    Write-Host "   1. Open the app from your device's app drawer" -ForegroundColor White
    Write-Host "   2. Look for the 'AthleteX' icon" -ForegroundColor White
    Write-Host "   3. Start using the app!" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Test Accounts:" -ForegroundColor Yellow
    Write-Host "   Athlete: athlete@test.com / test123" -ForegroundColor White
    Write-Host "   Trainer: trainer@test.com / test123" -ForegroundColor White
    Write-Host ""
    Write-Host "Enjoy your app! 🚀" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure USB debugging is enabled" -ForegroundColor White
    Write-Host "2. Check if you have enough storage space" -ForegroundColor White
    Write-Host "3. Try uninstalling the old version first:" -ForegroundColor White
    Write-Host "   adb uninstall com.athletex.app" -ForegroundColor Gray
    Write-Host "4. Then run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install manually:" -ForegroundColor Yellow
    Write-Host "- Copy $apkPath to your phone" -ForegroundColor White
    Write-Host "- Open it and install" -ForegroundColor White
    Write-Host ""
}
