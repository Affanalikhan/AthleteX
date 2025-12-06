import { AssessmentTest, TestType, Athlete } from '../models';

interface CheatDetectionResult {
  assessmentId: string;
  overallIntegrityScore: number; // 0-100, 100 = fully legitimate
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flagged: boolean;
  detectionResults: {
    videoTampering: VideoTamperingResult;
    movementAnalysis: MovementAnalysisResult;
    environmentalChecks: EnvironmentalChecksResult;
    biometricConsistency: BiometricConsistencyResult;
    temporalAnalysis: TemporalAnalysisResult;
  };
  confidence: number; // 0-1
  recommendedAction: 'approve' | 'review' | 'reject' | 'request_resubmission';
  flaggedReasons: string[];
  suggestions: string[];
}

interface VideoTamperingResult {
  tamperingDetected: boolean;
  tamperingType?: 'deepfake' | 'splice' | 'overlay' | 'speed_manipulation' | 'frame_duplication';
  confidence: number;
  suspiciousFrames: number[];
  technicalAnomalies: {
    compressionInconsistencies: boolean;
    metadataAnomalies: boolean;
    pixelLevelAnomalies: boolean;
    temporalInconsistencies: boolean;
  };
}

interface MovementAnalysisResult {
  exerciseCompliance: number; // 0-100
  biomechanicalValidity: number; // 0-100
  movementQuality: number; // 0-100
  detectedIssues: Array<{
    type: 'incorrect_form' | 'impossible_movement' | 'inconsistent_physics' | 'unnatural_acceleration';
    severity: 'low' | 'medium' | 'high';
    timeframe: { start: number; end: number }; // in seconds
    description: string;
    confidence: number;
  }>;
  bodyPartAnalysis: {
    headTracking: { consistency: number; naturalness: number };
    limbMovement: { coordination: number; physicallyPossible: number };
    overallPosture: { stability: number; correctness: number };
  };
}

interface EnvironmentalChecksResult {
  environmentAuthenticity: number; // 0-100
  lightingConsistency: number; // 0-100
  backgroundAuthenticity: number; // 0-100
  shadowAnalysis: number; // 0-100
  suspiciousElements: Array<{
    type: 'green_screen' | 'cgi_background' | 'lighting_mismatch' | 'impossible_shadows';
    confidence: number;
    location: { x: number; y: number; width: number; height: number };
  }>;
}

interface BiometricConsistencyResult {
  facialConsistency: number; // 0-100
  bodyProportionConsistency: number; // 0-100
  voiceConsistency?: number; // 0-100 (if audio available)
  gaitAnalysis: number; // 0-100
  identityConfidence: number; // 0-100
  multiplePersonsDetected: boolean;
  suspiciousIdentityChanges: boolean;
}

interface TemporalAnalysisResult {
  speedConsistency: number; // 0-100
  frameRateAnomalies: boolean;
  timestampValidation: number; // 0-100
  durationAuthenticity: number; // 0-100
  suspiciousTimelapses: Array<{
    startTime: number;
    endTime: number;
    suspectedManipulation: 'speed_up' | 'slow_down' | 'skip';
    confidence: number;
  }>;
}

interface CheatDetectionConfig {
  videoAnalysis: {
    enableDeepfakeDetection: boolean;
    enablePixelAnalysis: boolean;
    enableCompressionAnalysis: boolean;
    tamperingThreshold: number; // 0-1
  };
  movementAnalysis: {
    enableBiomechanicalValidation: boolean;
    enablePhysicsValidation: boolean;
    exerciseComplianceThreshold: number; // 0-100
  };
  environmentalChecks: {
    enableBackgroundAnalysis: boolean;
    enableLightingAnalysis: boolean;
    enableShadowAnalysis: boolean;
  };
  biometricValidation: {
    enableFacialRecognition: boolean;
    enableGaitAnalysis: boolean;
    enableVoiceAnalysis: boolean;
    identityThreshold: number; // 0-1
  };
  riskThresholds: {
    lowRisk: number; // integrity score threshold
    mediumRisk: number;
    highRisk: number;
  };
}

