# AthleteX Netlify Deployment Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX Netlify Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Netlify CLI is installed
Write-Host "Checking Netlify CLI..." -ForegroundColor Yellow
try {
    $netlifyVersion = netlify --version
    Write-Host "✓ Netlify CLI installed: $netlifyVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Netlify CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
    npm install -g netlify-cli
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install Netlify CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Netlify CLI installed" -ForegroundColor Green
}

# Check if logged in
Write-Host ""
Write-Host "Checking Netlify authentication..." -ForegroundColor Yellow
$authStatus = netlify status 2>&1

if ($authStatus -match "Not logged in") {
    Write-Host "⚠ Not logged in to Netlify" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening browser for authentication..." -ForegroundColor Cyan
    netlify login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Authentication failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Authenticated with Netlify" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Build the application
Write-Host ""
Write-Host "Building application..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. TypeScript errors - check console output" -ForegroundColor White
    Write-Host "  2. Missing dependencies - run npm install" -ForegroundColor White
    Write-Host "  3. Memory issues - close other applications" -ForegroundColor White
    exit 1
}

Write-Host "✓ Build successful" -ForegroundColor Green

# Check if build folder exists
if (-not (Test-Path "build")) {
    Write-Host "✗ Build folder not found!" -ForegroundColor Red
    exit 1
}

# Get build size
$buildSize = (Get-ChildItem -Path "build" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Build size: $([math]::Round($buildSize, 2)) MB" -ForegroundColor Cyan

# Ask for deployment type
Write-Host ""
Write-Host "Select deployment type:" -ForegroundColor Yellow
Write-Host "  1. Production (live site)" -ForegroundColor White
Write-Host "  2. Preview (test deployment)" -ForegroundColor White
Write-Host ""
$deployType = Read-Host "Enter choice (1 or 2)"

if ($deployType -eq "1") {
    Write-Host ""
    Write-Host "Deploying to PRODUCTION..." -ForegroundColor Yellow
    Write-Host "⚠ This will update your live site!" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Continue? (Y/N)"
    
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "Deployment cancelled" -ForegroundColor Yellow
        exit 0
    }
    
    netlify deploy --prod --dir=build
} else {
    Write-Host ""
    Write-Host "Deploying PREVIEW..." -ForegroundColor Yellow
    netlify deploy --dir=build
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ Deployment Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    if ($deployType -eq "1") {
        Write-Host "Your site is now LIVE! 🎉" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Test your site thoroughly" -ForegroundColor White
        Write-Host "  2. Share the link with users" -ForegroundColor White
        Write-Host "  3. Monitor analytics" -ForegroundColor White
        Write-Host "  4. Collect feedback" -ForegroundColor White
    } else {
        Write-Host "Preview deployment created! 🚀" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Test the preview URL" -ForegroundColor White
        Write-Host "  2. If everything works, deploy to production" -ForegroundColor White
        Write-Host "  3. Run: .\deploy-netlify.ps1 and choose option 1" -ForegroundColor White
    }
    
    Write-Host ""
    $openSite = Read-Host "Open site in browser? (Y/N)"
    if ($openSite -eq "Y" -or $openSite -eq "y") {
        netlify open:site
    }
} else {
    Write-Host ""
    Write-Host "✗ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check your internet connection" -ForegroundColor White
    Write-Host "  2. Verify Netlify authentication" -ForegroundColor White
    Write-Host "  3. Check build folder exists" -ForegroundColor White
    Write-Host "  4. Review error messages above" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Deployment completed! 🎉" -ForegroundColor Green
