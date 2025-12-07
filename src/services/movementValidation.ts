/**
 * Movement Validation Service
 * Validates that the correct movement is being performed for each test type
 */

import { TestType } from '../models';

export interface ValidationResult {
  isValid: boolean;
  errorType?: 'NO_FULL_BODY' | 'NO_MOVEMENT' | 'WRONG_MOVEMENT' | 'INSUFFICIENT_QUALITY';
  errorMessage?: string;
  confidence: number;
  details: {
    fullBodyDetected: boolean;
    movementDetected: boolean;
    movementType?: string;
    landmarkVisibility: Record<string, number>;
    movementMetrics: {
      verticalDisplacement?: number;
      horizontalDisplacement?: number;
      angleChange?: number;
      movementPattern?: string;
    };
  };
}

export interface MovementFeatures {
  verticalRange: number;
  horizontalRange: number;
  torsoAngleChange: number;
  hipMovement: number;
  kneeFlexion: number;
  armExtension: number;
  movementFrequency: number;
  movementPattern: 'vertical' | 'horizontal' | 'flexion' | 'rotation' | 'static' | 'unknown';
}

// Essential landmarks that MUST be visible for full-body detection
const ESSENTIAL_LANDMARKS = {
  HIPS: [23, 24],
  KNEES: [25, 26],
  ANKLES: [27, 28],
  SHOULDERS: [11, 12],
  ELBOWS: [13, 14],
  WRISTS: [15, 16]
};

// Minimum visibility threshold
const MIN_VISIBILITY = 0.5;

// Minimum movement thresholds for each test type
const MOVEMENT_THRESHOLDS = {
  [TestType.SIT_UPS]: {
    minAngleChange: 20, // degrees
    minReps: 1,
    movementType: 'flexion'
  },
  [TestType.STANDING_VERTICAL_JUMP]: {
    minVerticalDisplacement: 0.1, // 10% of frame height
    minReps: 1,
    movementType: 'vertical'
  },
  [TestType.STANDING_BROAD_JUMP]: {
    minHorizontalDisplacement: 0.15, // 15% of frame width
    minReps: 1,
    movementType: 'horizontal'
  },
  [TestType.FOUR_X_10M_SHUTTLE_RUN]: {
    minHorizontalDisplacement: 0.2,
    minDirectionChanges: 2,
    movementType: 'horizontal'
  },
  [TestType.MEDICINE_BALL_THROW]: {
    minArmExtension: 30, // degrees
    minReps: 1,
    movementType: 'rotation'
  },
  [TestType.ENDURANCE_RUN]: {
    minHorizontalDisplacement: 0.1,
    minDuration: 5, // seconds
    movementType: 'horizontal'
  },
  [TestType.TENNIS_STANDING_START]: {
    minHorizontalDisplacement: 0.2,
    minDuration: 1,
    movementType: 'horizontal'
  },
  [TestType.SIT_AND_REACH]: {
    minAngleChange: 15,
    minReps: 1,
    movementType: 'flexion'
  }
};

class MovementValidationService {
  /**
   * Validate full-body detection
   * Checks if all essential landmarks are visible with sufficient confidence
   */
  validateFullBody(landmarks: any[]): { isValid: boolean; missingParts: string[]; visibility: Record<string, number> } {
    if (!landmarks || landmarks.length < 33) {
      return {
        isValid: false,
        missingParts: ['All body parts'],
        visibility: {}
      };
    }

    const missingParts: string[] = [];
    const visibility: Record<string, number> = {};

    // Check each essential landmark group
    for (const [partName, indices] of Object.entries(ESSENTIAL_LANDMARKS)) {
      const visibilities = indices.map(idx => landmarks[idx]?.visibility || 0);
      const avgVisibility = visibilities.reduce((a, b) => a + b, 0) / visibilities.length;
      
      visibility[partName] = avgVisibility;

      if (avgVisibility < MIN_VISIBILITY) {
        missingParts.push(partName.toLowerCase());
      }
    }

    return {
      isValid: missingParts.length === 0,
      missingParts,
      visibility
    };
  }

  /**
   * Calculate angle between three points
   */
  private calculateAngle(a: any, b: any, c: any): number {
    if (!a || !b || !c) return 0;
    
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let degrees = Math.abs(radians * (180 / Math.PI));
    return degrees > 180 ? 360 - degrees : degrees;
  }