class CheatDetectionService {
  private config: CheatDetectionConfig;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  // Main cheat detection pipeline
  async analyzeAssessment(
    assessment: AssessmentTest,
    videoFile: File,
    athlete: Athlete,
    referenceData?: {
      previousAssessments?: AssessmentTest[];
      athletePhotos?: string[];
      voiceSamples?: Blob[];
    }
  ): Promise<CheatDetectionResult> {
    
    console.log(`🔍 Starting cheat detection analysis for assessment ${assessment.id}`);
    
    // Initialize analysis results
    const detectionResults = {
      videoTampering: await this.analyzeVideoTampering(videoFile),
      movementAnalysis: await this.analyzeMovement(videoFile, assessment.testType),
      environmentalChecks: await this.analyzeEnvironment(videoFile),
      biometricConsistency: await this.analyzeBiometrics(videoFile, athlete, referenceData),
      temporalAnalysis: await this.analyzeTemporalAspects(videoFile, assessment)
    };

    // Calculate overall integrity score
    const overallIntegrityScore = this.calculateIntegrityScore(detectionResults);
    
    // Determine risk level and flagging
    const riskLevel = this.determineRiskLevel(overallIntegrityScore);
    const flagged = riskLevel === 'high' || riskLevel === 'critical';
    
    // Generate recommendations and explanations
    const flaggedReasons = this.identifyFlaggedReasons(detectionResults);
    const recommendedAction = this.determineRecommendedAction(overallIntegrityScore, riskLevel, detectionResults);
    const suggestions = this.generateSuggestions(detectionResults, recommendedAction);
    
    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(detectionResults);

    const result: CheatDetectionResult = {
      assessmentId: assessment.id,
      overallIntegrityScore,
      riskLevel,
      flagged,
      detectionResults,
      confidence,
      recommendedAction,
      flaggedReasons,
      suggestions
    };

    // Log the analysis for audit purposes
    console.log(`✅ Cheat detection complete. Integrity Score: ${overallIntegrityScore}, Risk: ${riskLevel}`);
    
    return result;
  }

  // Video tampering detection using multiple techniques
  private async analyzeVideoTampering(videoFile: File): Promise<VideoTamperingResult> {
    console.log('🎥 Analyzing video for tampering...');
    
    // Simulate advanced video analysis
    const tamperingScore = Math.random(); // In real implementation, this would be actual ML analysis
    
    // Simulate various tampering detection techniques
    const technicalAnomalies = {
      compressionInconsistencies: Math.random() > 0.9,
      metadataAnomalies: Math.random() > 0.95,
      pixelLevelAnomalies: Math.random() > 0.92,
      temporalInconsistencies: Math.random() > 0.88
    };

    const tamperingDetected = tamperingScore > 0.7 || Object.values(technicalAnomalies).some(Boolean);
    
    let tamperingType: VideoTamperingResult['tamperingType'];
    if (tamperingDetected) {
      const types: VideoTamperingResult['tamperingType'][] = [
        'deepfake', 'splice', 'overlay', 'speed_manipulation', 'frame_duplication'
      ];
      tamperingType = types[Math.floor(Math.random() * types.length)];
    }

    return {
      tamperingDetected,
      tamperingType,
      confidence: tamperingScore,
      suspiciousFrames: tamperingDetected ? [45, 67, 89, 123] : [],
      technicalAnomalies
    };
  }

  // Movement analysis for exercise compliance and biomechanical validity
  private async analyzeMovement(videoFile: File, testType: TestType): Promise<MovementAnalysisResult> {
    console.log(`🏃 Analyzing movement patterns for ${testType} exercise...`);
    
    // Exercise-specific movement validation
    const exerciseCompliance = this.validateExerciseCompliance(testType);
    const biomechanicalValidity = this.validateBiomechanics();
    const movementQuality = this.assessMovementQuality(testType);
    
    // Detect specific movement issues
    const detectedIssues = this.detectMovementIssues(testType);
    
    // Analyze body parts
    const bodyPartAnalysis = {
      headTracking: {
        consistency: Math.random() * 20 + 80, // 80-100
        naturalness: Math.random() * 15 + 85
      },
      limbMovement: {
        coordination: Math.random() * 25 + 75,
        physicallyPossible: Math.random() * 10 + 90
      },
      overallPosture: {
        stability: Math.random() * 20 + 80,
        correctness: Math.random() * 30 + 70
      }
    };

    return {
      exerciseCompliance,
      biomechanicalValidity,
      movementQuality,
      detectedIssues,
      bodyPartAnalysis
    };
  }

