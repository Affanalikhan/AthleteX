# MongoDB Setup Script for AthleteX

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AthleteX MongoDB Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
GENERATE_SOURCEMAP=false
CI=false

# MongoDB Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/athletex?retryWrites=true&w=majority
MONGODB_DB_NAME=athletex

# API Configuration
PORT=5000
NODE_ENV=development
"@
    
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠ Please update the MONGODB_URI in .env with your actual credentials" -ForegroundColor Yellow
    Write-Host ""
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env file with your MongoDB credentials" -ForegroundColor White
Write-Host "2. Run 'npm run server' to start the backend" -ForegroundColor White
Write-Host "3. Run 'npm start' to start the frontend" -ForegroundColor White
Write-Host "4. Or run 'npm run dev' to start both" -ForegroundColor White
Write-Host ""
Write-Host "API will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
