# Check if system is ready for Android APK build

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX Android Setup Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found!" -ForegroundColor Red
    Write-Host "    Install from: https://nodejs.org/" -ForegroundColor Gray
    $allGood = $false
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm not found!" -ForegroundColor Red
    $allGood = $false
}

# Check Java
Write-Host "Checking Java JDK..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    if ($javaVersion -match "17\.|18\.|19\.|20\.") {
        Write-Host "  ✓ Java: $javaVersion" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Java found but version may not be optimal" -ForegroundColor Yellow
        Write-Host "    Recommended: JDK 17" -ForegroundColor Gray
        Write-Host "    Download: https://adoptium.net/" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ Java JDK not found!" -ForegroundColor Red
    Write-Host "    Install JDK 17 from: https://adoptium.net/" -ForegroundColor Gray
    $allGood = $false
}

# Check Gradle (optional)
Write-Host "Checking Gradle..." -ForegroundColor Yellow
try {
    $gradleVersion = gradle --version 2>&1 | Select-String "Gradle" | Select-Object -First 1
    Write-Host "  ✓ Gradle: $gradleVersion" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Gradle not found (will be downloaded automatically)" -ForegroundColor Yellow
}

# Check Android SDK (optional)
Write-Host "Checking Android SDK..." -ForegroundColor Yellow
$androidHome = $env:ANDROID_HOME
if ($androidHome -and (Test-Path $androidHome)) {
    Write-Host "  ✓ Android SDK: $androidHome" -ForegroundColor Green
    
    # Check for platform-tools (adb)
    $adbPath = Join-Path $androidHome "platform-tools\adb.exe"
    if (Test-Path $adbPath) {
        Write-Host "  ✓ ADB found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ ADB not found in SDK" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Android SDK not found (optional)" -ForegroundColor Yellow
    Write-Host "    Install Android Studio for easier development" -ForegroundColor Gray
    Write-Host "    https://developer.android.com/studio" -ForegroundColor Gray
}

# Check ADB
Write-Host "Checking ADB (Android Debug Bridge)..." -ForegroundColor Yellow
try {
    $adbVersion = adb version 2>&1 | Select-String "Android Debug Bridge" | Select-Object -First 1
    Write-Host "  ✓ ADB: $adbVersion" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ ADB not found (needed for device installation)" -ForegroundColor Yellow
    Write-Host "    Install Android SDK Platform Tools" -ForegroundColor Gray
}

# Check project dependencies
Write-Host ""
Write-Host "Checking project setup..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    Write-Host "  ✓ package.json found" -ForegroundColor Green
} else {
    Write-Host "  ✗ package.json not found!" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "node_modules") {
    Write-Host "  ✓ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ node_modules not found" -ForegroundColor Yellow
    Write-Host "    Run: npm install" -ForegroundColor Gray
}

if (Test-Path "capacitor.config.json") {
    Write-Host "  ✓ capacitor.config.json found" -ForegroundColor Green
} else {
    Write-Host "  ⚠ capacitor.config.json not found" -ForegroundColor Yellow
    Write-Host "    Will be created during build" -ForegroundColor Gray
}

if (Test-Path "android") {
    Write-Host "  ✓ Android project exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Android project not found" -ForegroundColor Yellow
    Write-Host "    Will be created during build" -ForegroundColor Gray
}

# Check disk space
Write-Host ""
Write-Host "Checking disk space..." -ForegroundColor Yellow
$drive = Get-PSDrive -Name C
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeSpaceGB -gt 5) {
    Write-Host "  ✓ Free space: $freeSpaceGB GB" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Low disk space: $freeSpaceGB GB" -ForegroundColor Yellow
    Write-Host "    Recommended: At least 5 GB free" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "  ✓ System Ready for Android Build!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run: .\build-android-apk.ps1" -ForegroundColor White
    Write-Host "  2. Wait for build to complete (5-10 minutes)" -ForegroundColor White
    Write-Host "  3. Find APK in: android\app\build\outputs\apk\debug\" -ForegroundColor White
    Write-Host ""
    Write-Host "For detailed guide, see: ANDROID_APK_QUICK_START.md" -ForegroundColor Cyan
} else {
    Write-Host "  ⚠ Setup Incomplete" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please install missing requirements above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Essential:" -ForegroundColor Red
    Write-Host "  - Node.js: https://nodejs.org/" -ForegroundColor White
    Write-Host "  - Java JDK 17: https://adoptium.net/" -ForegroundColor White
    Write-Host ""
    Write-Host "Optional (but recommended):" -ForegroundColor Yellow
    Write-Host "  - Android Studio: https://developer.android.com/studio" -ForegroundColor White
}

Write-Host ""