  // Environmental authenticity checks
  private async analyzeEnvironment(videoFile: File): Promise<EnvironmentalChecksResult> {
    console.log('🌍 Analyzing environmental authenticity...');
    
    const environmentAuthenticity = Math.random() * 20 + 80;
    const lightingConsistency = Math.random() * 25 + 75;
    const backgroundAuthenticity = Math.random() * 15 + 85;
    const shadowAnalysis = Math.random() * 20 + 80;
    
    // Generate suspicious elements if environment score is low
    const suspiciousElements = [];
    if (environmentAuthenticity < 85) {
      const elementTypes: EnvironmentalChecksResult['suspiciousElements'][0]['type'][] = [
        'green_screen', 'cgi_background', 'lighting_mismatch', 'impossible_shadows'
      ];
      
      suspiciousElements.push({
        type: elementTypes[Math.floor(Math.random() * elementTypes.length)],
        confidence: Math.random() * 0.4 + 0.6,
        location: { x: 100, y: 150, width: 200, height: 300 }
      });
    }

    return {
      environmentAuthenticity,
      lightingConsistency,
      backgroundAuthenticity,
      shadowAnalysis,
      suspiciousElements
    };
  }

  // Biometric consistency analysis
  private async analyzeBiometrics(
    videoFile: File, 
    athlete: Athlete, 
    referenceData?: any
  ): Promise<BiometricConsistencyResult> {
    console.log('👤 Analyzing biometric consistency...');
    
    // Simulate facial recognition and consistency checks
    const baseFacialConsistency = Math.random() * 20 + 80;
    const bodyProportionConsistency = Math.random() * 25 + 75;
    const gaitAnalysis = Math.random() * 20 + 80;
    
    // Adjust scores based on reference data availability
    const facialConsistency = referenceData?.athletePhotos ? 
      baseFacialConsistency + Math.random() * 10 : baseFacialConsistency;
    
    const voiceConsistency = referenceData?.voiceSamples ? 
      Math.random() * 20 + 80 : undefined;
    
    const identityConfidence = (facialConsistency + bodyProportionConsistency + gaitAnalysis) / 3;
    
    const multiplePersonsDetected = Math.random() > 0.95;
    const suspiciousIdentityChanges = Math.random() > 0.9;

    return {
      facialConsistency,
      bodyProportionConsistency,
      voiceConsistency,
      gaitAnalysis,
      identityConfidence,
      multiplePersonsDetected,
      suspiciousIdentityChanges
    };
  }

  // Temporal analysis for speed consistency and time manipulation
  private async analyzeTemporalAspects(videoFile: File, assessment: AssessmentTest): Promise<TemporalAnalysisResult> {
    console.log('⏱️ Analyzing temporal consistency...');
    
    const speedConsistency = Math.random() * 25 + 75;
    const frameRateAnomalies = Math.random() > 0.9;
    const timestampValidation = Math.random() * 20 + 80;
    const durationAuthenticity = this.validateDurationAuthenticity(assessment.testType);
    
    const suspiciousTimelapses = [];
    if (speedConsistency < 80 || frameRateAnomalies) {
      suspiciousTimelapses.push({
        startTime: 15.2,
        endTime: 23.7,
        suspectedManipulation: 'speed_up' as const,
        confidence: Math.random() * 0.3 + 0.7
      });
    }

    return {
      speedConsistency,
      frameRateAnomalies,
      timestampValidation,
      durationAuthenticity,
      suspiciousTimelapses
    };
  }

  // Exercise-specific validation methods
  private validateExerciseCompliance(testType: TestType): number {
    const baseCompliance = Math.random() * 30 + 70; // 70-100
    
    // Adjust based on exercise complexity
    const complexityAdjustment: Partial<Record<TestType, number>> = {
      [TestType.TENNIS_STANDING_START]: 0,
      [TestType.FOUR_X_10M_SHUTTLE_RUN]: -5,
      [TestType.MEDICINE_BALL_THROW]: -3,
      [TestType.ENDURANCE_RUN]: -2,
      [TestType.SIT_AND_REACH]: -7,
      [TestType.STANDING_VERTICAL_JUMP]: -10
    };

    return Math.max(0, baseCompliance + (complexityAdjustment[testType] || 0));
  }

  private validateBiomechanics(): number {
    // Simulate biomechanical analysis
    return Math.random() * 25 + 75;
  }

  private assessMovementQuality(testType: TestType): number {
    const baseQuality = Math.random() * 30 + 70;
    
    // Different tests have different quality expectations
    const qualityModifier: Partial<Record<TestType, number>> = {
      [TestType.STANDING_VERTICAL_JUMP]: 10, // Higher precision expected
      [TestType.SIT_AND_REACH]: 8,
      [TestType.FOUR_X_10M_SHUTTLE_RUN]: 5,
      [TestType.MEDICINE_BALL_THROW]: 3,
      [TestType.ENDURANCE_RUN]: 0,
      [TestType.TENNIS_STANDING_START]: -2
    };

    return Math.min(100, baseQuality + (qualityModifier[testType] || 0));
  }