  /**
   * Extract movement features from pose landmarks over time
   */
  extractMovementFeatures(landmarkHistory: any[][]): MovementFeatures {
    if (landmarkHistory.length < 2) {
      return {
        verticalRange: 0,
        horizontalRange: 0,
        torsoAngleChange: 0,
        hipMovement: 0,
        kneeFlexion: 0,
        armExtension: 0,
        movementFrequency: 0,
        movementPattern: 'static'
      };
    }

    // Calculate vertical displacement (hip Y-position range)
    const hipYPositions = landmarkHistory.map(landmarks => 
      (landmarks[23]?.y + landmarks[24]?.y) / 2
    ).filter(y => y !== undefined);
    const verticalRange = Math.max(...hipYPositions) - Math.min(...hipYPositions);

    // Calculate horizontal displacement (hip X-position range)
    const hipXPositions = landmarkHistory.map(landmarks => 
      (landmarks[23]?.x + landmarks[24]?.x) / 2
    ).filter(x => x !== undefined);
    const horizontalRange = Math.max(...hipXPositions) - Math.min(...hipXPositions);

    // Calculate torso angle changes (shoulder-hip-knee angle)
    const torsoAngles = landmarkHistory.map(landmarks => {
      if (!landmarks[11] || !landmarks[23] || !landmarks[25]) return null;
      return this.calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
    }).filter(angle => angle !== null) as number[];
    
    const torsoAngleChange = torsoAngles.length > 0 
      ? Math.max(...torsoAngles) - Math.min(...torsoAngles)
      : 0;

    // Calculate hip movement
    const hipMovement = Math.sqrt(verticalRange ** 2 + horizontalRange ** 2);

    // Calculate knee flexion range
    const kneeAngles = landmarkHistory.map(landmarks => {
      if (!landmarks[23] || !landmarks[25] || !landmarks[27]) return null;
      return this.calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
    }).filter(angle => angle !== null) as number[];
    
    const kneeFlexion = kneeAngles.length > 0
      ? Math.max(...kneeAngles) - Math.min(...kneeAngles)
      : 0;

    // Calculate arm extension range
    const elbowAngles = landmarkHistory.map(landmarks => {
      if (!landmarks[11] || !landmarks[13] || !landmarks[15]) return null;
      return this.calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
    }).filter(angle => angle !== null) as number[];
    
    const armExtension = elbowAngles.length > 0
      ? Math.max(...elbowAngles) - Math.min(...elbowAngles)
      : 0;

    // Determine movement pattern
    let movementPattern: MovementFeatures['movementPattern'] = 'static';
    if (verticalRange > 0.1) movementPattern = 'vertical';
    else if (horizontalRange > 0.1) movementPattern = 'horizontal';
    else if (torsoAngleChange > 20) movementPattern = 'flexion';
    else if (armExtension > 30) movementPattern = 'rotation';

    // Calculate movement frequency (peaks in hip Y-position)
    const movementFrequency = this.calculateMovementFrequency(hipYPositions);

    return {
      verticalRange,
      horizontalRange,
      torsoAngleChange,
      hipMovement,
      kneeFlexion,
      armExtension,
      movementFrequency,
      movementPattern
    };
  }

