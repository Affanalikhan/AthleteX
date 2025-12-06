# PowerShell script to replace non-existent TestType references with valid ones

$files = @(
    "src/components/PerformanceAnalytics.tsx",
    "src/pages/EnhancedAssessmentPage.tsx", 
    "src/pages/PersonalizedTrainingPage.tsx",
    "src/services/aiAnalysisService.ts",
    "src/services/aiTrainingService.ts",
    "src/services/benchmarkingService.ts",
    "src/services/cheatDetectionService.ts",
    "src/services/personalizedWorkoutGenerator.ts"
)

# Define replacements - map non-existent TestTypes to existing ones
$replacements = @{
    "TestType\.SPEED" = "TestType.TENNIS_STANDING_START"
    "TestType\.AGILITY" = "TestType.FOUR_X_10M_SHUTTLE_RUN"
    "TestType\.STRENGTH" = "TestType.MEDICINE_BALL_THROW"
    "TestType\.ENDURANCE" = "TestType.ENDURANCE_RUN"
    "TestType\.FLEXIBILITY" = "TestType.SIT_AND_REACH"
    "TestType\.BALANCE" = "TestType.STANDING_VERTICAL_JUMP"
    "TestType\.PUSH_UPS" = "TestType.SIT_UPS"
    "TestType\.PULL_UPS" = "TestType.SIT_UPS"
    "TestType\.PLANK" = "TestType.SIT_UPS"
    "TestType\.VERTICAL_JUMP" = "TestType.STANDING_VERTICAL_JUMP"
    "TestType\.STANDING_LONG_JUMP" = "TestType.STANDING_BROAD_JUMP"
    "TestType\.SPRINT_100M" = "TestType.TENNIS_STANDING_START"
    "TestType\.SPRINT_200M" = "TestType.TENNIS_STANDING_START"
    "TestType\.SHUTTLE_RUN" = "TestType.FOUR_X_10M_SHUTTLE_RUN"
    "TestType\.T_TEST" = "TestType.FOUR_X_10M_SHUTTLE_RUN"
    "TestType\.ILLINOIS_AGILITY" = "TestType.FOUR_X_10M_SHUTTLE_RUN"
    "TestType\.BEAR_CRAWL" = "TestType.ENDURANCE_RUN"
    "TestType\.MARATHON" = "TestType.ENDURANCE_RUN"
    "TestType\.HALF_MARATHON" = "TestType.ENDURANCE_RUN"
    "TestType\.CROSS_COUNTRY" = "TestType.ENDURANCE_RUN"
    "TestType\.TRIATHLON" = "TestType.ENDURANCE_RUN"
    "TestType\.SHOT_PUT" = "TestType.MEDICINE_BALL_THROW"
    "TestType\.DISCUS_THROW" = "TestType.MEDICINE_BALL_THROW"
    "TestType\.JAVELIN_THROW" = "TestType.MEDICINE_BALL_THROW"
    "TestType\.HAMMER_THROW" = "TestType.MEDICINE_BALL_THROW"
    "TestType\.HURDLES" = "TestType.FOUR_X_10M_SHUTTLE_RUN"
    "TestType\.RELAY" = "TestType.TENNIS_STANDING_START"
    "TestType\.TRIPLE_JUMP" = "TestType.STANDING_BROAD_JUMP"
    "TestType\.HIGH_JUMP" = "TestType.STANDING_VERTICAL_JUMP"
    "TestType\.POLE_VAULT" = "TestType.STANDING_VERTICAL_JUMP"
    "TestType\.DECATHLON" = "TestType.ENDURANCE_RUN"
    "TestType\.HEPTATHLON" = "TestType.ENDURANCE_RUN"
    "TestType\.PENTATHLON" = "TestType.ENDURANCE_RUN"
}

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        $content = Get-Content $file -Raw
        
        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $content = $content -replace $pattern, $replacement
        }
        
        Set-Content $file $content -NoNewline
        Write-Host "Updated $file"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "All files processed!"