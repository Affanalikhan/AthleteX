/**
 * Test Type Classifier
 * Classifies the type of exercise being performed based on movement patterns
 */

import { TestType } from '../models';
import { MovementFeatures } from './movementValidation';

export type DetectedTestType = 
  | 'vertical_jump'
  | 'broad_jump'
  | 'situp'
  | 'medicine_throw'
  | 'run'
  | 'shuttle_run'
  | 'sit_and_reach'
  | 'unknown';

export interface ClassificationResult {
  detectedType: DetectedTestType;
  confidence: number;
  alternativeTypes: Array<{ type: DetectedTestType; confidence: number }>;
  matchesSelected: boolean;
}

class TestTypeClassifier {
  /**
   * Classify the test type based on movement features
   */
  classify(features: MovementFeatures, selectedTestType: TestType): ClassificationResult {
    console.log('🎯 Classifying test type from movement features...');
    console.log('Movement pattern:', features.movementPattern);
    console.log('Vertical range:', features.verticalRange);
    console.log('Horizontal range:', features.horizontalRange);
    console.log('Torso angle change:', features.torsoAngleChange);

    const scores: Record<DetectedTestType, number> = {
      vertical_jump: 0,
      broad_jump: 0,
      situp: 0,
      medicine_throw: 0,
      run: 0,
      shuttle_run: 0,
      sit_and_reach: 0,
      unknown: 0
    };

    // Vertical Jump: High vertical displacement, low horizontal
    if (features.movementPattern === 'vertical' || features.verticalRange > 0.15) {
      scores.vertical_jump = features.verticalRange * 5;
      if (features.horizontalRange < 0.1) {
        scores.vertical_jump += 0.3;
      }
    }

    // Broad Jump: High horizontal displacement, some vertical
    if (features.movementPattern === 'horizontal' && features.verticalRange > 0.05) {
      scores.broad_jump = features.horizontalRange * 3;
      if (features.verticalRange > 0.05 && features.verticalRange < 0.15) {
        scores.broad_jump += 0.2;
      }
    }

    // Sit-ups: Torso flexion, low hip movement
    if (features.movementPattern === 'flexion' || features.torsoAngleChange > 20) {
      scores.situp = (features.torsoAngleChange / 40) * 0.8;
      if (features.hipMovement < 0.1) {
        scores.situp += 0.2;
      }
      if (features.movementFrequency > 2) {
        scores.situp += 0.1;
      }
    }

    // Medicine Ball Throw: Arm extension, rotation
    if (features.movementPattern === 'rotation' || features.armExtension > 30) {
      scores.medicine_throw = (features.armExtension / 60) * 0.7;
      if (features.torsoAngleChange > 15) {
        scores.medicine_throw += 0.2;
      }
    }

    // Running: Continuous horizontal movement
    if (features.movementPattern === 'horizontal' && features.horizontalRange > 0.15) {
      scores.run = features.horizontalRange * 2;
      if (features.movementFrequency > 3) {
        scores.run += 0.3; // Continuous movement
      }
    }

    // Shuttle Run: Horizontal movement with direction changes
    if (features.movementPattern === 'horizontal' && features.movementFrequency > 2) {
      scores.shuttle_run = (features.horizontalRange * 2) + (features.movementFrequency * 0.1);
    }

    // Sit and Reach: Forward flexion, static position
    if (features.movementPattern === 'flexion' && features.movementFrequency < 2) {
      scores.sit_and_reach = (features.torsoAngleChange / 30) * 0.6;
      if (features.hipMovement < 0.05) {
        scores.sit_and_reach += 0.3;
      }
    }

    // Find the highest scoring type
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b - a);

    const detectedType = sortedScores[0][0] as DetectedTestType;
    const confidence = Math.min(1, sortedScores[0][1]);

    // Get alternative types
    const alternativeTypes = sortedScores
      .slice(1, 4)
      .filter(([, score]) => score > 0.1)
      .map(([type, score]) => ({
        type: type as DetectedTestType,
        confidence: Math.min(1, score)
      }));

    // Check if detected type matches selected type
    const matchesSelected = this.matchesSelectedType(detectedType, selectedTestType);

    console.log('🎯 Classification result:', {
      detectedType,
      confidence,
      matchesSelected,
      selectedTestType
    });

    return {
      detectedType,
      confidence,
      alternativeTypes,
      matchesSelected
    };
  }

  /**
   * Check if detected type matches the selected test type
   */
  private matchesSelectedType(detected: DetectedTestType, selected: TestType): boolean {
    const mapping: Record<DetectedTestType, TestType[]> = {
      vertical_jump: [TestType.STANDING_VERTICAL_JUMP],
      broad_jump: [TestType.STANDING_BROAD_JUMP],
      situp: [TestType.SIT_UPS],
      medicine_throw: [TestType.MEDICINE_BALL_THROW],
      run: [TestType.ENDURANCE_RUN, TestType.TENNIS_STANDING_START],
      shuttle_run: [TestType.FOUR_X_10M_SHUTTLE_RUN],
      sit_and_reach: [TestType.SIT_AND_REACH],
      unknown: []
    };

    return mapping[detected]?.includes(selected) || false;
  }

  /**
   * Get human-readable name for detected type
   */
  getTypeName(type: DetectedTestType): string {
    const names: Record<DetectedTestType, string> = {
      vertical_jump: 'Vertical Jump',
      broad_jump: 'Broad Jump',
      situp: 'Sit-ups',
      medicine_throw: 'Medicine Ball Throw',
      run: 'Running',
      shuttle_run: 'Shuttle Run',
      sit_and_reach: 'Sit and Reach',
      unknown: 'Unknown Exercise'
    };

    return names[type] || 'Unknown';
  }
}

const testTypeClassifier = new TestTypeClassifier();
export default testTypeClassifier;