  /**
   * Calculate movement frequency by detecting peaks
   */
  private calculateMovementFrequency(values: number[]): number {
    if (values.length < 3) return 0;

    let peaks = 0;
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        peaks++;
      }
    }

    return peaks;
  }

  /**
   * Validate movement for specific test type
   */
  validateMovement(
    testType: TestType,
    landmarkHistory: any[][],
    duration: number
  ): ValidationResult {
    console.log(`🔍 Validating movement for ${testType}...`);

    // Step 1: Validate full-body detection
    const latestLandmarks = landmarkHistory[landmarkHistory.length - 1];
    const fullBodyCheck = this.validateFullBody(latestLandmarks);

    if (!fullBodyCheck.isValid) {
      console.log('❌ Full body not detected:', fullBodyCheck.missingParts);
      return {
        isValid: false,
        errorType: 'NO_FULL_BODY',
        errorMessage: `Invalid video: Full body not visible. Missing: ${fullBodyCheck.missingParts.join(', ')}`,
        confidence: 0,
        details: {
          fullBodyDetected: false,
          movementDetected: false,
          landmarkVisibility: fullBodyCheck.visibility,
          movementMetrics: {}
        }
      };
    }

    console.log('✅ Full body detected');

    // Step 2: Extract movement features
    const features = this.extractMovementFeatures(landmarkHistory);
    console.log('📊 Movement features:', features);

    // Step 3: Validate movement based on test type
    const threshold = MOVEMENT_THRESHOLDS[testType as keyof typeof MOVEMENT_THRESHOLDS];
    if (!threshold) {
      console.log('⚠️ No threshold defined for test type');
      return {
        isValid: true,
        confidence: 0.5,
        details: {
          fullBodyDetected: true,
          movementDetected: true,
          movementType: features.movementPattern,
          landmarkVisibility: fullBodyCheck.visibility,
          movementMetrics: {
            verticalDisplacement: features.verticalRange,
            horizontalDisplacement: features.horizontalRange,
            angleChange: features.torsoAngleChange
          }
        }
      };
    }

    // Check movement based on test type
    let movementDetected = false;
    let confidence = 0;

    switch (testType) {
      case TestType.SIT_UPS:
        movementDetected = features.torsoAngleChange >= ((threshold as any).minAngleChange || 20);
        confidence = Math.min(1, features.torsoAngleChange / 40);
        break;

      case TestType.STANDING_VERTICAL_JUMP:
        movementDetected = features.verticalRange >= ((threshold as any).minVerticalDisplacement || 0.1);
        confidence = Math.min(1, features.verticalRange / 0.2);
        break;

      case TestType.STANDING_BROAD_JUMP:
        movementDetected = features.horizontalRange >= ((threshold as any).minHorizontalDisplacement || 0.15);
        confidence = Math.min(1, features.horizontalRange / 0.3);
        break;

      case TestType.FOUR_X_10M_SHUTTLE_RUN:
        movementDetected = features.horizontalRange >= ((threshold as any).minHorizontalDisplacement || 0.2) &&
                          features.movementFrequency >= ((threshold as any).minDirectionChanges || 2);
        confidence = Math.min(1, (features.horizontalRange + features.movementFrequency * 0.1) / 0.4);
        break;

      case TestType.MEDICINE_BALL_THROW:
        movementDetected = features.armExtension >= ((threshold as any).minArmExtension || 30);
        confidence = Math.min(1, features.armExtension / 60);
        break;

      case TestType.ENDURANCE_RUN:
      case TestType.TENNIS_STANDING_START:
        movementDetected = features.horizontalRange >= ((threshold as any).minHorizontalDisplacement || 0.1) &&
                          duration >= ((threshold as any).minDuration || 1);
        confidence = Math.min(1, features.horizontalRange / 0.3);
        break;

      case TestType.SIT_AND_REACH:
        movementDetected = features.torsoAngleChange >= ((threshold as any).minAngleChange || 15);
        confidence = Math.min(1, features.torsoAngleChange / 30);
        break;

      default:
        movementDetected = features.hipMovement > 0.05;
        confidence = 0.5;
    }

    if (!movementDetected) {
      console.log('❌ Required movement not detected');
      return {
        isValid: false,
        errorType: 'NO_MOVEMENT',
        errorMessage: `Required movement not detected for ${testType}. Please perform the exercise correctly.`,
        confidence: confidence,
        details: {
          fullBodyDetected: true,
          movementDetected: false,
          movementType: features.movementPattern,
          landmarkVisibility: fullBodyCheck.visibility,
          movementMetrics: {
            verticalDisplacement: features.verticalRange,
            horizontalDisplacement: features.horizontalRange,
            angleChange: features.torsoAngleChange,
            movementPattern: features.movementPattern
          }
        }
      };
    }

    console.log('✅ Movement validated successfully');

    return {
      isValid: true,
      confidence: confidence,
      details: {
        fullBodyDetected: true,
        movementDetected: true,
        movementType: features.movementPattern,
        landmarkVisibility: fullBodyCheck.visibility,
        movementMetrics: {
          verticalDisplacement: features.verticalRange,
          horizontalDisplacement: features.horizontalRange,
          angleChange: features.torsoAngleChange,
          movementPattern: features.movementPattern
        }
      }
    };
  }
}

const movementValidationService = new MovementValidationService();
export default movementValidationService;
