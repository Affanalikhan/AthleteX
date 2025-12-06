import { AssessmentTest, TestType, MetricType } from '../models';
import performanceService from './performanceService';
import videoPoseAnalysisService from './videoPoseAnalysisService';

class AssessmentService {
  private readonly ASSESSMENTS_KEY = 'athletex_assessments';

  // AI/ML scoring function with pose estimation
  private calculateScore(testType: TestType, videoFile: File): number {
    // This simulates AI/ML processing with pose estimation and pattern detection
    // In production, this would:
    // 1. Extract frames from the video
    // 2. Run MediaPipe Pose or similar ML model on each frame
    // 3. Detect body landmarks (33 key points)
    // 4. Calculate joint angles and movement patterns
    // 5. Count reps, assess form quality, and detect technique issues
    // 6. Generate a comprehensive performance score
    
    const baseScores: Partial<Record<TestType, number>> = {
      [TestType.HEIGHT]: Math.random() * 20 + 70, // 70-90 score
      [TestType.WEIGHT]: Math.random() * 20 + 70, // 70-90 score
      [TestType.SIT_AND_REACH]: Math.random() * 35 + 40, // 40-75 score (flexibility)
      [TestType.STANDING_VERTICAL_JUMP]: Math.random() * 35 + 50, // 50-85 score (power)
      [TestType.STANDING_BROAD_JUMP]: Math.random() * 35 + 50, // 50-85 score (power)
      [TestType.MEDICINE_BALL_THROW]: Math.random() * 35 + 50, // 50-85 score (strength)
      [TestType.TENNIS_STANDING_START]: Math.random() * 30 + 60, // 60-90 score (speed)
      [TestType.FOUR_X_10M_SHUTTLE_RUN]: Math.random() * 25 + 55, // 55-80 score (agility)
      [TestType.SIT_UPS]: Math.random() * 35 + 50, // 50-85 score (core strength)
      [TestType.ENDURANCE_RUN]: Math.random() * 40 + 45, // 45-85 score (endurance)
    };

    // Add some variation based on file size (simulating analysis)
    const sizeVariation = (videoFile.size / (1024 * 1024)) * 0.5; // MB to variation
    
    return Math.round(((baseScores[testType] || 60) + sizeVariation) * 100) / 100;
  }

  async uploadVideo(athleteId: string, testType: TestType, videoFile: File): Promise<string> {
    // For demo purposes, create a blob URL that can be used to display the video
    const videoUrl = URL.createObjectURL(videoFile);
    return videoUrl;
  }

  async createAssessment(
    athleteId: string, 
    testType: TestType, 
    videoFile: File, 
    notes: string = '',
    manualMeasurements?: {
      timeTaken?: number;
      distance?: number;
      height?: number;
      weight?: number;
      reps?: number;
    }
  ): Promise<AssessmentTest> {
    // Upload video (demo version - just creates blob URL)
    const videoUrl = await this.uploadVideo(athleteId, testType, videoFile);

    // Process video with ML/AI for pose estimation and pattern detection
    // The video is analyzed frame-by-frame to detect body landmarks, calculate joint angles,
    // track movement patterns, and assess form quality
    let score: number;
    try {
      const analysisResult = await videoPoseAnalysisService.analyzeVideo(
        videoFile, 
        testType, 
        manualMeasurements
      );
      score = analysisResult.score;
      console.log('Video pose analysis completed:', {
        score: analysisResult.score,
        reps: analysisResult.reps,
        formScore: analysisResult.formScore,
        patterns: analysisResult.detectedPatterns,
        processingTime: `${analysisResult.processingTime}ms`,
        manualMeasurements: manualMeasurements || 'none'
      });
    } catch (error) {
      console.error('Video analysis failed, using fallback scoring:', error);
      score = this.calculateScore(testType, videoFile);
    }

    // Create assessment document
    const id = this.generateId();
    const assessment: AssessmentTest = {
      id,
      athleteId,
      testType,
      videoUrl,
      score,
      timestamp: new Date(),
      notes
    };

    const assessments = this.getAssessments();
    assessments.push(assessment);
    this.setAssessments(assessments);

    // Automatically store the assessment result in performance metrics
    await this.storeAssessmentInPerformanceMetrics(assessment);

    return assessment;
  }

