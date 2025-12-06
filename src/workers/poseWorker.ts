/* eslint-disable no-restricted-globals */
// Web Worker for offloading heavy pose analysis computations

// Web Worker for pose analysis - no imports needed for worker context

// Helper function to calculate angle between three points
function calculateAngle(a: any, b: any, c: any): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs(radians * (180 / Math.PI));
  return degrees > 180 ? 360 - degrees : degrees;
}

// Analyze pushup form
function analyzePushup(landmarks: any, previousAnalysis: any) {
  const analysis: any = {
    reps: previousAnalysis?.reps || 0,
    formScore: 0,
    feedback: [],
    wasDown: previousAnalysis?.wasDown || false
  };

  try {
    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(
      landmarks[11], // Left shoulder
      landmarks[13], // Left elbow
      landmarks[15]  // Left wrist
    );
    
    const rightElbowAngle = calculateAngle(
      landmarks[12], // Right shoulder
      landmarks[14], // Right elbow
      landmarks[16]  // Right wrist
    );

    // Calculate shoulder angles
    const leftShoulderAngle = calculateAngle(
      landmarks[13], // Left elbow
      landmarks[11], // Left shoulder
      landmarks[23]  // Left hip
    );
    
    const rightShoulderAngle = calculateAngle(
      landmarks[14], // Right elbow
      landmarks[12], // Right shoulder
      landmarks[24]  // Right hip
    );

    // Calculate hip angles
    const leftHipAngle = calculateAngle(
      landmarks[11], // Left shoulder
      landmarks[23], // Left hip
      landmarks[25]  // Left knee
    );
    
    const rightHipAngle = calculateAngle(
      landmarks[12], // Right shoulder
      landmarks[24], // Right hip
      landmarks[26]  // Right knee
    );

    // Count reps
    if (leftElbowAngle > 160 && rightElbowAngle > 160) {
      if (analysis.wasDown) {
        analysis.reps++;
        analysis.wasDown = false;
        analysis.feedback.push({
          message: 'Good rep!',
          severity: 'success'
        });
      }
    } else if (leftElbowAngle < 90 && rightElbowAngle < 90) {
      analysis.wasDown = true;
    }

    // Form feedback
    const elbowAngleDiff = Math.abs(leftElbowAngle - rightElbowAngle);
    if (elbowAngleDiff > 15) {
      analysis.feedback.push({
        message: 'Keep your elbows at the same angle',
        severity: 'warning'
      });
    }

    // Check for back arching
    if (leftHipAngle < 150 || rightHipAngle < 150) {
      analysis.feedback.push({
        message: 'Keep your back straight',
        severity: 'error'
      });
    }

    // Check shoulder position
    if (leftShoulderAngle < 20 || rightShoulderAngle < 20) {
      analysis.feedback.push({
        message: 'Keep your shoulders engaged',
        severity: 'warning'
      });
    }

    // Calculate form score (0-100)
    const elbowScore = 100 - (Math.abs(leftElbowAngle - 90) / 90 * 50);
    const symmetryScore = 100 - (elbowAngleDiff * 2);
    const hipScore = Math.min(100, (Math.min(leftHipAngle, rightHipAngle) / 180) * 100);
    
    analysis.formScore = Math.max(0, Math.min(100, 
      (elbowScore * 0.4) + (symmetryScore * 0.3) + (hipScore * 0.3)
    ));

  } catch (error) {
    console.error('Error in pushup analysis:', error);
  }

  return analysis;
}

// Analyze squat form
function analyzeSquat(landmarks: any, previousAnalysis: any) {
  const analysis: any = {
    reps: previousAnalysis?.reps || 0,
    formScore: 0,
    feedback: [],
    wasDown: previousAnalysis?.wasDown || false
  };

  try {
    // Calculate knee angles
    const leftKneeAngle = calculateAngle(
      landmarks[23], // Left hip
      landmarks[25], // Left knee
      landmarks[27]  // Left ankle
    );
    
    const rightKneeAngle = calculateAngle(
      landmarks[24], // Right hip
      landmarks[26], // Right knee
      landmarks[28]  // Right ankle
    );

    // Calculate hip angles
    const leftHipAngle = calculateAngle(
      landmarks[11], // Left shoulder
      landmarks[23], // Left hip
      landmarks[25]  // Left knee
    );
    
    const rightHipAngle = calculateAngle(
      landmarks[12], // Right shoulder
      landmarks[24], // Right hip
      landmarks[26]  // Right knee
    );

    // Count reps (simplified - would need more sophisticated logic)
    const isDownPosition = leftKneeAngle < 100 && rightKneeAngle < 100;
    if (isDownPosition && !analysis.wasDown) {
      analysis.wasDown = true;
    } else if (!isDownPosition && analysis.wasDown) {
      analysis.reps++;
      analysis.wasDown = false;
      analysis.feedback.push({
        message: 'Good rep!',
        severity: 'success'
      });
    }

    // Form feedback
    const kneeAngleDiff = Math.abs(leftKneeAngle - rightKneeAngle);
    if (kneeAngleDiff > 10) {
      analysis.feedback.push({
        message: 'Keep your knees aligned',
        severity: 'warning'
      });
    }

    // Check knee position relative to toes
    const leftKneeToeAlignment = landmarks[25].x - landmarks[27].x;
    const rightKneeToeAlignment = landmarks[26].x - landmarks[28].x;
    
    if (Math.abs(leftKneeToeAlignment) > 0.1 || Math.abs(rightKneeToeAlignment) > 0.1) {
      analysis.feedback.push({
        message: 'Keep your knees behind your toes',
        severity: 'error'
      });
    }

    // Check back position
    const backAngle = calculateAngle(
      landmarks[11], // Left shoulder
      landmarks[23], // Left hip
      landmarks[25]  // Left knee
    );
    
    if (backAngle < 150) {
      analysis.feedback.push({
        message: 'Keep your chest up and back straight',
        severity: 'warning'
      });
    }

    // Calculate form score (0-100)
    const kneeScore = 100 - (Math.abs(leftKneeAngle - 90) / 90 * 50);
    const symmetryScore = 100 - (kneeAngleDiff * 3);
    const backScore = Math.min(100, (backAngle / 180) * 100);
    
    analysis.formScore = Math.max(0, Math.min(100, 
      (kneeScore * 0.5) + (symmetryScore * 0.3) + (backScore * 0.2)
    ));

  } catch (error) {
    console.error('Error in squat analysis:', error);
  }

  return analysis;
}

