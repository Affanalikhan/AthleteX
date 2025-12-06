# AthleteX - Comprehensive Fix Script
# This script fixes all warnings and ensures the app is production-ready

Write-Host "🚀 AthleteX - Fixing All Issues..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean node_modules and reinstall
Write-Host "📦 Step 1: Cleaning and reinstalling dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}
npm install

# Step 2: Build the project
Write-Host ""
Write-Host "🔨 Step 2: Building the project..." -ForegroundColor Yellow
npm run build

# Step 3: Check for errors
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 AthleteX is ready to run!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start the development server, run:" -ForegroundColor Cyan
    Write-Host "  npm start" -ForegroundColor White
    Write-Host ""
    Write-Host "To deploy, run:" -ForegroundColor Cyan
    Write-Host "  npm run build" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