  private detectMovementIssues(testType: TestType): MovementAnalysisResult['detectedIssues'] {
    const issues: MovementAnalysisResult['detectedIssues'] = [];
    
    // Generate test-specific issues based on common problems
    const commonIssues: Partial<Record<TestType, string[]>> = {
      [TestType.TENNIS_STANDING_START]: [
        'incorrect_form', 'inconsistent_physics'
      ],
      [TestType.MEDICINE_BALL_THROW]: [
        'incorrect_form', 'impossible_movement'
      ],
      [TestType.SIT_AND_REACH]: [
        'incorrect_form', 'unnatural_acceleration'
      ],
      [TestType.FOUR_X_10M_SHUTTLE_RUN]: [
        'incorrect_form', 'inconsistent_physics'
      ],
      [TestType.STANDING_VERTICAL_JUMP]: [
        'impossible_movement', 'unnatural_acceleration'
      ],
      [TestType.ENDURANCE_RUN]: [
        'inconsistent_physics', 'unnatural_acceleration'
      ]
    };

    const possibleIssues = commonIssues[testType] || ['incorrect_form'];
    
    if (Math.random() > 0.7) { // 30% chance of issues
      const issueType = possibleIssues[Math.floor(Math.random() * possibleIssues.length)] as any;
      const severity = Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low';
      
      issues.push({
        type: issueType,
        severity,
        timeframe: { start: 5.2, end: 8.7 },
        description: this.getIssueDescription(issueType, testType),
        confidence: Math.random() * 0.3 + 0.7
      });
    }

    return issues;
  }

  private validateDurationAuthenticity(testType: TestType): number {
    // Expected duration ranges for different test types
    const expectedDurations: Partial<Record<TestType, { min: number; max: number }>> = {
      [TestType.TENNIS_STANDING_START]: { min: 5, max: 30 },
      [TestType.FOUR_X_10M_SHUTTLE_RUN]: { min: 15, max: 60 },
      [TestType.MEDICINE_BALL_THROW]: { min: 30, max: 120 },
      [TestType.ENDURANCE_RUN]: { min: 120, max: 600 },
      [TestType.SIT_AND_REACH]: { min: 60, max: 180 },
      [TestType.STANDING_VERTICAL_JUMP]: { min: 30, max: 90 }
    };

    // Simulate duration validation (in real implementation, this would check actual video duration)
    const simulatedDuration = Math.random() * 200 + 10; // 10-210 seconds
    const expected = expectedDurations[testType] || { min: 30, max: 120 };
    
    if (simulatedDuration >= expected.min && simulatedDuration <= expected.max) {
      return Math.random() * 10 + 90; // 90-100
    } else {
      return Math.random() * 40 + 40; // 40-80
    }
  }

  // Scoring and decision making
  private calculateIntegrityScore(results: CheatDetectionResult['detectionResults']): number {
    const weights = {
      videoTampering: 0.25,
      movementAnalysis: 0.30,
      environmentalChecks: 0.15,
      biometricConsistency: 0.20,
      temporalAnalysis: 0.10
    };

    // Calculate component scores
    const videoScore = results.videoTampering.tamperingDetected ? 30 : 95;
    const movementScore = (
      results.movementAnalysis.exerciseCompliance +
      results.movementAnalysis.biomechanicalValidity +
      results.movementAnalysis.movementQuality
    ) / 3;
    const environmentScore = (
      results.environmentalChecks.environmentAuthenticity +
      results.environmentalChecks.lightingConsistency +
      results.environmentalChecks.backgroundAuthenticity +
      results.environmentalChecks.shadowAnalysis
    ) / 4;
    const biometricScore = results.biometricConsistency.identityConfidence;
    const temporalScore = (
      results.temporalAnalysis.speedConsistency +
      results.temporalAnalysis.timestampValidation +
      results.temporalAnalysis.durationAuthenticity
    ) / 3;

    const overallScore = 
      videoScore * weights.videoTampering +
      movementScore * weights.movementAnalysis +
      environmentScore * weights.environmentalChecks +
      biometricScore * weights.biometricConsistency +
      temporalScore * weights.temporalAnalysis;

    return Math.round(overallScore);
  }