// Analyze pull-up form
function analyzePullup(landmarks: any, previousAnalysis: any) {
  const analysis: any = {
    reps: previousAnalysis?.reps || 0,
    formScore: 0,
    feedback: [],
    wasDown: previousAnalysis?.wasDown || false
  };

  try {
    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(
      landmarks[11], // Left shoulder
      landmarks[13], // Left elbow
      landmarks[15]  // Left wrist
    );
    
    const rightElbowAngle = calculateAngle(
      landmarks[12], // Right shoulder
      landmarks[14], // Right elbow
      landmarks[16]  // Right wrist
    );

    // Calculate shoulder angles
    const leftShoulderAngle = calculateAngle(
      landmarks[13], // Left elbow
      landmarks[11], // Left shoulder
      landmarks[23]  // Left hip
    );
    
    const rightShoulderAngle = calculateAngle(
      landmarks[14], // Right elbow
      landmarks[12], // Right shoulder
      landmarks[24]  // Right hip
    );

    // Count reps (simplified)
    if (leftElbowAngle > 160 && rightElbowAngle > 160) {
      if (analysis.wasDown) {
        analysis.reps++;
        analysis.wasDown = false;
        analysis.feedback.push({
          message: 'Good rep!',
          severity: 'success'
        });
      }
    } else if (leftElbowAngle < 60 && rightElbowAngle < 60) {
      analysis.wasDown = true;
    }

    // Form feedback
    const elbowAngleDiff = Math.abs(leftElbowAngle - rightElbowAngle);
    if (elbowAngleDiff > 15) {
      analysis.feedback.push({
        message: 'Keep your elbows moving symmetrically',
        severity: 'warning'
      });
    }

    // Check for kipping (excessive body movement)
    const shoulderMovement = Math.abs(
      (landmarks[11].y + landmarks[12].y) / 2 - 
      (landmarks[23].y + landmarks[24].y) / 2
    );
    
    if (shoulderMovement > 0.2) {
      analysis.feedback.push({
        message: 'Avoid swinging - control the movement',
        severity: 'warning'
      });
    }

    // Check full range of motion
    const rangeOfMotion = Math.min(leftElbowAngle, rightElbowAngle);
    if (rangeOfMotion > 120) {
      analysis.feedback.push({
        message: 'Go all the way down for full range of motion',
        severity: 'warning'
      });
    }

    // Calculate form score (0-100)
    const elbowScore = 100 - (Math.abs(leftElbowAngle - 90) / 90 * 50);
    const symmetryScore = 100 - (elbowAngleDiff * 2);
    const romScore = (rangeOfMotion / 180) * 100;
    
    analysis.formScore = Math.max(0, Math.min(100, 
      (elbowScore * 0.4) + (symmetryScore * 0.3) + (romScore * 0.3)
    ));

  } catch (error) {
    console.error('Error in pull-up analysis:', error);
  }

  return analysis;
}

// Main message handler
const workerSelf = self as any;

workerSelf.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;
  
  if (type === 'ANALYZE_FRAME') {
    const { landmarks, exerciseType, previousAnalysis } = data;
    let analysis;

    // Route to appropriate analysis function based on exercise type
    switch (exerciseType.toLowerCase()) {
      case 'pushup':
      case 'push-ups':
      case 'push ups':
        analysis = analyzePushup(landmarks, previousAnalysis);
        break;
      case 'squat':
      case 'squats':
        analysis = analyzeSquat(landmarks, previousAnalysis);
        break;
      case 'pullup':
      case 'pull-up':
      case 'pull up':
      case 'pullups':
      case 'pull-ups':
      case 'pull ups':
        analysis = analyzePullup(landmarks, previousAnalysis);
        break;
      default:
        // Default analysis for unknown exercise types
        analysis = {
          reps: 0,
          formScore: 0,
          feedback: [{ message: 'Exercise analysis not available', severity: 'info' }]
        };
    }

    // Send the analysis back to the main thread
    workerSelf.postMessage({
      type: 'ANALYSIS_RESULT',
      data: analysis
    });
  }
};

// Export for TypeScript type checking
export {};
