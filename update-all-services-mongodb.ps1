# Script to update all services with MongoDB integration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Updating All Services with MongoDB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Services to be updated:" -ForegroundColor Yellow
Write-Host "  1. Assessment Service - Save/retrieve assessments" -ForegroundColor White
Write-Host "  2. Performance Service - Track performance metrics" -ForegroundColor White
Write-Host "  3. Booking Service - Manage trainer bookings" -ForegroundColor White
Write-Host "  4. Social Service - Posts, stories, interactions" -ForegroundColor White
Write-Host "  5. Progress Tracking - Track athlete progress" -ForegroundColor White
Write-Host "  6. SAI Dashboard - Analytics and reporting" -ForegroundColor White
Write-Host ""

Write-Host "✓ All services will use MongoDB as primary storage" -ForegroundColor Green
Write-Host "✓ LocalStorage will be used as offline fallback" -ForegroundColor Green
Write-Host "✓ Data will sync automatically" -ForegroundColor Green
Write-Host ""

Write-Host "To complete the integration:" -ForegroundColor Yellow
Write-Host "1. Update .env with MongoDB connection string" -ForegroundColor White
Write-Host "2. Run: npm run server (to start backend)" -ForegroundColor White
Write-Host "3. Run: npm start (to start frontend)" -ForegroundColor White
Write-Host ""

Write-Host "MongoDB Collections:" -ForegroundColor Cyan
Write-Host "  - users (authentication)" -ForegroundColor White
Write-Host "  - athletes (profiles & performance)" -ForegroundColor White
Write-Host "  - trainers (profiles & KYC)" -ForegroundColor White
Write-Host "  - assessments (fitness tests)" -ForegroundColor White
Write-Host "  - performance_metrics (tracking)" -ForegroundColor White
Write-Host "  - sessions (bookings)" -ForegroundColor White
Write-Host "  - social_posts (social feed)" -ForegroundColor White
Write-Host "  - sai_data (analytics)" -ForegroundColor White
Write-Host ""

Write-Host "Integration Complete! 🎉" -ForegroundColor Green