  private determineRiskLevel(integrityScore: number): CheatDetectionResult['riskLevel'] {
    if (integrityScore >= this.config.riskThresholds.lowRisk) return 'low';
    if (integrityScore >= this.config.riskThresholds.mediumRisk) return 'medium';
    if (integrityScore >= this.config.riskThresholds.highRisk) return 'high';
    return 'critical';
  }

  private determineRecommendedAction(
    integrityScore: number, 
    riskLevel: CheatDetectionResult['riskLevel'],
    results: CheatDetectionResult['detectionResults']
  ): CheatDetectionResult['recommendedAction'] {
    if (riskLevel === 'critical') return 'reject';
    if (riskLevel === 'high') return 'review';
    if (riskLevel === 'medium') {
      // Check for specific critical issues
      if (results.videoTampering.tamperingDetected || 
          results.biometricConsistency.multiplePersonsDetected) {
        return 'review';
      }
      return 'request_resubmission';
    }
    return 'approve';
  }

  private identifyFlaggedReasons(results: CheatDetectionResult['detectionResults']): string[] {
    const reasons: string[] = [];

    if (results.videoTampering.tamperingDetected) {
      reasons.push(`Video tampering detected: ${results.videoTampering.tamperingType}`);
    }

    if (results.movementAnalysis.exerciseCompliance < 70) {
      reasons.push('Exercise not performed correctly');
    }

    if (results.movementAnalysis.biomechanicalValidity < 60) {
      reasons.push('Biomechanically invalid movements detected');
    }

    if (results.environmentalChecks.suspiciousElements.length > 0) {
      reasons.push(`Environmental anomalies: ${results.environmentalChecks.suspiciousElements.map(e => e.type).join(', ')}`);
    }

    if (results.biometricConsistency.multiplePersonsDetected) {
      reasons.push('Multiple persons detected in video');
    }

    if (results.biometricConsistency.identityConfidence < 70) {
      reasons.push('Identity verification failed');
    }

    if (results.temporalAnalysis.suspiciousTimelapses.length > 0) {
      reasons.push('Temporal manipulation detected');
    }

    return reasons;
  }

  private generateSuggestions(
    results: CheatDetectionResult['detectionResults'],
    action: CheatDetectionResult['recommendedAction']
  ): string[] {
    const suggestions: string[] = [];

    if (action === 'request_resubmission') {
      suggestions.push('Please retake the assessment in a well-lit environment');
      suggestions.push('Ensure the camera captures your full body during the exercise');
      suggestions.push('Follow the exercise instructions carefully');
      
      if (results.environmentalChecks.lightingConsistency < 80) {
        suggestions.push('Improve lighting conditions - avoid backlighting and shadows');
      }
      
      if (results.movementAnalysis.exerciseCompliance < 80) {
        suggestions.push('Review the exercise demonstration video before retaking');
      }
    }

    if (action === 'review') {
      suggestions.push('Manual review recommended by trained assessor');
      suggestions.push('Verify athlete identity using additional documentation');
      suggestions.push('Consider conducting live video assessment');
    }

    if (action === 'reject') {
      suggestions.push('Assessment rejected due to integrity violations');
      suggestions.push('Contact support if you believe this is an error');
    }

    return suggestions;
  }

  private calculateOverallConfidence(results: CheatDetectionResult['detectionResults']): number {
    const confidences = [
      results.videoTampering.confidence,
      results.biometricConsistency.identityConfidence / 100,
      results.movementAnalysis.detectedIssues.reduce((sum, issue) => sum + issue.confidence, 0) / 
        Math.max(1, results.movementAnalysis.detectedIssues.length),
      results.temporalAnalysis.suspiciousTimelapses.reduce((sum, lapse) => sum + lapse.confidence, 0) /
        Math.max(1, results.temporalAnalysis.suspiciousTimelapses.length)
    ].filter(c => !isNaN(c));

    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }

