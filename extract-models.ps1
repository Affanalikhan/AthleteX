# Extract Trained Models for AthleteX

Write-Host "Extracting trained ML models..." -ForegroundColor Cyan

# Create public/models directory if it doesn't exist
$modelsDir = "public/models"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
    Write-Host "Created $modelsDir directory" -ForegroundColor Green
}

# Model mappings
$modelMappings = @{
    "30mts standing start.zip" = "sprint"
    "4_10_shuttle_run.zip" = "shuttle_run"
    "Broad_jump_model.zip" = "broad_jump"
    "endurance_run_coach_deployment.zip" = "endurance_run"
    "hight_sit&reach_test.zip" = "sit_and_reach"
    "MedicineBallPowerCoach_Complete.zip" = "medicine_ball"
    "situps.zip" = "situps"
    "vertical-jump-coach-deployment.zip" = "vertical_jump"
}

$sourceDir = "trained_models_temp/trained models"

foreach ($zipFile in $modelMappings.Keys) {
    $modelName = $modelMappings[$zipFile]
    $zipPath = Join-Path $sourceDir $zipFile
    $extractPath = Join-Path $modelsDir $modelName
    
    if (Test-Path $zipPath) {
        Write-Host "Extracting $zipFile to $modelName..." -ForegroundColor Yellow
        
        # Create extraction directory
        if (-not (Test-Path $extractPath)) {
            New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
        }
        
        # Extract zip file
        try {
            Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
            Write-Host "  Extracted successfully" -ForegroundColor Green
        } catch {
            Write-Host "  Failed to extract: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  Not found: $zipFile" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Model extraction complete!" -ForegroundColor Green
Write-Host "Models are now in: $modelsDir" -ForegroundColor Cyan
