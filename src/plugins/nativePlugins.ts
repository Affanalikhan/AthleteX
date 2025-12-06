/**
 * Native Plugin Interfaces for AthleteX Android App
 * 
 * These TypeScript interfaces provide type-safe access to custom Kotlin plugins
 */

import { registerPlugin } from '@capacitor/core';

// ============================================================================
// Assessment Plugin
// ============================================================================

export interface AssessmentPlugin {
  /**
   * Start a new assessment session
   */
  startAssessment(options: {
    type: 'sprint' | 'endurance' | 'strength' | 'agility' | 'flexibility';
  }): Promise<{
    success: boolean;
    assessmentId: string;
    startTime: number;
    type: string;
  }>;

  /**
   * Stop the current assessment
   */
  stopAssessment(): Promise<{
    success: boolean;
    duration: number;
    dataPoints: number;
    endTime: number;
  }>;

  /**
   * Record a performance metric during assessment
   */
  recordMetric(options: {
    metric: string;
    value: number;
  }): Promise<{
    success: boolean;
    recorded: boolean;
    totalDataPoints: number;
  }>;

  /**
   * Calculate assessment score
   */
  calculateScore(options: {
    type: string;
    metrics: {
      time?: number;
      distance?: number;
      reps?: number;
      weight?: number;
      heartRate?: number;
      bodyWeight?: number;
      range?: number;
      maxRange?: number;
      duration?: number;
      accuracy?: number;
    };
  }): Promise<{
    success: boolean;
    score: number;
    grade: string;
    percentile: number;
    assessmentType: string;
  }>;

  /**
   * Detect potential cheating
   */
  detectCheating(options: {
    frames: string[];
    metrics?: {
      speed?: number;
      consistency?: number;
    };
  }): Promise<{
    success: boolean;
    isCheating: boolean;
    confidenceScore: number;
    suspiciousActivities: string[];
    timestamp: number;
  }>;

  /**
   * Get assessment statistics
   */
  getStatistics(): Promise<{
    success: boolean;
    isActive: boolean;
    dataPointsCollected: number;
    duration?: number;
  }>;
}

// ============================================================================
// Performance Plugin
// ============================================================================

export interface PerformancePlugin {
  /**
   * Start tracking performance metrics
   */
  startTracking(): Promise<{
    success: boolean;
    tracking: boolean;
    startTime: number;
  }>;

  /**
   * Stop tracking performance metrics
   */
  stopTracking(): Promise<{
    success: boolean;
    tracking: boolean;
    steps: number;
    distance: number;
    calories: number;
    dataPoints: number;
  }>;

  /**
   * Get current performance metrics
   */
  getMetrics(): Promise<{
    success: boolean;
    isTracking: boolean;
    steps: number;
    distance: number;
    calories: number;
    avgSpeed: number;
    intensity: string;
    pace: number;
    timestamp: number;
  }>;

  /**
   * Analyze performance data
   */
  analyzePerformance(): Promise<{
    success: boolean;
    totalDataPoints: number;
    averageIntensity: number;
    peakIntensity: number;
    consistency: number;
    performanceScore: number;
    recommendations: string[];
  }>;

  /**
   * Calculate calories burned
   */
  calculateCalories(options: {
    weight: number;
    duration: number;
    intensity: 'light' | 'moderate' | 'vigorous' | 'intense';
  }): Promise<{
    success: boolean;
    calories: number;
    met: number;
    intensity: string;
  }>;

  /**
   * Get activity summary
   */
  getActivitySummary(options: {
    duration: number;
  }): Promise<{
    success: boolean;
    steps: number;
    distance: number;
    calories: number;
    duration: number;
    avgPace: number;
    avgSpeed: number;
    intensity: string;
  }>;
}

// ============================================================================
// Video Analysis Plugin
// ============================================================================

