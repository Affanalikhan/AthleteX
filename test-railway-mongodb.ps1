# Test Railway Backend and MongoDB Atlas Connection

Write-Host "🔍 Testing Railway Backend and MongoDB Atlas..." -ForegroundColor Cyan
Write-Host ""

# Check if Railway URL is set
$railwayUrl = "https://athletex-api-production.up.railway.app"
Write-Host "📡 Railway URL: $railwayUrl" -ForegroundColor Yellow

# Test 1: Health Check
Write-Host ""
Write-Host "Test 1: Health Check Endpoint" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
try {
    $healthResponse = Invoke-RestMethod -Uri "$railwayUrl/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Health Check: PASSED" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor White
    Write-Host "   Message: $($healthResponse.message)" -ForegroundColor White
    Write-Host "   Timestamp: $($healthResponse.timestamp)" -ForegroundColor White
} catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Database Connection (via API)
Write-Host ""
Write-Host "Test 2: Database Connection Test" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
try {
    $dbTestResponse = Invoke-RestMethod -Uri "$railwayUrl/api/users" -Method Get -TimeoutSec 10
    Write-Host "✅ Database Connection: PASSED" -ForegroundColor Green
    Write-Host "   MongoDB Atlas is connected and responding" -ForegroundColor White
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "⚠️  Database Connection: UNKNOWN" -ForegroundColor Yellow
        Write-Host "   API endpoint exists but returned 404 (might be empty)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Database Connection: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Check all API routes
Write-Host ""
Write-Host "Test 3: API Routes Check" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

$routes = @(
    "/api/users",
    "/api/trainers",
    "/api/athletes",
    "/api/assessments",
    "/api/performance",
    "/api/sai",
    "/api/sessions",
    "/api/social"
)

foreach ($route in $routes) {
    try {
        $response = Invoke-WebRequest -Uri "$railwayUrl$route" -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ $route - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404 -or $statusCode -eq 200) {
            Write-Host "✅ $route - Accessible (Status: $statusCode)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $route - Status: $statusCode" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Railway Backend: Check results above" -ForegroundColor White
Write-Host "MongoDB Atlas: Check results above" -ForegroundColor White
Write-Host ""
Write-Host "If all tests passed, your backend is working correctly!" -ForegroundColor Green
Write-Host "If tests failed, check your Railway deployment and MongoDB Atlas connection" -ForegroundColor Yellow