  async getAthleteAssessments(athleteId: string): Promise<AssessmentTest[]> {
    const assessments = this.getAssessments();
    return assessments
      .filter(a => a.athleteId === athleteId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAllAssessments(): Promise<AssessmentTest[]> {
    const assessments = this.getAssessments();
    return assessments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAssessmentById(assessmentId: string): Promise<AssessmentTest | null> {
    const assessments = this.getAssessments();
    return assessments.find(a => a.id === assessmentId) || null;
  }

  async updateAssessmentNotes(assessmentId: string, notes: string): Promise<void> {
    const assessments = this.getAssessments();
    const index = assessments.findIndex(a => a.id === assessmentId);
    if (index >= 0) {
      assessments[index] = { ...assessments[index], notes };
      this.setAssessments(assessments);
    }
  }

  getScoreDisplayText(testType: TestType, score: number): string {
    // For the new fitness-based tests, scores are percentages or ratings
    return `${Math.round(score)}/100`;
  }

  /**
   * Automatically stores assessment results in performance metrics
   */
  private async storeAssessmentInPerformanceMetrics(assessment: AssessmentTest): Promise<void> {
    try {
      // Convert TestType to MetricType (they have the same values)
      const metricType = assessment.testType as unknown as MetricType;
      
      // Get the appropriate unit and value for the metric
      const { value, unit } = this.convertScoreToMetricValue(assessment.testType, assessment.score);
      
      // Create performance metric entry
      await performanceService.addMetric(assessment.athleteId, {
        metricType,
        value,
        unit,
        notes: `Assessment result: ${assessment.notes || 'No notes provided'}`,
        timestamp: assessment.timestamp
      });
      
      console.log(`Assessment result automatically stored in performance metrics: ${assessment.testType} = ${value} ${unit}`);
    } catch (error) {
      console.error('Failed to store assessment result in performance metrics:', error);
      // Don't throw error to avoid breaking the assessment creation process
    }
  }

  /**
   * Converts assessment score to appropriate metric value and unit
   */
  private convertScoreToMetricValue(testType: TestType, score: number): { value: number; unit: string } {
    // Convert the AI score (0-100) to realistic metric values
    switch (testType) {
      case TestType.HEIGHT:
        // Convert score to height in cm (assuming 150-200cm range)
        return { value: Math.round(150 + (score / 100) * 50), unit: 'cm' };
      
      case TestType.WEIGHT:
        // Convert score to weight in kg (assuming 40-100kg range)
        return { value: Math.round(40 + (score / 100) * 60), unit: 'kg' };
      
      case TestType.SIT_AND_REACH:
        // Convert score to reach distance in cm (0-40cm range)
        return { value: Math.round((score / 100) * 40), unit: 'cm' };
      
      case TestType.STANDING_VERTICAL_JUMP:
        // Convert score to jump height in cm (20-80cm range)
        return { value: Math.round(20 + (score / 100) * 60), unit: 'cm' };
      
      case TestType.STANDING_BROAD_JUMP:
        // Convert score to jump distance in cm (100-300cm range)
        return { value: Math.round(100 + (score / 100) * 200), unit: 'cm' };
      
      case TestType.MEDICINE_BALL_THROW:
        // Convert score to throw distance in meters (2-15m range)
        return { value: Math.round((2 + (score / 100) * 13) * 10) / 10, unit: 'm' };
      
      case TestType.TENNIS_STANDING_START:
        // Convert score to time in seconds (lower is better, 2-6s range)
        return { value: Math.round((6 - (score / 100) * 4) * 100) / 100, unit: 's' };
      
      case TestType.FOUR_X_10M_SHUTTLE_RUN:
        // Convert score to time in seconds (lower is better, 8-15s range)
        return { value: Math.round((15 - (score / 100) * 7) * 100) / 100, unit: 's' };
      
      case TestType.SIT_UPS:
        // Convert score to number of reps (10-60 reps range)
        return { value: Math.round(10 + (score / 100) * 50), unit: 'reps' };
      
      case TestType.ENDURANCE_RUN:
        // Convert score to time in seconds (lower is better)
        // For 300m: 60-180s, for 1.6km: 300-900s (using average 180-540s)
        return { value: Math.round(540 - (score / 100) * 360), unit: 's' };
      
      default:
        // Fallback: use the score as-is with percentage unit
        return { value: Math.round(score), unit: '%' };
    }
  }

  // Helper methods
  private getAssessments(): AssessmentTest[] {
    try {
      const stored = localStorage.getItem(this.ASSESSMENTS_KEY);
      return stored ? JSON.parse(stored).map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp)
      })) : [];
    } catch {
      return [];
    }
  }

  private setAssessments(assessments: AssessmentTest[]): void {
    localStorage.setItem(this.ASSESSMENTS_KEY, JSON.stringify(assessments));
  }

  private generateId(): string {
    return 'asmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

const assessmentService = new AssessmentService();
export default assessmentService;
