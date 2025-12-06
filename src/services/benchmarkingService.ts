import { Athlete, AssessmentTest, TestType, SportType } from '../models';

interface BenchmarkProfile {
  ageGroup: string; // e.g., '16-18', '19-21', '22-24'
  gender: 'male' | 'female' | 'other';
  sport?: string;
  testType: TestType;
  percentiles: {
    5: number;   // 5th percentile (very low)
    25: number;  // 25th percentile (below average)
    50: number;  // 50th percentile (average/median)
    75: number;  // 75th percentile (above average)
    90: number;  // 90th percentile (excellent)
    95: number;  // 95th percentile (elite)
    99: number;  // 99th percentile (world-class)
  };
  sampleSize: number;
  lastUpdated: Date;
}

interface PerformanceComparison {
  athleteScore: number;
  percentileRank: number;
  performanceLevel: 'world_class' | 'elite' | 'excellent' | 'above_average' | 'average' | 'below_average' | 'needs_improvement';
  comparison: {
    vsAverage: {
      difference: number; // positive = above average
      percentage: number; // percentage difference
    };
    vsElite: {
      difference: number;
      percentage: number;
      gapAnalysis: string;
    };
    vsPeers: {
      rank: number;
      totalInGroup: number;
      betterThan: number; // percentage of peers
    };
  };
  benchmarkProfile: BenchmarkProfile;
}

interface InstantFeedback {
  assessmentId: string;
  athleteId: string;
  overallRating: 'outstanding' | 'excellent' | 'good' | 'fair' | 'needs_improvement';
  scoreAnalysis: {
    currentScore: number;
    expectedScore: number;
    deviation: number;
    improvement: number; // compared to previous assessment
    trend: 'improving' | 'stable' | 'declining';
  };
  comparisons: {
    ageGroup: PerformanceComparison;
    sport?: PerformanceComparison;
    national: PerformanceComparison;
    international?: PerformanceComparison;
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
  };
  nextSteps: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  motivationalMessage: string;
  targetScores: {
    nextLevel: { score: number; timeframe: string; difficulty: 'easy' | 'moderate' | 'challenging' };
    elite: { score: number; timeframe: string; difficulty: 'easy' | 'moderate' | 'challenging' };
    worldClass: { score: number; timeframe: string; difficulty: 'easy' | 'moderate' | 'challenging' };
  };
}

interface AgeGroupDefinition {
  label: string;
  minAge: number;
  maxAge: number;
  developmentStage: 'youth' | 'junior' | 'senior' | 'veteran';
  characteristics: string[];
}

interface SportSpecificBenchmark {
  sport: string;
  testType: TestType;
  importance: number; // 0-10, how important this test is for the sport
  expectedPerformance: {
    beginner: number;
    intermediate: number;
    advanced: number;
    elite: number;
  };
  weightModifier: number; // multiplier for scoring based on sport relevance
}

class BenchmarkingService {
  private benchmarkData: Map<string, BenchmarkProfile> = new Map();
  private ageGroups: AgeGroupDefinition[] = [];
  private sportBenchmarks: Map<string, SportSpecificBenchmark> = new Map();

  constructor() {
    this.initializeBenchmarkData();
    this.initializeAgeGroups();
    this.initializeSportBenchmarks();
  }

