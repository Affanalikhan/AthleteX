# AthleteX - Quick Start Script
# This script helps you get AthleteX up and running quickly

param(
    [switch]$Clean,
    [switch]$Build,
    [switch]$Validate
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                        ║" -ForegroundColor Cyan
Write-Host "║          🏃 AthleteX v1.0             ║" -ForegroundColor Cyan
Write-Host "║   AI-Powered Athletic Performance      ║" -ForegroundColor Cyan
Write-Host "║                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "  ✅ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ npm not found" -ForegroundColor Red
    exit 1
}

# Clean install if requested
if ($Clean) {
    Write-Host ""
    Write-Host "🧹 Cleaning previous installation..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules"
        Write-Host "  ✅ Removed node_modules" -ForegroundColor Green
    }
    if (Test-Path "package-lock.json") {
        Remove-Item -Force "package-lock.json"
        Write-Host "  ✅ Removed package-lock.json" -ForegroundColor Green
    }
    if (Test-Path "build") {
        Remove-Item -Recurse -Force "build"
        Write-Host "  ✅ Removed build folder" -ForegroundColor Green
    }
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ Dependencies already installed" -ForegroundColor Green
}

# Build if requested
if ($Build) {
    Write-Host ""
    Write-Host "🔨 Building production version..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Build successful" -ForegroundColor Green
        Write-Host ""
        Write-Host "📂 Build output is in the 'build' folder" -ForegroundColor Cyan
    } else {
        Write-Host "  ❌ Build failed" -ForegroundColor Red
        exit 1
    }
}

# Validate if requested
if ($Validate) {
    Write-Host ""
    Write-Host "🔍 Running validation..." -ForegroundColor Yellow
    & ".\validate-app.ps1"
    exit $LASTEXITCODE
}

# Start development server
if (!$Build -and !$Validate) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🚀 Starting AthleteX Development Server" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📱 The app will open in your browser at:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Quick Test Accounts:" -ForegroundColor Yellow
    Write-Host "   Athlete: Any email/password (auto-created)" -ForegroundColor White
    Write-Host "   Trainer: Register via Trainer Portal" -ForegroundColor White
    Write-Host "   SAI Admin: Use SAI Login" -ForegroundColor White
    Write-Host ""
    Write-Host "⚡ Features to Try:" -ForegroundColor Yellow
    Write-Host "   • Assessment with AI analysis" -ForegroundColor White
    Write-Host "   • Performance tracking & charts" -ForegroundColor White
    Write-Host "   • Personalized training plans" -ForegroundColor White
    Write-Host "   • Social feed & community" -ForegroundColor White
    Write-Host "   • Coach booking system" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    
    npm start
}
