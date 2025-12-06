# Build Release APK for Google Play Store

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX Release APK Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if keystore exists
$keystorePath = "athletex-release-key.keystore"

if (-not (Test-Path $keystorePath)) {
    Write-Host "Keystore not found. Creating new keystore..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please provide the following information:" -ForegroundColor Cyan
    Write-Host ""
    
    $storePassword = Read-Host "Enter keystore password" -AsSecureString
    $keyPassword = Read-Host "Enter key password" -AsSecureString
    
    # Convert secure strings to plain text for keytool
    $storePass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassword))
    $keyPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))
    
    Write-Host ""
    Write-Host "Generating keystore..." -ForegroundColor Yellow
    
    keytool -genkey -v -keystore $keystorePath -alias athletex -keyalg RSA -keysize 2048 -validity 10000 -storepass $storePass -keypass $keyPass
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Keystore generation failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Keystore created successfully" -ForegroundColor Green
    
    # Create key.properties file
    $keyProperties = @"
storePassword=$storePass
keyPassword=$keyPass
keyAlias=athletex
storeFile=../$keystorePath
"@
    
    New-Item -Path "android" -Name "key.properties" -ItemType File -Value $keyProperties -Force | Out-Null
    Write-Host "✓ key.properties created" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "IMPORTANT: Keep these files safe!" -ForegroundColor Red
    Write-Host "  - $keystorePath" -ForegroundColor Yellow
    Write-Host "  - android/key.properties" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You'll need them to update your app on Play Store!" -ForegroundColor Red
    Write-Host ""
    
    $continue = Read-Host "Continue with build? (Y/N)"
    if ($continue -ne "Y" -and $continue -ne "y") {
        exit 0
    }
}

# Build web app
Write-Host ""
Write-Host "Building web application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}

# Sync to Android
Write-Host ""
Write-Host "Syncing to Android..." -ForegroundColor Yellow
npx cap sync android

# Build release APK
Write-Host ""
Write-Host "Building release APK..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

Set-Location android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Release build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Check if APK was created
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ Release APK Built Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK Location:" -ForegroundColor Cyan
    Write-Host "  $apkPath" -ForegroundColor White
    Write-Host ""
    
    # Get APK size
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "This APK is ready for:" -ForegroundColor Yellow
    Write-Host "  ✓ Distribution outside Play Store" -ForegroundColor Green
    Write-Host "  ✓ Testing on devices" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "For Google Play Store:" -ForegroundColor Yellow
    Write-Host "  Build an AAB (Android App Bundle) instead:" -ForegroundColor White
    Write-Host "  cd android && .\gradlew.bat bundleRelease" -ForegroundColor Cyan
    Write-Host ""
    
    # Ask if user wants to open the folder
    $openFolder = Read-Host "Open APK folder? (Y/N)"
    if ($openFolder -eq "Y" -or $openFolder -eq "y") {
        explorer.exe "android\app\build\outputs\apk\release"
    }
} else {
    Write-Host "✗ APK file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Release build completed! 🎉" -ForegroundColor Green