  // Main benchmarking method
  async generateInstantFeedback(
    athlete: Athlete,
    assessment: AssessmentTest,
    previousAssessments?: AssessmentTest[]
  ): Promise<InstantFeedback> {
    console.log(`📊 Generating instant feedback for ${athlete.name}'s ${assessment.testType} assessment`);

    // Get relevant benchmarks
    const ageGroup = this.determineAgeGroup(athlete.age);
    const ageGroupComparison = this.compareToAgeGroup(athlete, assessment, ageGroup);
    
    const sportComparison = athlete.sportsPlayed.length > 0 ? 
      this.compareToSport(athlete, assessment, athlete.sportsPlayed[0] as string) : undefined;
    
    const nationalComparison = this.compareToNational(athlete, assessment);
    const internationalComparison = this.compareToInternational(athlete, assessment);

    // Calculate improvement trend
    const previousScore = this.getPreviousScore(assessment.testType, previousAssessments);
    const improvement = previousScore ? assessment.score - previousScore : 0;
    const trend = this.calculateTrend(assessment.testType, previousAssessments || []);

    // Generate insights and recommendations
    const insights = this.generateInsights(athlete, assessment, ageGroupComparison, sportComparison);
    const nextSteps = this.generateNextSteps(athlete, assessment, ageGroupComparison);
    const targetScores = this.calculateTargetScores(athlete, assessment, ageGroupComparison);

    // Determine overall rating
    const overallRating = this.determineOverallRating(ageGroupComparison.percentileRank);
    const motivationalMessage = this.generateMotivationalMessage(athlete, overallRating, improvement);

    const feedback: InstantFeedback = {
      assessmentId: assessment.id,
      athleteId: athlete.id,
      overallRating,
      scoreAnalysis: {
        currentScore: assessment.score,
        expectedScore: ageGroupComparison.benchmarkProfile.percentiles[50], // median
        deviation: assessment.score - ageGroupComparison.benchmarkProfile.percentiles[50],
        improvement,
        trend
      },
      comparisons: {
        ageGroup: ageGroupComparison,
        sport: sportComparison,
        national: nationalComparison,
        international: internationalComparison
      },
      insights,
      nextSteps,
      motivationalMessage,
      targetScores
    };

    console.log(`✅ Instant feedback generated. Overall rating: ${overallRating}, Percentile: ${ageGroupComparison.percentileRank}th`);
    return feedback;
  }

  // Age group comparison
  private compareToAgeGroup(athlete: Athlete, assessment: AssessmentTest, ageGroup: string): PerformanceComparison {
    const benchmark = this.getBenchmark(ageGroup, athlete.gender, assessment.testType);
    const percentileRank = this.calculatePercentile(assessment.score, benchmark);
    const performanceLevel = this.determinePerformanceLevel(percentileRank);

    return {
      athleteScore: assessment.score,
      percentileRank,
      performanceLevel,
      comparison: {
        vsAverage: {
          difference: assessment.score - benchmark.percentiles[50],
          percentage: ((assessment.score - benchmark.percentiles[50]) / benchmark.percentiles[50]) * 100
        },
        vsElite: {
          difference: assessment.score - benchmark.percentiles[95],
          percentage: ((assessment.score - benchmark.percentiles[95]) / benchmark.percentiles[95]) * 100,
          gapAnalysis: this.generateGapAnalysis(assessment.score, benchmark.percentiles[95])
        },
        vsPeers: {
          rank: Math.ceil((percentileRank / 100) * benchmark.sampleSize),
          totalInGroup: benchmark.sampleSize,
          betterThan: percentileRank
        }
      },
      benchmarkProfile: benchmark
    };
  }

  // Sport-specific comparison
  private compareToSport(athlete: Athlete, assessment: AssessmentTest, sport: string): PerformanceComparison {
    const ageGroup = this.determineAgeGroup(athlete.age);
    const benchmark = this.getBenchmark(ageGroup, athlete.gender, assessment.testType, sport);
    const percentileRank = this.calculatePercentile(assessment.score, benchmark);
    const performanceLevel = this.determinePerformanceLevel(percentileRank);

    return {
      athleteScore: assessment.score,
      percentileRank,
      performanceLevel,
      comparison: {
        vsAverage: {
          difference: assessment.score - benchmark.percentiles[50],
          percentage: ((assessment.score - benchmark.percentiles[50]) / benchmark.percentiles[50]) * 100
        },
        vsElite: {
          difference: assessment.score - benchmark.percentiles[95],
          percentage: ((assessment.score - benchmark.percentiles[95]) / benchmark.percentiles[95]) * 100,
          gapAnalysis: this.generateGapAnalysis(assessment.score, benchmark.percentiles[95])
        },
        vsPeers: {
          rank: Math.ceil((percentileRank / 100) * benchmark.sampleSize),
          totalInGroup: benchmark.sampleSize,
          betterThan: percentileRank
        }
      },
      benchmarkProfile: benchmark
    };
  }

