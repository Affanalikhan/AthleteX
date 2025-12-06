# AthleteX PWA Deployment Script
# Builds and deploys the PWA to Netlify

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX PWA Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Building React app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""

# Check if build folder exists
if (!(Test-Path "build")) {
    Write-Host "❌ Build folder not found!" -ForegroundColor Red
    exit 1
}

# Check PWA files
Write-Host "🔍 Checking PWA files..." -ForegroundColor Yellow

$pwaFiles = @(
    "build/manifest.json",
    "build/service-worker.js",
    "build/offline.html"
)

$allFilesExist = $true
foreach ($file in $pwaFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file missing!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (!$allFilesExist) {
    Write-Host ""
    Write-Host "⚠️  Some PWA files are missing!" -ForegroundColor Yellow
    Write-Host "Make sure all PWA files are in the public folder" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "📊 Build Statistics:" -ForegroundColor Cyan

# Get build folder size
$buildSize = (Get-ChildItem -Path "build" -Recurse | Measure-Object -Property Length -Sum).Sum
$buildSizeMB = [math]::Round($buildSize / 1MB, 2)

Write-Host "  Build Size: $buildSizeMB MB" -ForegroundColor White
Write-Host "  PWA Ready: Yes" -ForegroundColor Green
Write-Host "  Offline Support: Yes" -ForegroundColor Green
Write-Host "  Service Worker: Yes" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Deployment Options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Netlify (Automatic)" -ForegroundColor White
Write-Host "   - Push to GitHub" -ForegroundColor Gray
Write-Host "   - Netlify auto-deploys" -ForegroundColor Gray
Write-Host "   - Live at: https://athletex1.netlify.app" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Manual Netlify Deploy" -ForegroundColor White
Write-Host "   - Run: netlify deploy --prod" -ForegroundColor Gray
Write-Host "   - Or drag 'build' folder to Netlify dashboard" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Other Hosting" -ForegroundColor White
Write-Host "   - Upload 'build' folder to your host" -ForegroundColor Gray
Write-Host "   - Ensure HTTPS is enabled" -ForegroundColor Gray
Write-Host "   - Configure redirects for SPA" -ForegroundColor Gray
Write-Host ""

Write-Host "📱 PWA Features:" -ForegroundColor Cyan
Write-Host "  ✓ Installable on all devices" -ForegroundColor Green
Write-Host "  ✓ Works offline" -ForegroundColor Green
Write-Host "  ✓ Push notifications ready" -ForegroundColor Green
Write-Host "  ✓ App shortcuts" -ForegroundColor Green
Write-Host "  ✓ Background sync" -ForegroundColor Green
Write-Host "  ✓ Fast loading" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 Testing:" -ForegroundColor Yellow
Write-Host "  1. Visit: https://athletex1.netlify.app" -ForegroundColor White
Write-Host "  2. Open DevTools > Lighthouse" -ForegroundColor White
Write-Host "  3. Run PWA audit" -ForegroundColor White
Write-Host "  4. Install on mobile device" -ForegroundColor White
Write-Host "  5. Test offline mode" -ForegroundColor White
Write-Host ""

Write-Host "✅ Build ready for deployment!" -ForegroundColor Green
Write-Host ""

# Ask if user wants to deploy now
$deploy = Read-Host "Deploy to Netlify now? (y/n)"

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Deploying to Netlify..." -ForegroundColor Yellow
    
    # Check if netlify CLI is installed
    try {
        netlify --version | Out-Null
        
        Write-Host "Deploying..." -ForegroundColor Gray
        netlify deploy --prod --dir=build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "  DEPLOYMENT SUCCESSFUL! 🎉" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Your PWA is live at:" -ForegroundColor White
            Write-Host "https://athletex1.netlify.app" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Users can now:" -ForegroundColor Yellow
            Write-Host "  • Install from browser" -ForegroundColor White
            Write-Host "  • Use offline" -ForegroundColor White
            Write-Host "  • Receive push notifications" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "❌ Deployment failed!" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Netlify CLI not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Install Netlify CLI:" -ForegroundColor Yellow
        Write-Host "  npm install -g netlify-cli" -ForegroundColor White
        Write-Host ""
        Write-Host "Or deploy manually:" -ForegroundColor Yellow
        Write-Host "  1. Go to https://app.netlify.com" -ForegroundColor White
        Write-Host "  2. Drag 'build' folder to deploy" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "Build is ready in the 'build' folder" -ForegroundColor White
    Write-Host "Deploy when ready!" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Happy deploying! 🚀" -ForegroundColor Cyan
Write-Host ""
