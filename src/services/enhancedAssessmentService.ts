import { AssessmentTest, TestType, Athlete } from '../models';
import assessmentService from './assessmentService';
import cheatDetectionService, { CheatDetectionResult } from './cheatDetectionService';
import benchmarkingService, { InstantFeedback } from './benchmarkingService';
import feedbackGeneratorService, { ComprehensiveFeedback, VideoAnalysisProgress } from './feedbackGeneratorService';
import videoAnalysisEngine, { MovementAnalysisResult } from './videoAnalysisEngine';
import dataPrivacyService from './dataPrivacyService';
import saiNotificationService from './saiNotificationService';

interface EnhancedAssessmentResult {
  assessment: AssessmentTest;
  integrityAnalysis: CheatDetectionResult | null;
  performanceFeedback: InstantFeedback | null;
  comprehensiveFeedback: ComprehensiveFeedback | null;
  movementAnalysis: MovementAnalysisResult | null;
  processingStatus: 'complete' | 'partial' | 'failed';
  errorDetails?: string[];
}

interface AssessmentProcessingOptions {
  enableIntegrityCheck: boolean;
  enablePerformanceAnalysis: boolean;
  enableMovementAnalysis: boolean;
  enableRealTimeFeedback: boolean;
  detailedBiomechanics: boolean;
  generateReports: boolean;
  notifySAI: boolean;
}

interface AssessmentProcessingProgress {
  stage: 'upload' | 'integrity' | 'movement' | 'performance' | 'feedback' | 'storage' | 'notification' | 'complete';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number;
  currentAnalysis?: VideoAnalysisProgress;
}

class EnhancedAssessmentService {
  private readonly ENHANCED_ASSESSMENTS_KEY = 'athletex_enhanced_assessments';
  private processingQueue: Map<string, AssessmentProcessingProgress> = new Map();

