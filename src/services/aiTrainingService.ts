import { TestType, AssessmentTest, Athlete } from '../models';
import { TrainingExercise } from '../types/trainingTypes';

export interface AITrainingInsight {
  type: 'form' | 'pace' | 'motivation' | 'warning' | 'achievement';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  actionable?: string;
}

export interface PersonalizedRecommendation {
  category: 'strength' | 'cardio' | 'flexibility' | 'recovery' | 'nutrition';
  title: string;
  description: string;
  reasoning: string;
  exercises: string[];
  duration: string;
  frequency: string;
  priority: 'high' | 'medium' | 'low';
  expectedImprovement: string;
}

export interface RealTimeMetrics {
  currentPace: number;
  targetPace: number;
  formScore: number;
  fatigueLevel: number;
  caloriesBurned: number;
  heartRateZone?: 'warmup' | 'fat_burn' | 'cardio' | 'peak';
}

export interface WorkoutAnalysis {
  overallPerformance: number;
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
  estimatedCalories: number;
  musclesWorked: string[];
}

class AITrainingService {
  private insights: AITrainingInsight[] = [];
  private metricsHistory: RealTimeMetrics[] = [];

  /**
   * Generate personalized training recommendations based on assessment results
   */
  generateRecommendations(
    assessments: AssessmentTest[],
    athlete: Athlete,
    goals: string[]
  ): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = [];

    // Analyze assessment scores to identify weak areas
    const weakAreas = this.identifyWeakAreas(assessments);
    const strongAreas = this.identifyStrongAreas(assessments);