export interface VideoAnalysisPlugin {
  /**
   * Analyze a video frame
   */
  analyzeFrame(options: {
    frameData: string;
    frameNumber: number;
  }): Promise<{
    success: boolean;
    frameNumber: number;
    brightness: number;
    contrast: number;
    quality: string;
    timestamp: number;
  }>;

  /**
   * Detect pose keypoints
   */
  detectPose(options: {
    frameData: string;
  }): Promise<{
    success: boolean;
    keypoints: Array<{
      name: string;
      x: number;
      y: number;
      confidence: number;
    }>;
    poseDetected: boolean;
    confidence: number;
  }>;

  /**
   * Analyze exercise form
   */
  analyzeForm(options: {
    exerciseType: 'squat' | 'pushup' | 'plank' | 'lunge';
    keypoints: any[];
  }): Promise<{
    success: boolean;
    exerciseType: string;
    formScore: number;
    feedback: string[];
    corrections: string[];
    grade: string;
  }>;

  /**
   * Track movement across frames
   */
  trackMovement(): Promise<{
    success: boolean;
    framesAnalyzed: number;
    averageMovement: number;
    maxMovement: number;
    smoothness: number;
    consistency: number;
  }>;

  /**
   * Get video analysis summary
   */
  getAnalysisSummary(): Promise<{
    success: boolean;
    totalFrames: number;
    duration: number;
    fps: number;
  }>;

  /**
   * Clear frame buffer
   */
  clearBuffer(): Promise<{
    success: boolean;
    cleared: boolean;
  }>;
}

// ============================================================================
// Biometrics Plugin
// ============================================================================

export interface BiometricsPlugin {
  /**
   * Check if biometric authentication is available
   */
  isAvailable(): Promise<{
    success: boolean;
    available: boolean;
    type: 'fingerprint' | 'face' | 'none';
  }>;

  /**
   * Authenticate using biometrics
   */
  authenticate(options?: {
    title?: string;
    subtitle?: string;
    description?: string;
  }): Promise<{
    success: boolean;
    authenticated: boolean;
    timestamp: number;
  }>;

  /**
   * Cancel ongoing authentication
   */
  cancelAuthentication(): Promise<{
    success: boolean;
    cancelled: boolean;
  }>;
}

// ============================================================================
// Register Plugins
// ============================================================================

export const Assessment = registerPlugin<AssessmentPlugin>('Assessment');
export const Performance = registerPlugin<PerformancePlugin>('Performance');
export const VideoAnalysis = registerPlugin<VideoAnalysisPlugin>('VideoAnalysis');
export const Biometrics = registerPlugin<BiometricsPlugin>('Biometrics');

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Start an assessment
 * 
 * ```typescript
 * import { Assessment } from './plugins/nativePlugins';
 * 
 * const result = await Assessment.startAssessment({ type: 'sprint' });
 * console.log('Assessment started:', result.assessmentId);
 * ```
 */

/**
 * Example: Track performance
 * 
 * ```typescript
 * import { Performance } from './plugins/nativePlugins';
 * 
 * await Performance.startTracking();
 * // ... do workout ...
 * const metrics = await Performance.getMetrics();
 * console.log('Steps:', metrics.steps);
 * ```
 */

/**
 * Example: Analyze video frame
 * 
 * ```typescript
 * import { VideoAnalysis } from './plugins/nativePlugins';
 * 
 * const result = await VideoAnalysis.analyzeFrame({
 *   frameData: base64ImageData,
 *   frameNumber: 1
 * });
 * console.log('Frame quality:', result.quality);
 * ```
 */

/**
 * Example: Biometric authentication
 * 
 * ```typescript
 * import { Biometrics } from './plugins/nativePlugins';
 * 
 * const available = await Biometrics.isAvailable();
 * if (available.available) {
 *   const result = await Biometrics.authenticate({
 *     title: 'Login to AthleteX',
 *     subtitle: 'Use your fingerprint'
 *   });
 *   if (result.authenticated) {
 *     // User authenticated successfully
 *   }
 * }
 * ```
 */