  // Main assessment creation with full AI integration
  async createEnhancedAssessment(
    athlete: Athlete,
    testType: TestType,
    videoFile: File,
    notes: string = '',
    options: Partial<AssessmentProcessingOptions> = {},
    onProgress?: (progress: AssessmentProcessingProgress) => void
  ): Promise<EnhancedAssessmentResult> {

    const processingId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const defaultOptions: AssessmentProcessingOptions = {
      enableIntegrityCheck: true,
      enablePerformanceAnalysis: true,
      enableMovementAnalysis: true,
      enableRealTimeFeedback: true,
      detailedBiomechanics: true,
      generateReports: true,
      notifySAI: false,
      ...options
    };

    console.log(`🚀 Starting enhanced assessment for ${athlete.name} - ${testType}`);

    try {
      // Stage 1: Upload and Basic Assessment
      await this.updateProgress(processingId, {
        stage: 'upload',
        progress: 10,
        message: 'Uploading video and creating basic assessment...'
      }, onProgress);

      // Check data privacy consent
      const hasConsent = await dataPrivacyService.checkConsent(athlete.id, 'assessment_analysis');
      if (!hasConsent) {
        throw new Error('Athlete has not provided consent for detailed assessment analysis');
      }

      // Create basic assessment using existing service
      const assessment = await assessmentService.createAssessment(
        athlete.id,
        testType,
        videoFile,
        notes
      );

      let integrityAnalysis: CheatDetectionResult | null = null;
      let movementAnalysis: MovementAnalysisResult | null = null;
      let performanceFeedback: InstantFeedback | null = null;
      let comprehensiveFeedback: ComprehensiveFeedback | null = null;
      const errorDetails: string[] = [];

      // Stage 2: Integrity Analysis
      if (defaultOptions.enableIntegrityCheck) {
        try {
          await this.updateProgress(processingId, {
            stage: 'integrity',
            progress: 25,
            message: 'Analyzing video integrity and detecting anomalies...',
            estimatedTimeRemaining: 15
          }, onProgress);

          const previousAssessments = await assessmentService.getAthleteAssessments(athlete.id);
          integrityAnalysis = await cheatDetectionService.analyzeAssessment(
            assessment,
            videoFile,
            athlete,
            { previousAssessments }
          );

          // Log analysis for auditing
          await dataPrivacyService.logDataAccess({
            athleteId: athlete.id,
            accessType: 'integrity_analysis',
            purpose: 'assessment_validation',
            dataTypes: ['video', 'movement_patterns'],
            timestamp: new Date(),
            result: 'success'
          });

        } catch (error) {
          console.error('Integrity analysis failed:', error);
          errorDetails.push(`Integrity analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Stage 3: Movement Analysis
      if (defaultOptions.enableMovementAnalysis) {
        try {
          await this.updateProgress(processingId, {
            stage: 'movement',
            progress: 45,
            message: 'Analyzing movement patterns and biomechanics...',
            estimatedTimeRemaining: 20
          }, onProgress);

          movementAnalysis = await videoAnalysisEngine.analyzeVideo(
            videoFile,
            athlete,
            assessment.testType
          );

        } catch (error) {
          console.error('Movement analysis failed:', error);
          errorDetails.push(`Movement analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Stage 4: Performance Analysis & Benchmarking
      if (defaultOptions.enablePerformanceAnalysis) {
        try {
          await this.updateProgress(processingId, {
            stage: 'performance',
            progress: 65,
            message: 'Generating performance benchmarks and comparisons...',
            estimatedTimeRemaining: 10
          }, onProgress);

          const previousAssessments = await assessmentService.getAthleteAssessments(athlete.id);
          performanceFeedback = await benchmarkingService.generateInstantFeedback(
            athlete,
            assessment,
            previousAssessments
          );

        } catch (error) {
          console.error('Performance analysis failed:', error);
          errorDetails.push(`Performance analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Stage 5: Comprehensive Feedback Generation
      if (defaultOptions.enableRealTimeFeedback && (integrityAnalysis || performanceFeedback)) {
        try {
          await this.updateProgress(processingId, {
            stage: 'feedback',
            progress: 80,
            message: 'Generating comprehensive feedback and recommendations...',
            estimatedTimeRemaining: 8
          }, onProgress);

          comprehensiveFeedback = await feedbackGeneratorService.generateComprehensiveFeedback(
            athlete,
            assessment,
            videoFile,
            {
              includeIntegrityCheck: !!integrityAnalysis,
              includePerformanceAnalysis: !!performanceFeedback,
              includePeerComparison: true,
              includeProgressTracking: true,
              detailedRecommendations: true,
              realTimeNotifications: true
            },
            (feedbackProgress) => {
              // Update with nested progress
              this.updateProgress(processingId, {
                stage: 'feedback',
                progress: 80 + (feedbackProgress.progress * 0.15), // 80-95%
                message: feedbackProgress.message,
                currentAnalysis: feedbackProgress
              }, onProgress);
            }
          );

        } catch (error) {
          console.error('Feedback generation failed:', error);
          errorDetails.push(`Feedback generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Stage 6: Storage and Caching
      await this.updateProgress(processingId, {
        stage: 'storage',
        progress: 90,
        message: 'Storing results and caching analysis...'
      }, onProgress);

      // Create enhanced assessment result
      const enhancedResult: EnhancedAssessmentResult = {
        assessment,
        integrityAnalysis,
        performanceFeedback,
        comprehensiveFeedback,
        movementAnalysis,
        processingStatus: errorDetails.length === 0 ? 'complete' : 
                         (integrityAnalysis || performanceFeedback) ? 'partial' : 'failed',
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined
      };

      // Store enhanced result
      await this.storeEnhancedResult(enhancedResult);

      // Stage 7: Notifications
      if (defaultOptions.notifySAI && comprehensiveFeedback?.overallStatus === 'approved') {
        try {
          await this.updateProgress(processingId, {
            stage: 'notification',
            progress: 95,
            message: 'Sending notifications to Sports Authority...'
          }, onProgress);

          // Check if athlete qualifies for SAI notification
          const shouldNotify = this.shouldNotifySAI(athlete, assessment, comprehensiveFeedback);
          if (shouldNotify) {
            await saiNotificationService.createTalentAlert({
              type: 'assessment_milestone',
              severity: comprehensiveFeedback.combinedInsights.confidenceLevel === 'high' ? 'high' : 'medium',
              athleteId: athlete.id,
              athleteName: athlete.name,
              sport: athlete.primarySport || 'general',
              testType,
              score: assessment.score,
              percentile: performanceFeedback?.comparisons.ageGroup.percentileRank || 0,
              highlights: comprehensiveFeedback.combinedInsights.keyFindings.slice(0, 3),
              timestamp: new Date()
            });
          }

        } catch (error) {
          console.error('SAI notification failed:', error);
          // Don't add to error details as this is non-critical
        }
      }

      // Complete
      await this.updateProgress(processingId, {
        stage: 'complete',
        progress: 100,
        message: 'Assessment analysis complete!'
      }, onProgress);

      console.log(`✅ Enhanced assessment complete for ${athlete.name}. Status: ${enhancedResult.processingStatus}`);
      return enhancedResult;

    } catch (error) {
      console.error('Enhanced assessment failed:', error);
      
      await this.updateProgress(processingId, {
        stage: 'complete',
        progress: -1,
        message: `Assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, onProgress);

      throw error;
    } finally {
      // Clean up processing status after delay
      setTimeout(() => {
        this.processingQueue.delete(processingId);
      }, 60000);
    }
  }

  // Quick assessment for basic flow (backwards compatibility)
  async createQuickAssessment(
    athlete: Athlete,
    testType: TestType,
    videoFile: File,
    notes: string = ''
  ): Promise<AssessmentTest> {
    console.log(`⚡ Creating quick assessment for ${athlete.name} - ${testType}`);
    
    try {
      // Create basic assessment
      const assessment = await assessmentService.createAssessment(
        athlete.id,
        testType,
        videoFile,
        notes
      );

      // Run quick feedback in background (don't wait)
      this.generateBackgroundFeedback(athlete, assessment, videoFile).catch(error => {
        console.error('Background feedback generation failed:', error);
      });

      return assessment;

    } catch (error) {
      console.error('Quick assessment failed:', error);
      throw error;
    }
  }

  // Background feedback generation for quick assessments
  private async generateBackgroundFeedback(
    athlete: Athlete,
    assessment: AssessmentTest,
    videoFile: File
  ): Promise<void> {
    try {
      // Generate quick feedback without blocking main flow
      const quickFeedback = await feedbackGeneratorService.generateQuickFeedback(
        athlete,
        assessment
      );

      // Store quick feedback result
      const quickResult: Partial<EnhancedAssessmentResult> = {
        assessment,
        integrityAnalysis: null,
        performanceFeedback: {
          assessmentId: assessment.id,
          athleteId: athlete.id,
          insights: {
            strengths: ['Quick assessment completed'],
            weaknesses: [],
            opportunities: ['Detailed analysis pending'],
            recommendations: ['Continue training']
          },
          ...quickFeedback,
          // Mock additional required fields for interface compatibility
          scoreAnalysis: {
            currentScore: assessment.score,
            expectedScore: 75, // Default expected score
            deviation: assessment.score - 75,
            improvement: 0,
            trend: 'stable' as const
          },
          comparisons: {
            ageGroup: {
              athleteScore: assessment.score,
              percentileRank: quickFeedback.percentileRank,
              performanceLevel: 'average' as const,
              comparison: {
                vsAverage: {
                  difference: assessment.score - 75,
                  percentage: ((assessment.score - 75) / 75) * 100
                },
                vsElite: {
                  difference: assessment.score - 95,
                  percentage: ((assessment.score - 95) / 95) * 100,
                  gapAnalysis: 'Background analysis pending'
                },
                vsPeers: {
                  rank: Math.ceil((quickFeedback.percentileRank / 100) * 1000),
                  totalInGroup: 1000,
                  betterThan: quickFeedback.percentileRank
                }
              },
              benchmarkProfile: {
                ageGroup: '19-21',
                gender: athlete.gender,
                testType: assessment.testType,
                percentiles: { 5: 50, 25: 65, 50: 78, 75: 85, 90: 92, 95: 95, 99: 98 },
                sampleSize: 1000,
                lastUpdated: new Date()
              }
            },
            national: {
              athleteScore: assessment.score,
              percentileRank: quickFeedback.percentileRank,
              performanceLevel: 'average' as const,
              comparison: {
                vsAverage: {
                  difference: assessment.score - 75,
                  percentage: ((assessment.score - 75) / 75) * 100
                },
                vsElite: {
                  difference: assessment.score - 95,
                  percentage: ((assessment.score - 95) / 95) * 100,
                  gapAnalysis: 'Background analysis pending'
                },
                vsPeers: {
                  rank: Math.ceil((quickFeedback.percentileRank / 100) * 10000),
                  totalInGroup: 10000,
                  betterThan: quickFeedback.percentileRank
                }
              },
              benchmarkProfile: {
                ageGroup: 'national',
                gender: athlete.gender,
                testType: assessment.testType,
                percentiles: { 5: 55, 25: 70, 50: 80, 75: 88, 90: 94, 95: 97, 99: 99 },
                sampleSize: 10000,
                lastUpdated: new Date()
              }
            }
          },
          nextSteps: {
            immediate: ['Continue current training'],
            shortTerm: ['Focus on identified areas'],
            longTerm: ['Work toward next performance level']
          },
          targetScores: {
            nextLevel: {
              score: quickFeedback.nextTarget.score,
              timeframe: quickFeedback.nextTarget.timeframe,
              difficulty: 'moderate' as const
            },
            elite: {
              score: 95,
              timeframe: '6 months',
              difficulty: 'challenging' as const
            },
            worldClass: {
              score: 98,
              timeframe: '12 months',
              difficulty: 'challenging' as const
            }
          },
          motivationalMessage: quickFeedback.keyMessage,
          overallRating: quickFeedback.overallRating
        } as InstantFeedback,
        comprehensiveFeedback: null,
        movementAnalysis: null,
        processingStatus: 'partial' as const
      };

      await this.storeEnhancedResult(quickResult as EnhancedAssessmentResult);

    } catch (error) {
      console.error('Background feedback generation failed:', error);
    }
  }

  // Batch processing for multiple assessments
  async processAssessmentBatch(
    requests: Array<{
      athlete: Athlete;
      testType: TestType;
      videoFile: File;
      notes?: string;
      options?: Partial<AssessmentProcessingOptions>;
    }>,
    onProgress?: (batchProgress: { completed: number; total: number; current?: string }) => void
  ): Promise<EnhancedAssessmentResult[]> {
    
    console.log(`📦 Processing assessment batch of ${requests.length} assessments...`);
    
    const results: EnhancedAssessmentResult[] = [];
    const total = requests.length;

    for (let i = 0; i < requests.length; i++) {
      const { athlete, testType, videoFile, notes = '', options = {} } = requests[i];
      
      if (onProgress) {
        onProgress({
          completed: i,
          total,
          current: `Processing ${athlete.name}'s ${testType} assessment...`
        });
      }

      try {
        const result = await this.createEnhancedAssessment(
          athlete,
          testType,
          videoFile,
          notes,
          options
        );
        results.push(result);

        // Small delay between assessments
        if (i < requests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Batch processing failed for ${athlete.name}:`, error);
        // Continue with next assessment
      }
    }

    if (onProgress) {
      onProgress({ completed: total, total });
    }

    console.log(`✅ Batch processing complete. Processed ${results.length}/${total} assessments.`);
    return results;
  }

  // Get enhanced assessment results
  async getEnhancedAssessment(assessmentId: string): Promise<EnhancedAssessmentResult | null> {
    const stored = this.getStoredEnhancedResults();
    return stored.find(result => result.assessment.id === assessmentId) || null;
  }

  // Get all enhanced assessments for athlete
  async getAthleteEnhancedAssessments(athleteId: string): Promise<EnhancedAssessmentResult[]> {
    const stored = this.getStoredEnhancedResults();
    return stored
      .filter(result => result.assessment.athleteId === athleteId)
      .sort((a, b) => b.assessment.timestamp.getTime() - a.assessment.timestamp.getTime());
  }

  // Reprocess assessment with different options
  async reprocessAssessment(
    assessmentId: string,
    options: Partial<AssessmentProcessingOptions>,
    onProgress?: (progress: AssessmentProcessingProgress) => void
  ): Promise<EnhancedAssessmentResult | null> {
    
    const existingResult = await this.getEnhancedAssessment(assessmentId);
    if (!existingResult) {
      throw new Error('Assessment not found');
    }

    // Get athlete data
    const athlete = await this.getAthleteData(existingResult.assessment.athleteId);
    if (!athlete) {
      throw new Error('Athlete not found');
    }

    // Note: In a real implementation, we'd need to access the original video file
    // For this demo, we'll simulate reprocessing with the stored data
    console.log(`🔄 Reprocessing assessment ${assessmentId} with new options...`);

    try {
      // Simulate reprocessing by updating the existing result
      const updatedResult: EnhancedAssessmentResult = {
        ...existingResult,
        processingStatus: 'complete'
      };

      // Update specific analyses based on new options
      if (options.enableRealTimeFeedback && !existingResult.comprehensiveFeedback) {
        // Would generate new comprehensive feedback here
        console.log('📊 Generating new comprehensive feedback...');
      }

      if (options.detailedBiomechanics && !existingResult.movementAnalysis) {
        // Would generate detailed biomechanical analysis here
        console.log('🏃‍♂️ Generating detailed biomechanical analysis...');
      }

      await this.storeEnhancedResult(updatedResult);
      return updatedResult;

    } catch (error) {
      console.error('Assessment reprocessing failed:', error);
      throw error;
    }
  }

  // Assessment statistics and insights
  async getAssessmentInsights(athleteId: string): Promise<{
    totalAssessments: number;
    completedAnalyses: number;
    averageProcessingTime: number;
    integrityPassRate: number;
    topPerformances: Array<{
      testType: TestType;
      score: number;
      percentile: number;
      date: Date;
    }>;
    recentTrends: Array<{
      testType: TestType;
      trend: 'improving' | 'stable' | 'declining';
      changePercent: number;
    }>;
  }> {
    
    const enhanced = await this.getAthleteEnhancedAssessments(athleteId);
    const basic = await assessmentService.getAthleteAssessments(athleteId);

    const totalAssessments = basic.length;
    const completedAnalyses = enhanced.filter(r => r.processingStatus === 'complete').length;

    // Calculate average processing time (simulated)
    const averageProcessingTime = 25; // seconds

    // Calculate integrity pass rate
    const integrityChecked = enhanced.filter(r => r.integrityAnalysis);
    const integrityPassed = integrityChecked.filter(r => 
      r.integrityAnalysis?.recommendedAction === 'approve'
    );
    const integrityPassRate = integrityChecked.length > 0 ? 
      (integrityPassed.length / integrityChecked.length) * 100 : 100;

    // Get top performances
    const topPerformances = enhanced
      .filter(r => r.performanceFeedback)
      .map(r => ({
        testType: r.assessment.testType,
        score: r.assessment.score,
        percentile: r.performanceFeedback!.comparisons.ageGroup.percentileRank,
        date: r.assessment.timestamp
      }))
      .sort((a, b) => b.percentile - a.percentile)
      .slice(0, 5);

    // Calculate recent trends (simplified)
    const testTypes = Array.from(new Set(basic.map(a => a.testType)));
    const recentTrends = testTypes.map(testType => {
      const typeAssessments = basic
        .filter(a => a.testType === testType)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (typeAssessments.length < 2) {
        return {
          testType,
          trend: 'stable' as const,
          changePercent: 0
        };
      }

      const recent = typeAssessments.slice(-3);
      const older = typeAssessments.slice(-6, -3);
      
      const recentAvg = recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
      const olderAvg = older.length > 0 ? 
        older.reduce((sum, a) => sum + a.score, 0) / older.length : recentAvg;

      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

      return {
        testType,
        trend: changePercent > 5 ? 'improving' as const : 
               changePercent < -5 ? 'declining' as const : 'stable' as const,
        changePercent: Math.abs(changePercent)
      };
    });

    return {
      totalAssessments,
      completedAnalyses,
      averageProcessingTime,
      integrityPassRate,
      topPerformances,
      recentTrends
    };
  }

  // Helper methods
  private async updateProgress(
    processingId: string,
    progress: AssessmentProcessingProgress,
    onProgress?: (progress: AssessmentProcessingProgress) => void
  ): Promise<void> {
    this.processingQueue.set(processingId, progress);
    if (onProgress) {
      onProgress(progress);
    }

    // Small delay for realistic progress updates
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private shouldNotifySAI(
    athlete: Athlete,
    assessment: AssessmentTest,
    feedback: ComprehensiveFeedback
  ): boolean {
    // Criteria for SAI notification
    const conditions = [
      assessment.score >= 85, // High performance score
      feedback.performanceFeedback.comparisons.ageGroup.percentileRank >= 95, // Top 5%
      feedback.integrityAnalysis.approved, // Passed integrity check
      feedback.combinedInsights.confidenceLevel === 'high' // High confidence
    ];

    return conditions.filter(Boolean).length >= 3; // At least 3 criteria met
  }

  private async storeEnhancedResult(result: EnhancedAssessmentResult): Promise<void> {
    const stored = this.getStoredEnhancedResults();
    const existingIndex = stored.findIndex(r => r.assessment.id === result.assessment.id);
    
    if (existingIndex >= 0) {
      stored[existingIndex] = result;
    } else {
      stored.push(result);
    }

    localStorage.setItem(this.ENHANCED_ASSESSMENTS_KEY, JSON.stringify(stored));
  }

  private getStoredEnhancedResults(): EnhancedAssessmentResult[] {
    try {
      const stored = localStorage.getItem(this.ENHANCED_ASSESSMENTS_KEY);
      return stored ? JSON.parse(stored).map((r: any) => ({
        ...r,
        assessment: {
          ...r.assessment,
          timestamp: new Date(r.assessment.timestamp)
        }
      })) : [];
    } catch {
      return [];
    }
  }

  private async getAthleteData(athleteId: string): Promise<Athlete | null> {
    // This would typically fetch from athleteService
    // For demo purposes, return a mock athlete
    return {
      id: athleteId,
      name: 'Demo Athlete',
      email: 'demo@example.com',
      phoneNumber: '+1234567890',
      age: 25,
      gender: 'male' as const,
      height: 175,
      weight: 70,
      primarySport: 'general',
      sportsPlayed: ['general'],
      country: 'Demo Country',
      state: 'Demo State',
      city: 'Demo City',
      pinCode: '000000',
      profilePictureUrl: '',
      location: 'Demo Location',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  getProcessingStatus(processingId: string): AssessmentProcessingProgress | null {
    return this.processingQueue.get(processingId) || null;
  }
}

const enhancedAssessmentService = new EnhancedAssessmentService();
export default enhancedAssessmentService;
export type { 
  EnhancedAssessmentResult, 
  AssessmentProcessingOptions, 
  AssessmentProcessingProgress 
};