  // National comparison
  private compareToNational(athlete: Athlete, assessment: AssessmentTest): PerformanceComparison {
    // Use broader national benchmarks
    const benchmark = this.getNationalBenchmark(athlete.gender, assessment.testType);
    const percentileRank = this.calculatePercentile(assessment.score, benchmark);
    const performanceLevel = this.determinePerformanceLevel(percentileRank);

    return {
      athleteScore: assessment.score,
      percentileRank,
      performanceLevel,
      comparison: {
        vsAverage: {
          difference: assessment.score - benchmark.percentiles[50],
          percentage: ((assessment.score - benchmark.percentiles[50]) / benchmark.percentiles[50]) * 100
        },
        vsElite: {
          difference: assessment.score - benchmark.percentiles[95],
          percentage: ((assessment.score - benchmark.percentiles[95]) / benchmark.percentiles[95]) * 100,
          gapAnalysis: this.generateGapAnalysis(assessment.score, benchmark.percentiles[95])
        },
        vsPeers: {
          rank: Math.ceil((percentileRank / 100) * benchmark.sampleSize),
          totalInGroup: benchmark.sampleSize,
          betterThan: percentileRank
        }
      },
      benchmarkProfile: benchmark
    };
  }

  // International comparison
  private compareToInternational(athlete: Athlete, assessment: AssessmentTest): PerformanceComparison {
    const benchmark = this.getInternationalBenchmark(athlete.gender, assessment.testType);
    const percentileRank = this.calculatePercentile(assessment.score, benchmark);
    const performanceLevel = this.determinePerformanceLevel(percentileRank);

    return {
      athleteScore: assessment.score,
      percentileRank,
      performanceLevel,
      comparison: {
        vsAverage: {
          difference: assessment.score - benchmark.percentiles[50],
          percentage: ((assessment.score - benchmark.percentiles[50]) / benchmark.percentiles[50]) * 100
        },
        vsElite: {
          difference: assessment.score - benchmark.percentiles[95],
          percentage: ((assessment.score - benchmark.percentiles[95]) / benchmark.percentiles[95]) * 100,
          gapAnalysis: this.generateGapAnalysis(assessment.score, benchmark.percentiles[95])
        },
        vsPeers: {
          rank: Math.ceil((percentileRank / 100) * benchmark.sampleSize),
          totalInGroup: benchmark.sampleSize,
          betterThan: percentileRank
        }
      },
      benchmarkProfile: benchmark
    };
  }

  // Helper methods
  private determineAgeGroup(age: number): string {
    const ageGroup = this.ageGroups.find(group => age >= group.minAge && age <= group.maxAge);
    return ageGroup ? ageGroup.label : '19-21'; // default fallback
  }

  private calculatePercentile(score: number, benchmark: BenchmarkProfile): number {
    const percentiles = benchmark.percentiles;
    
    if (score >= percentiles[99]) return 99;
    if (score >= percentiles[95]) return 95 + (score - percentiles[95]) / (percentiles[99] - percentiles[95]) * 4;
    if (score >= percentiles[90]) return 90 + (score - percentiles[90]) / (percentiles[95] - percentiles[90]) * 5;
    if (score >= percentiles[75]) return 75 + (score - percentiles[75]) / (percentiles[90] - percentiles[75]) * 15;
    if (score >= percentiles[50]) return 50 + (score - percentiles[50]) / (percentiles[75] - percentiles[50]) * 25;
    if (score >= percentiles[25]) return 25 + (score - percentiles[25]) / (percentiles[50] - percentiles[25]) * 25;
    if (score >= percentiles[5]) return 5 + (score - percentiles[5]) / (percentiles[25] - percentiles[5]) * 20;
    
    return Math.max(1, (score / percentiles[5]) * 5);
  }