    // Generate recommendations for weak areas
    weakAreas.forEach(area => {
      const recommendation = this.createRecommendationForWeakness(area, athlete, goals);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    // Generate recommendations to maintain strengths
    strongAreas.forEach(area => {
      const recommendation = this.createMaintenanceRecommendation(area, athlete);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    // Add recovery recommendations if needed
    if (this.needsRecoveryFocus(assessments, athlete)) {
      recommendations.push(this.createRecoveryRecommendation(athlete));
    }

    // Add nutrition recommendations
    recommendations.push(this.createNutritionRecommendation(athlete, goals));

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Provide real-time insights during workout
   */
  generateRealTimeInsight(
    exercise: TrainingExercise,
    currentMetrics: RealTimeMetrics,
    elapsedTime: number,
    currentSet: number
  ): AITrainingInsight | null {
    // Form feedback
    if (currentMetrics.formScore < 60) {
      return {
        type: 'form',
        title: 'Form Check',
        message: 'Focus on maintaining proper form. Quality over quantity!',
        priority: 'high',
        timestamp: new Date(),
        actionable: 'Slow down and concentrate on technique'
      };
    }

    // Pace feedback
    if (currentMetrics.currentPace < currentMetrics.targetPace * 0.7) {
      return {
        type: 'pace',
        title: 'Pace Too Slow',
        message: 'Try to increase your pace to match your target intensity.',
        priority: 'medium',
        timestamp: new Date(),
        actionable: 'Speed up slightly while maintaining form'
      };
    }

    if (currentMetrics.currentPace > currentMetrics.targetPace * 1.3) {
      return {
        type: 'pace',
        title: 'Pace Too Fast',
        message: 'You\'re going too fast! Slow down to avoid early fatigue.',
        priority: 'high',
        timestamp: new Date(),
        actionable: 'Reduce intensity to sustainable level'
      };
    }

    // Fatigue warning
    if (currentMetrics.fatigueLevel > 80) {
      return {
        type: 'warning',
        title: 'High Fatigue Detected',
        message: 'Consider taking a longer rest or reducing intensity.',
        priority: 'high',
        timestamp: new Date(),
        actionable: 'Take a 30-second break and hydrate'
      };
    }

    // Motivation boost
    if (currentSet === Math.floor(exercise.sets / 2)) {
      return {
        type: 'motivation',
        title: 'Halfway There!',
        message: `Great job! You're halfway through ${exercise.name}. Keep it up!`,
        priority: 'low',
        timestamp: new Date()
      };
    }

    // Achievement
    if (currentMetrics.formScore > 90 && currentMetrics.currentPace >= currentMetrics.targetPace) {
      return {
        type: 'achievement',
        title: 'Perfect Form!',
        message: 'Excellent technique and pace. You\'re crushing it!',
        priority: 'low',
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Analyze completed workout
   */
  analyzeWorkout(
    exercises: TrainingExercise[],
    completedSets: number[],
    metricsHistory: RealTimeMetrics[]
  ): WorkoutAnalysis {
    const avgFormScore = metricsHistory.reduce((sum, m) => sum + m.formScore, 0) / metricsHistory.length;
    const totalCalories = metricsHistory[metricsHistory.length - 1]?.caloriesBurned || 0;

    const strengths: string[] = [];
    const improvements: string[] = [];

    // Analyze performance
    if (avgFormScore > 85) {
      strengths.push('Excellent form throughout the workout');
    } else if (avgFormScore < 60) {
      improvements.push('Focus on maintaining proper form');
    }

    const completionRate = completedSets.reduce((sum, sets) => sum + sets, 0) / 
                          exercises.reduce((sum, ex) => sum + ex.sets, 0);

    if (completionRate >= 0.9) {
      strengths.push('Completed almost all planned sets');
    } else if (completionRate < 0.7) {
      improvements.push('Try to complete more sets next time');
    }

    // Extract unique muscles worked
    const allMuscles = exercises.flatMap(ex => ex.targetMuscles);
    const musclesWorked = Array.from(new Set(allMuscles));

    return {
      overallPerformance: Math.round((avgFormScore + completionRate * 100) / 2),
      strengths,
      areasForImprovement: improvements,
      nextSteps: this.generateNextSteps(strengths, improvements),
      estimatedCalories: Math.round(totalCalories),
      musclesWorked
    };
  }

  /**
   * Get adaptive workout difficulty
   */
  getAdaptiveDifficulty(
    baseExercise: TrainingExercise,
    recentPerformance: number,
    fatigueLevel: number
  ): TrainingExercise {
    const adjusted = { ...baseExercise };

    // Adjust based on performance
    if (recentPerformance > 90 && fatigueLevel < 50) {
      // Increase difficulty
      adjusted.reps = Math.round(baseExercise.reps * 1.1);
      adjusted.sets = Math.min(baseExercise.sets + 1, 5);
    } else if (recentPerformance < 60 || fatigueLevel > 80) {
      // Decrease difficulty
      adjusted.reps = Math.round(baseExercise.reps * 0.9);
      adjusted.restBetweenSets = Math.round(baseExercise.restBetweenSets * 1.2);
    }

    return adjusted;
  }

  // Private helper methods

  private identifyWeakAreas(assessments: AssessmentTest[]): TestType[] {
    return assessments
      .filter(a => a.score < 60)
      .map(a => a.testType)
      .slice(0, 3); // Top 3 weak areas
  }

  private identifyStrongAreas(assessments: AssessmentTest[]): TestType[] {
    return assessments
      .filter(a => a.score >= 75)
      .map(a => a.testType)
      .slice(0, 2); // Top 2 strong areas
  }

  private createRecommendationForWeakness(
    testType: TestType,
    athlete: Athlete,
    goals: string[]
  ): PersonalizedRecommendation | null {
    const recommendations: Record<string, Partial<PersonalizedRecommendation>> = {
      [TestType.TENNIS_STANDING_START]: {
        category: 'cardio',
        title: 'Speed Development Program',
        description: 'Improve your sprint speed and acceleration with targeted interval training',
        reasoning: 'Your speed assessment shows room for improvement. Sprint intervals will help develop fast-twitch muscle fibers.',
        exercises: [
          '30m sprint intervals (8-10 reps)',
          'Hill sprints (6-8 reps)',
          'Resistance band sprints',
          'Plyometric jumps'
        ],
        duration: '20-30 minutes',
        frequency: '3 times per week',
        priority: 'high',
        expectedImprovement: '15-20% improvement in 8 weeks'
      },
      [TestType.MEDICINE_BALL_THROW]: {
        category: 'strength',
        title: 'Strength Building Protocol',
        description: 'Build functional strength with progressive overload training',
        reasoning: 'Your strength levels need development. Focus on compound movements with progressive resistance.',
        exercises: [
          'Push-ups (3 sets of 12-15)',
          'Pull-ups or assisted pull-ups (3 sets of 8-10)',
          'Squats (3 sets of 15-20)',
          'Planks (3 sets of 45-60 seconds)'
        ],
        duration: '30-40 minutes',
        frequency: '4 times per week',
        priority: 'high',
        expectedImprovement: '25-30% strength gain in 12 weeks'
      },
      [TestType.SIT_AND_REACH]: {
        category: 'flexibility',
        title: 'Flexibility Enhancement Routine',
        description: 'Improve range of motion and reduce injury risk',
        reasoning: 'Limited flexibility can lead to injuries. Daily stretching will improve mobility and performance.',
        exercises: [
          'Dynamic stretching routine (10 minutes)',
          'Yoga flow sequence',
          'Static stretches for major muscle groups',
          'Foam rolling session'
        ],
        duration: '15-20 minutes',
        frequency: 'Daily',
        priority: 'high',
        expectedImprovement: '30-40% flexibility increase in 6 weeks'
      },
      [TestType.ENDURANCE_RUN]: {
        category: 'cardio',
        title: 'Endurance Building Program',
        description: 'Develop cardiovascular fitness and stamina',
        reasoning: 'Your endurance needs work. Gradual progression in cardio will build your aerobic capacity.',
        exercises: [
          'Long slow distance runs (20-30 minutes)',
          'Tempo runs (15-20 minutes)',
          'Cycling or swimming sessions',
          'Circuit training'
        ],
        duration: '30-45 minutes',
        frequency: '4-5 times per week',
        priority: 'high',
        expectedImprovement: '20-25% endurance boost in 10 weeks'
      }
    };

    const template = recommendations[testType];
    if (!template) return null;

    return {
      ...template,
      category: template.category!,
      title: template.title!,
      description: template.description!,
      reasoning: template.reasoning!,
      exercises: template.exercises!,
      duration: template.duration!,
      frequency: template.frequency!,
      priority: template.priority as 'high' | 'medium' | 'low',
      expectedImprovement: template.expectedImprovement!
    };
  }

  private createMaintenanceRecommendation(
    testType: TestType,
    athlete: Athlete
  ): PersonalizedRecommendation | null {
    return {
      category: 'strength',
      title: `Maintain Your ${testType} Excellence`,
      description: 'Keep up your strong performance with maintenance training',
      reasoning: `You're performing well in ${testType}. Continue with regular training to maintain this level.`,
      exercises: ['Continue current routine', 'Add variety to prevent plateaus'],
      duration: '20-30 minutes',
      frequency: '2-3 times per week',
      priority: 'low',
      expectedImprovement: 'Maintain current level'
    };
  }

  private needsRecoveryFocus(assessments: AssessmentTest[], athlete: Athlete): boolean {
    // Check if multiple low scores might indicate overtraining
    const lowScores = assessments.filter(a => a.score < 50).length;
    return lowScores >= 3;
  }

  private createRecoveryRecommendation(athlete: Athlete): PersonalizedRecommendation {
    return {
      category: 'recovery',
      title: 'Recovery and Regeneration Focus',
      description: 'Prioritize rest and recovery to prevent overtraining',
      reasoning: 'Multiple low scores suggest you may need more recovery time. Rest is crucial for progress.',
      exercises: [
        'Light yoga or stretching',
        'Walking or easy cycling',
        'Foam rolling and massage',
        'Sleep 8-9 hours per night'
      ],
      duration: '15-30 minutes',
      frequency: 'Daily',
      priority: 'high',
      expectedImprovement: 'Better performance after adequate recovery'
    };
  }

  private createNutritionRecommendation(athlete: Athlete, goals: string[]): PersonalizedRecommendation {
    const isVegetarian = athlete.dietPreference === 'vegetarian' || athlete.dietPreference === 'vegan';
    
    return {
      category: 'nutrition',
      title: 'Nutrition Optimization Plan',
      description: 'Fuel your training with proper nutrition',
      reasoning: 'Proper nutrition is essential for performance and recovery.',
      exercises: [
        isVegetarian 
          ? 'Protein: Lentils, chickpeas, tofu, quinoa (1.6-2.2g per kg body weight)'
          : 'Protein: Lean meats, fish, eggs (1.6-2.2g per kg body weight)',
        'Carbs: Whole grains, fruits, vegetables (3-5g per kg for moderate training)',
        'Healthy fats: Nuts, avocado, olive oil',
        'Hydration: 3-4 liters of water daily',
        'Pre-workout: Carbs 1-2 hours before training',
        'Post-workout: Protein + carbs within 30 minutes'
      ],
      duration: 'Ongoing',
      frequency: 'Daily',
      priority: 'medium',
      expectedImprovement: 'Better energy and faster recovery'
    };
  }

  private generateNextSteps(strengths: string[], improvements: string[]): string[] {
    const steps: string[] = [];

    if (improvements.length > 0) {
      steps.push('Focus on the areas identified for improvement in your next workout');
    }

    if (strengths.length > 0) {
      steps.push('Continue building on your strengths');
    }

    steps.push('Track your progress and adjust intensity as needed');
    steps.push('Ensure adequate rest between training sessions');

    return steps;
  }
}

const aiTrainingService = new AITrainingService();
export default aiTrainingService;
