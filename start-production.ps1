# AthleteX Production Server Startup Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX Production Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "⚠️  Warning: .env.production not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating from example..." -ForegroundColor Yellow
    Copy-Item ".env.production.example" ".env.production"
    Write-Host "✅ Created .env.production" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env.production and add your actual values!" -ForegroundColor Yellow
    Write-Host "Press any key to continue or Ctrl+C to exit and configure first..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Set NODE_ENV to production
$env:NODE_ENV = "production"

Write-Host "🔧 Environment: Production" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Build frontend
Write-Host "🏗️  Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Start production server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Production Server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Server starting on port 5000" -ForegroundColor Green
Write-Host "🔒 Security: Enabled" -ForegroundColor Green
Write-Host "💳 Payments: Configured" -ForegroundColor Green
Write-Host "🔑 JWT Auth: Enabled" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the server
node server/server-production.js