  private determinePerformanceLevel(percentileRank: number): PerformanceComparison['performanceLevel'] {
    if (percentileRank >= 99) return 'world_class';
    if (percentileRank >= 95) return 'elite';
    if (percentileRank >= 90) return 'excellent';
    if (percentileRank >= 75) return 'above_average';
    if (percentileRank >= 50) return 'average';
    if (percentileRank >= 25) return 'below_average';
    return 'needs_improvement';
  }

  private determineOverallRating(percentileRank: number): InstantFeedback['overallRating'] {
    if (percentileRank >= 95) return 'outstanding';
    if (percentileRank >= 90) return 'excellent';
    if (percentileRank >= 75) return 'good';
    if (percentileRank >= 50) return 'fair';
    return 'needs_improvement';
  }

  private generateGapAnalysis(currentScore: number, eliteScore: number): string {
    const gap = eliteScore - currentScore;
    const gapPercentage = (gap / eliteScore) * 100;

    if (gapPercentage <= 5) return 'You are very close to elite level performance';
    if (gapPercentage <= 15) return 'You are approaching elite level performance';
    if (gapPercentage <= 30) return 'You have a moderate gap to close to reach elite level';
    if (gapPercentage <= 50) return 'You need significant improvement to reach elite level';
    return 'You have substantial development needed to reach elite level';
  }

  private generateInsights(
    athlete: Athlete, 
    assessment: AssessmentTest, 
    ageGroupComparison: PerformanceComparison,
    sportComparison?: PerformanceComparison
  ): InstantFeedback['insights'] {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const recommendations: string[] = [];

    // Analyze performance level
    if (ageGroupComparison.percentileRank >= 90) {
      strengths.push(`Exceptional ${assessment.testType} performance for your age group`);
      opportunities.push('Consider competing at higher levels or specializing in this area');
    } else if (ageGroupComparison.percentileRank >= 75) {
      strengths.push(`Strong ${assessment.testType} performance compared to peers`);
      opportunities.push('Focus on consistency and gradual improvement');
    } else if (ageGroupComparison.percentileRank < 50) {
      weaknesses.push(`Below average ${assessment.testType} performance for your age group`);
      recommendations.push(`Develop a targeted training plan for ${assessment.testType}`);
    }

    // Sport-specific analysis
    if (sportComparison) {
      const sportBenchmark = this.sportBenchmarks.get(`${athlete.sportsPlayed[0]}_${assessment.testType}`);
      if (sportBenchmark && sportBenchmark.importance >= 8) {
        if (sportComparison.percentileRank >= 80) {
          strengths.push(`Excellent ${assessment.testType} performance for ${athlete.sportsPlayed[0]}`);
        } else if (sportComparison.percentileRank < 60) {
          weaknesses.push(`${assessment.testType} needs improvement for competitive ${athlete.sportsPlayed[0]}`);
          recommendations.push(`Focus on sport-specific ${assessment.testType} training`);
        }
      }
    }

    // Age-specific recommendations
    const ageGroup = this.determineAgeGroup(athlete.age);
    if (athlete.age < 18) {
      recommendations.push('Focus on developing fundamental movement skills');
      opportunities.push('High potential for rapid improvement at your age');
    } else if (athlete.age > 25) {
      recommendations.push('Maintain current fitness levels and focus on technique refinement');
      opportunities.push('Leverage experience and tactical knowledge');
    }

    return { strengths, weaknesses, opportunities, recommendations };
  }

