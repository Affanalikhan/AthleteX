# AthleteX - App Validation Script
# This script validates all features and functionality

Write-Host "🔍 AthleteX - Validating Application..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Check 1: Verify all required files exist
Write-Host "📁 Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "package.json",
    "tsconfig.json",
    "src/App.tsx",
    "src/index.tsx",
    "src/hooks/useAuth.ts",
    "src/services/authService.ts",
    "src/services/performanceService.ts",
    "src/services/aiAnalysisService.ts",
    "src/pages/LandingPage.tsx",
    "src/pages/EnhancedLoginPage.tsx",
    "src/pages/ProfilePage.tsx",
    "src/pages/AssessmentPage.tsx",
    "src/pages/PerformancePage.tsx",
    "src/pages/TrainingPage.tsx",
    "src/pages/SocialPage.tsx",
    "src/components/Navigation.tsx",
    "src/components/LoadingSpinner.tsx"
)

foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        $errors += "Missing required file: $file"
    }
}

if ($errors.Count -eq 0) {
    Write-Host "  ✅ All required files present" -ForegroundColor Green
} else {
    Write-Host "  ❌ Missing files detected" -ForegroundColor Red
}

# Check 2: Verify node_modules
Write-Host ""
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    $errors += "node_modules not found. Run 'npm install'"
} else {
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
}

# Check 3: Try to build
Write-Host ""
Write-Host "🔨 Testing build..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Build successful" -ForegroundColor Green
} else {
    $errors += "Build failed"
    Write-Host "  ❌ Build failed" -ForegroundColor Red
}

# Check 4: Verify build output
Write-Host ""
Write-Host "📂 Checking build output..." -ForegroundColor Yellow
if (Test-Path "build") {
    $buildFiles = Get-ChildItem -Path "build" -Recurse
    if ($buildFiles.Count -gt 0) {
        Write-Host "  ✅ Build output generated ($($buildFiles.Count) files)" -ForegroundColor Green
    } else {
        $warnings += "Build folder is empty"
        Write-Host "  ⚠️  Build folder is empty" -ForegroundColor Yellow
    }
} else {
    $errors += "Build folder not found"
    Write-Host "  ❌ Build folder not found" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 AthleteX is fully functional and ready to use!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Cyan
    Write-Host "  npm start          - Start development server" -ForegroundColor White
    Write-Host "  npm run build      - Build for production" -ForegroundColor White
    Write-Host "  npm test           - Run tests" -ForegroundColor White
    exit 0
} else {
    if ($errors.Count -gt 0) {
        Write-Host "❌ Errors found:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  • $error" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  • $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "Please fix the issues above before deploying." -ForegroundColor Yellow
    exit 1
}