  private getIssueDescription(issueType: string, testType: TestType): string {
    const descriptions: { [key: string]: Partial<{ [key in TestType]: string }> } = {
      incorrect_form: {
        [TestType.TENNIS_STANDING_START]: 'Running form not optimal for maximum speed',
        [TestType.MEDICINE_BALL_THROW]: 'Exercise performed with incorrect technique',
        [TestType.FOUR_X_10M_SHUTTLE_RUN]: 'Movement pattern deviates from expected form',
        [TestType.ENDURANCE_RUN]: 'Pacing and form inconsistent with endurance requirements',
        [TestType.SIT_AND_REACH]: 'Stretching technique not following proper form',
        [TestType.STANDING_VERTICAL_JUMP]: 'Balance position not maintained correctly'
      },
      impossible_movement: {
        [TestType.TENNIS_STANDING_START]: 'Detected physically impossible acceleration',
        [TestType.MEDICINE_BALL_THROW]: 'Strength demonstration exceeds human capabilities',
        [TestType.FOUR_X_10M_SHUTTLE_RUN]: 'Movement speed or direction changes not humanly possible',
        [TestType.ENDURANCE_RUN]: 'Endurance performance inconsistent with human limits',
        [TestType.SIT_AND_REACH]: 'Flexibility range exceeds anatomical possibilities',
        [TestType.STANDING_VERTICAL_JUMP]: 'Balance performance defies physics'
      },
      inconsistent_physics: {
        [TestType.TENNIS_STANDING_START]: 'Speed changes inconsistent with physics',
        [TestType.MEDICINE_BALL_THROW]: 'Force application inconsistent with movement',
        [TestType.FOUR_X_10M_SHUTTLE_RUN]: 'Directional changes violate momentum principles',
        [TestType.ENDURANCE_RUN]: 'Energy expenditure patterns inconsistent',
        [TestType.SIT_AND_REACH]: 'Movement transitions violate biomechanics',
        [TestType.STANDING_VERTICAL_JUMP]: 'Center of gravity shifts impossible'
      },
      unnatural_acceleration: {
        [TestType.TENNIS_STANDING_START]: 'Acceleration pattern appears artificially enhanced',
        [TestType.MEDICINE_BALL_THROW]: 'Movement speed unnatural for strength exercise',
        [TestType.FOUR_X_10M_SHUTTLE_RUN]: 'Acceleration between movements unnaturally fast',
        [TestType.ENDURANCE_RUN]: 'Pacing changes unnaturally abrupt',
        [TestType.SIT_AND_REACH]: 'Transition speed between positions unnatural',
        [TestType.STANDING_VERTICAL_JUMP]: 'Recovery movements unnaturally fast'
      }
    };

    return descriptions[issueType]?.[testType] || 'Movement anomaly detected';
  }

  private getDefaultConfig(): CheatDetectionConfig {
    return {
      videoAnalysis: {
        enableDeepfakeDetection: true,
        enablePixelAnalysis: true,
        enableCompressionAnalysis: true,
        tamperingThreshold: 0.7
      },
      movementAnalysis: {
        enableBiomechanicalValidation: true,
        enablePhysicsValidation: true,
        exerciseComplianceThreshold: 70
      },
      environmentalChecks: {
        enableBackgroundAnalysis: true,
        enableLightingAnalysis: true,
        enableShadowAnalysis: true
      },
      biometricValidation: {
        enableFacialRecognition: true,
        enableGaitAnalysis: true,
        enableVoiceAnalysis: false,
        identityThreshold: 0.8
      },
      riskThresholds: {
        lowRisk: 85,
        mediumRisk: 70,
        highRisk: 55
      }
    };
  }

  // Public configuration methods
  updateConfig(newConfig: Partial<CheatDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): CheatDetectionConfig {
    return { ...this.config };
  }

  // Batch processing for multiple assessments
  async batchAnalyzeAssessments(
    assessments: Array<{ 
      assessment: AssessmentTest; 
      videoFile: File; 
      athlete: Athlete; 
      referenceData?: any 
    }>
  ): Promise<CheatDetectionResult[]> {
    console.log(`🔄 Starting batch analysis of ${assessments.length} assessments...`);
    
    const results: CheatDetectionResult[] = [];
    const batchSize = 5; // Process in smaller batches to avoid overwhelming the system
    
    for (let i = 0; i < assessments.length; i += batchSize) {
      const batch = assessments.slice(i, i + batchSize);
      const batchPromises = batch.map(({ assessment, videoFile, athlete, referenceData }) =>
        this.analyzeAssessment(assessment, videoFile, athlete, referenceData)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add small delay between batches
      if (i + batchSize < assessments.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Batch analysis complete. Processed ${results.length} assessments.`);
    return results;
  }
}

const cheatDetectionService = new CheatDetectionService();
export default cheatDetectionService;
export type { 
  CheatDetectionResult, 
  CheatDetectionConfig,
  VideoTamperingResult,
  MovementAnalysisResult,
  EnvironmentalChecksResult,
  BiometricConsistencyResult,
  TemporalAnalysisResult
};