  private generateNextSteps(
    athlete: Athlete, 
    assessment: AssessmentTest, 
    comparison: PerformanceComparison
  ): InstantFeedback['nextSteps'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate actions (next 1-2 weeks)
    if (comparison.percentileRank < 50) {
      immediate.push(`Review proper ${assessment.testType} technique with a coach`);
      immediate.push('Schedule 2-3 focused training sessions per week');
    } else if (comparison.percentileRank >= 90) {
      immediate.push('Maintain current training intensity');
      immediate.push('Consider adding advanced variations to your routine');
    }

    // Short-term goals (1-3 months)
    const nextLevelScore = this.calculateNextLevelScore(assessment.score, comparison.benchmarkProfile);
    shortTerm.push(`Target a score of ${nextLevelScore} in your next assessment`);
    
    if (comparison.performanceLevel === 'below_average') {
      shortTerm.push('Complete a structured 8-week improvement program');
      shortTerm.push('Take monthly assessments to track progress');
    } else if (comparison.performanceLevel === 'excellent') {
      shortTerm.push('Prepare for competitive events or trials');
      shortTerm.push('Work with specialized coaches in your sport');
    }

    // Long-term vision (6 months - 1 year)
    const eliteScore = comparison.benchmarkProfile.percentiles[95];
    if (assessment.score < eliteScore) {
      longTerm.push(`Work towards elite-level performance (${eliteScore} score)`);
    }
    
    if (athlete.age < 22 && comparison.percentileRank >= 75) {
      longTerm.push('Consider pathways to professional or national team selection');
    }
    
    longTerm.push('Develop a comprehensive athletic development plan');
    longTerm.push('Regular reassessment and goal adjustment every 6 months');

    return { immediate, shortTerm, longTerm };
  }

  private calculateTargetScores(
    athlete: Athlete, 
    assessment: AssessmentTest, 
    comparison: PerformanceComparison
  ): InstantFeedback['targetScores'] {
    const current = assessment.score;
    const benchmarks = comparison.benchmarkProfile.percentiles;

    // Next level (one performance level up)
    let nextLevelScore: number;
    let nextLevelDifficulty: 'easy' | 'moderate' | 'challenging';
    let nextLevelTime: string;

    if (comparison.percentileRank < 25) {
      nextLevelScore = benchmarks[25];
      nextLevelDifficulty = 'moderate';
      nextLevelTime = '3-6 months';
    } else if (comparison.percentileRank < 50) {
      nextLevelScore = benchmarks[50];
      nextLevelDifficulty = 'moderate';
      nextLevelTime = '2-4 months';
    } else if (comparison.percentileRank < 75) {
      nextLevelScore = benchmarks[75];
      nextLevelDifficulty = 'challenging';
      nextLevelTime = '4-8 months';
    } else if (comparison.percentileRank < 90) {
      nextLevelScore = benchmarks[90];
      nextLevelDifficulty = 'challenging';
      nextLevelTime = '6-12 months';
    } else {
      nextLevelScore = benchmarks[95];
      nextLevelDifficulty = 'challenging';
      nextLevelTime = '8-18 months';
    }

    // Elite level target
    const eliteGap = benchmarks[95] - current;
    const eliteDifficulty: 'easy' | 'moderate' | 'challenging' = 
      eliteGap <= (current * 0.1) ? 'easy' : 
      eliteGap <= (current * 0.25) ? 'moderate' : 'challenging';
    
    const eliteTimeframe = athlete.age < 20 ? '1-2 years' : 
                          athlete.age < 25 ? '2-3 years' : '3-5 years';

    // World-class target
    const worldClassScore = benchmarks[99];
    const worldClassDifficulty: 'easy' | 'moderate' | 'challenging' = 
      comparison.percentileRank >= 95 ? 'moderate' : 'challenging';

    return {
      nextLevel: {
        score: Math.round(nextLevelScore * 10) / 10,
        timeframe: nextLevelTime,
        difficulty: nextLevelDifficulty
      },
      elite: {
        score: Math.round(benchmarks[95] * 10) / 10,
        timeframe: eliteTimeframe,
        difficulty: eliteDifficulty
      },
      worldClass: {
        score: Math.round(worldClassScore * 10) / 10,
        timeframe: '3-10 years',
        difficulty: worldClassDifficulty
      }
    };
  }

