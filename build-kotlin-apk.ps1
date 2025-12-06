# AthleteX - Build APK with Kotlin Plugins
# This script builds the Android APK with custom Kotlin native plugins

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX Kotlin APK Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Building React app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ React build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ React build complete!" -ForegroundColor Green
Write-Host ""

Write-Host "🔄 Syncing with Capacitor..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Capacitor sync complete!" -ForegroundColor Green
Write-Host ""

Write-Host "🏗️  Building Android APK with Kotlin plugins..." -ForegroundColor Yellow
Write-Host "This may take a minute..." -ForegroundColor Gray
Write-Host ""

cd android
.\gradlew assembleDebug
$buildResult = $LASTEXITCODE
cd ..

if ($buildResult -ne 0) {
    Write-Host ""
    Write-Host "❌ Android build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure Java 17 is installed" -ForegroundColor White
    Write-Host "2. Check Kotlin version in android/build.gradle" -ForegroundColor White
    Write-Host "3. Try: cd android && .\gradlew clean && cd .." -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUILD SUCCESSFUL! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get APK info
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $apk = Get-Item $apkPath
    $sizeMB = [math]::Round($apk.Length / 1MB, 2)
    
    Write-Host "✅ APK Details:" -ForegroundColor Green
    Write-Host "   Location: $apkPath" -ForegroundColor White
    Write-Host "   Size: $sizeMB MB" -ForegroundColor White
    Write-Host "   Created: $($apk.LastWriteTime)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🚀 Kotlin Plugins Included:" -ForegroundColor Cyan
    Write-Host "   ✓ AssessmentPlugin - Fitness assessments" -ForegroundColor White
    Write-Host "   ✓ PerformancePlugin - Motion tracking" -ForegroundColor White
    Write-Host "   ✓ VideoAnalysisPlugin - Pose detection" -ForegroundColor White
    Write-Host "   ✓ BiometricsPlugin - Authentication" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📱 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Install: .\INSTALL_APK_NOW.ps1" -ForegroundColor White
    Write-Host "   2. Read: KOTLIN_PLUGINS_GUIDE.md" -ForegroundColor White
    Write-Host "   3. Test native plugins on your device" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  APK file not found at expected location" -ForegroundColor Yellow
    Write-Host "   Expected: $apkPath" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Happy coding! 🚀" -ForegroundColor Cyan
Write-Host ""
