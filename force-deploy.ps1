# Force Deploy to Netlify with Cache Clear

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Force Deploy with Cache Clear" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠ This will:" -ForegroundColor Yellow
Write-Host "  1. Clear local build folder" -ForegroundColor White
Write-Host "  2. Clear Netlify cache" -ForegroundColor White
Write-Host "  3. Fresh build" -ForegroundColor White
Write-Host "  4. Deploy to production" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

# Step 1: Clear local build
Write-Host ""
Write-Host "Step 1: Clearing local build..." -ForegroundColor Yellow
if (Test-Path "build") {
    Remove-Item -Recurse -Force build
    Write-Host "✓ Local build cleared" -ForegroundColor Green
} else {
    Write-Host "✓ No build folder to clear" -ForegroundColor Green
}

# Step 2: Clear node_modules (optional but recommended)
Write-Host ""
Write-Host "Step 2: Clear node_modules? (Recommended for major updates)" -ForegroundColor Yellow
$clearModules = Read-Host "Clear node_modules? (Y/N)"
if ($clearModules -eq "Y" -or $clearModules -eq "y") {
    if (Test-Path "node_modules") {
        Write-Host "Clearing node_modules..." -ForegroundColor Gray
        Remove-Item -Recurse -Force node_modules
        Write-Host "✓ node_modules cleared" -ForegroundColor Green
        
        Write-Host "Installing dependencies..." -ForegroundColor Gray
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ npm install failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Dependencies installed" -ForegroundColor Green
    }
}

# Step 3: Fresh build
Write-Host ""
Write-Host "Step 3: Building application..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

$env:GENERATE_SOURCEMAP = "false"
$env:CI = "false"

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Build successful" -ForegroundColor Green

# Get build info
$buildSize = (Get-ChildItem -Path "build" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Build size: $([math]::Round($buildSize, 2)) MB" -ForegroundColor Cyan

# Step 4: Deploy with cache clear
Write-Host ""
Write-Host "Step 4: Deploying to Netlify..." -ForegroundColor Yellow
Write-Host "Clearing Netlify cache and deploying..." -ForegroundColor Gray

netlify deploy --prod --dir=build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ Deployment Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your site is now live with latest changes!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠ IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Windows/Linux: Ctrl + Shift + R" -ForegroundColor White
    Write-Host "Mac: Cmd + Shift + R" -ForegroundColor White
    Write-Host ""
    Write-Host "Or open in incognito/private mode:" -ForegroundColor White
    Write-Host "  Chrome: Ctrl + Shift + N" -ForegroundColor Gray
    Write-Host "  Firefox: Ctrl + Shift + P" -ForegroundColor Gray
    Write-Host ""
    
    $openSite = Read-Host "Open site in browser? (Y/N)"
    if ($openSite -eq "Y" -or $openSite -eq "y") {
        netlify open:site
    }
    
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host "  2. Test in incognito mode" -ForegroundColor White
    Write-Host "  3. Verify new features work" -ForegroundColor White
    Write-Host "  4. Test on mobile devices" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✗ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check your internet connection" -ForegroundColor White
    Write-Host "  2. Verify Netlify authentication: netlify status" -ForegroundColor White
    Write-Host "  3. Check Netlify dashboard for errors" -ForegroundColor White
    Write-Host "  4. Try: netlify login" -ForegroundColor White
    exit 1
}