  private generateMotivationalMessage(
    athlete: Athlete, 
    rating: InstantFeedback['overallRating'], 
    improvement: number
  ): string {
    const messages = {
      outstanding: [
        "🏆 Exceptional performance! You're performing at an elite level.",
        "⭐ Outstanding results! Your dedication is paying off tremendously.",
        "🚀 Incredible performance! You're in the top tier of athletes."
      ],
      excellent: [
        "🎉 Excellent work! You're performing well above average.",
        "💪 Great results! Your training is clearly effective.",
        "🌟 Impressive performance! Keep up the excellent work."
      ],
      good: [
        "👍 Good job! You're performing above the average for your age group.",
        "📈 Solid performance! You're on the right track.",
        "💯 Well done! Your efforts are showing positive results."
      ],
      fair: [
        "⚡ Fair performance! There's room for improvement and growth.",
        "🎯 You're at the average level - let's work on moving up!",
        "🌱 Good foundation! With focused training, you can achieve more."
      ],
      needs_improvement: [
        "🚀 Every expert was once a beginner! Let's focus on improvement.",
        "💪 Great potential ahead! Consistent training will show results.",
        "🌟 This is your starting point - exciting journey ahead!"
      ]
    };

    let baseMessage = messages[rating][Math.floor(Math.random() * messages[rating].length)];

    // Add improvement context
    if (improvement > 0) {
      baseMessage += ` You've improved by ${improvement.toFixed(1)} points - fantastic progress!`;
    } else if (improvement === 0) {
      baseMessage += " Consistency is key - keep maintaining your performance!";
    }

    return baseMessage;
  }

  // Utility methods
  private getPreviousScore(testType: TestType, previousAssessments?: AssessmentTest[]): number | null {
    if (!previousAssessments || previousAssessments.length === 0) return null;
    
    const sameTypeAssessments = previousAssessments
      .filter(a => a.testType === testType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return sameTypeAssessments.length > 0 ? sameTypeAssessments[0].score : null;
  }

  private calculateTrend(testType: TestType, previousAssessments: AssessmentTest[]): 'improving' | 'stable' | 'declining' {
    const sameTypeAssessments = previousAssessments
      .filter(a => a.testType === testType)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // oldest first

    if (sameTypeAssessments.length < 2) return 'stable';

    const recent = sameTypeAssessments.slice(-3); // last 3 assessments
    let improvements = 0;
    let declines = 0;

    for (let i = 1; i < recent.length; i++) {
      const diff = recent[i].score - recent[i-1].score;
      if (diff > 1) improvements++;
      else if (diff < -1) declines++;
    }

    if (improvements > declines) return 'improving';
    if (declines > improvements) return 'declining';
    return 'stable';
  }

  private calculateNextLevelScore(currentScore: number, benchmark: BenchmarkProfile): number {
    const percentiles = Object.entries(benchmark.percentiles)
      .map(([p, score]) => ({ percentile: parseInt(p), score }))
      .sort((a, b) => a.score - b.score);

    // Find current position and next level
    for (let i = 0; i < percentiles.length; i++) {
      if (currentScore <= percentiles[i].score) {
        const nextLevel = percentiles[Math.min(i + 1, percentiles.length - 1)];
        return nextLevel.score;
      }
    }

    return benchmark.percentiles[99]; // If already at top, aim for 99th percentile
  }

  // Benchmark data retrieval methods
  private getBenchmark(ageGroup: string, gender: string, testType: TestType, sport?: string): BenchmarkProfile {
    const key = `${ageGroup}_${gender}_${testType}${sport ? `_${sport}` : ''}`;
    return this.benchmarkData.get(key) || this.getDefaultBenchmark(ageGroup, gender, testType);
  }

  private getNationalBenchmark(gender: string, testType: TestType): BenchmarkProfile {
    const key = `national_${gender}_${testType}`;
    return this.benchmarkData.get(key) || this.getDefaultBenchmark('19-21', gender, testType);
  }

  private getInternationalBenchmark(gender: string, testType: TestType): BenchmarkProfile {
    const key = `international_${gender}_${testType}`;
    return this.benchmarkData.get(key) || this.getDefaultBenchmark('19-21', gender, testType);
  }

  // Data initialization methods
  private initializeBenchmarkData(): void {
    // Generate comprehensive benchmark data for different age groups, genders, and test types
    const ageGroups = ['14-15', '16-18', '19-21', '22-24', '25-27', '28-30', '31+'];
    const genders = ['male', 'female'];
    const testTypes = Object.values(TestType);

    ageGroups.forEach(ageGroup => {
      genders.forEach(gender => {
        testTypes.forEach(testType => {
          this.benchmarkData.set(
            `${ageGroup}_${gender}_${testType}`,
            this.generateBenchmark(ageGroup, gender, testType)
          );
        });
      });
    });

    // Generate national and international benchmarks
    genders.forEach(gender => {
      testTypes.forEach(testType => {
        this.benchmarkData.set(
          `national_${gender}_${testType}`,
          this.generateBenchmark('national', gender, testType)
        );
        this.benchmarkData.set(
          `international_${gender}_${testType}`,
          this.generateBenchmark('international', gender, testType)
        );
      });
    });
  }

  private initializeAgeGroups(): void {
    this.ageGroups = [
      {
        label: '14-15',
        minAge: 14,
        maxAge: 15,
        developmentStage: 'youth',
        characteristics: ['Rapid physical development', 'Skill acquisition focus', 'Fun-based approach']
      },
      {
        label: '16-18',
        minAge: 16,
        maxAge: 18,
        developmentStage: 'junior',
        characteristics: ['Specialization begins', 'Competitive focus', 'Physical maturation']
      },
      {
        label: '19-21',
        minAge: 19,
        maxAge: 21,
        developmentStage: 'junior',
        characteristics: ['Peak development potential', 'Elite pathway decisions', 'University/college sports']
      },
      {
        label: '22-24',
        minAge: 22,
        maxAge: 24,
        developmentStage: 'senior',
        characteristics: ['Physical peak approaching', 'Professional opportunities', 'Career decisions']
      },
      {
        label: '25-27',
        minAge: 25,
        maxAge: 27,
        developmentStage: 'senior',
        characteristics: ['Physical prime', 'Peak performance years', 'Leadership roles']
      },
      {
        label: '28-30',
        minAge: 28,
        maxAge: 30,
        developmentStage: 'senior',
        characteristics: ['Mature athlete', 'Experience advantage', 'Transition planning']
      },
      {
        label: '31+',
        minAge: 31,
        maxAge: 50,
        developmentStage: 'veteran',
        characteristics: ['Masters competition', 'Fitness maintenance', 'Injury prevention focus']
      }
    ];
  }

  private initializeSportBenchmarks(): void {
    const sportTestImportance = {
      'athletics_speed': { importance: 10, expectedPerformance: { beginner: 60, intermediate: 75, advanced: 85, elite: 95 } },
      'athletics_endurance': { importance: 9, expectedPerformance: { beginner: 55, intermediate: 70, advanced: 82, elite: 92 } },
      'football_agility': { importance: 9, expectedPerformance: { beginner: 65, intermediate: 78, advanced: 87, elite: 96 } },
      'football_speed': { importance: 8, expectedPerformance: { beginner: 62, intermediate: 75, advanced: 85, elite: 94 } },
      'basketball_agility': { importance: 9, expectedPerformance: { beginner: 68, intermediate: 80, advanced: 88, elite: 95 } },
      'basketball_strength': { importance: 7, expectedPerformance: { beginner: 60, intermediate: 73, advanced: 83, elite: 92 } },
      'hockey_speed': { importance: 8, expectedPerformance: { beginner: 63, intermediate: 76, advanced: 86, elite: 94 } },
      'hockey_agility': { importance: 9, expectedPerformance: { beginner: 66, intermediate: 78, advanced: 87, elite: 95 } }
    };

    Object.entries(sportTestImportance).forEach(([key, data]) => {
      const [sport, testType] = key.split('_');
      this.sportBenchmarks.set(key, {
        sport,
        testType: testType as TestType,
        importance: data.importance,
        expectedPerformance: data.expectedPerformance,
        weightModifier: data.importance / 10
      });
    });
  }

  private generateBenchmark(ageGroup: string, gender: string, testType: TestType): BenchmarkProfile {
    // Base scores for different test types
    const baseScores: Partial<Record<TestType, { male: number; female: number }>> = {
      [TestType.TENNIS_STANDING_START]: { male: 75, female: 70 },
      [TestType.FOUR_X_10M_SHUTTLE_RUN]: { male: 72, female: 74 },
      [TestType.MEDICINE_BALL_THROW]: { male: 78, female: 70 },
      [TestType.ENDURANCE_RUN]: { male: 70, female: 72 },
      [TestType.SIT_AND_REACH]: { male: 65, female: 75 },
      [TestType.STANDING_VERTICAL_JUMP]: { male: 70, female: 73 }
    };

    const genderKey = gender as 'male' | 'female';
    const baseScore = (baseScores[testType] || { male: 70, female: 70 })[genderKey];
    
    // Age adjustments
    const ageAdjustments: { [key: string]: number } = {
      '14-15': -8,
      '16-18': -3,
      '19-21': 0,
      '22-24': 2,
      '25-27': 1,
      '28-30': -1,
      '31+': -5,
      'national': 5,
      'international': 8
    };

    const adjustment = ageAdjustments[ageGroup] || 0;
    const adjustedBase = baseScore + adjustment;

    // Generate percentile distribution
    const percentiles = {
      5: adjustedBase - 20,
      25: adjustedBase - 10,
      50: adjustedBase,
      75: adjustedBase + 8,
      90: adjustedBase + 15,
      95: adjustedBase + 20,
      99: adjustedBase + 28
    };

    return {
      ageGroup,
      gender: gender as 'male' | 'female',
      testType,
      percentiles,
      sampleSize: ageGroup.includes('national') ? 10000 : ageGroup.includes('international') ? 50000 : 1000,
      lastUpdated: new Date()
    };
  }

  private getDefaultBenchmark(ageGroup: string, gender: string, testType: TestType): BenchmarkProfile {
    return this.generateBenchmark(ageGroup, gender, testType);
  }

  // Public methods for updating benchmarks
  updateBenchmark(benchmark: BenchmarkProfile): void {
    const key = `${benchmark.ageGroup}_${benchmark.gender}_${benchmark.testType}${benchmark.sport ? `_${benchmark.sport}` : ''}`;
    this.benchmarkData.set(key, benchmark);
  }

  getBenchmarkKeys(): string[] {
    return Array.from(this.benchmarkData.keys());
  }

  // Batch processing for multiple athletes
  async generateBatchFeedback(
    requests: Array<{
      athlete: Athlete;
      assessment: AssessmentTest;
      previousAssessments?: AssessmentTest[];
    }>
  ): Promise<InstantFeedback[]> {
    console.log(`🔄 Generating batch feedback for ${requests.length} assessments...`);
    
    const results = await Promise.all(
      requests.map(({ athlete, assessment, previousAssessments }) =>
        this.generateInstantFeedback(athlete, assessment, previousAssessments)
      )
    );

    console.log(`✅ Batch feedback generation complete.`);
    return results;
  }
}

const benchmarkingService = new BenchmarkingService();
export default benchmarkingService;
export type { 
  BenchmarkProfile, 
  PerformanceComparison, 
  InstantFeedback,
  AgeGroupDefinition,
  SportSpecificBenchmark 
};
