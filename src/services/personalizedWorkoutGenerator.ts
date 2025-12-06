import { AssessmentTest, TestType, Athlete } from '../models';
import { TrainingExercise, TrainingSession } from '../types/trainingTypes';

interface WorkoutPreferences {
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high';
  focus: 'strength' | 'cardio' | 'flexibility' | 'balanced';
  equipment: string[];
}

interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'plyometric';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscles: string[];
  equipment: string[];
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  baseDuration: number; // seconds per rep
  baseReps: number;
  baseSets: number;
  restBetweenSets: number;
  caloriesPerRep: number;
  improves: TestType[]; // Which test types this exercise helps improve
}

class PersonalizedWorkoutGenerator {
  private exerciseLibrary: ExerciseTemplate[] = [
    // Strength Exercises
    {
      id: 'pushup-standard',
      name: 'Push-ups',
      description: 'Classic upper body strength exercise',
      category: 'strength',
      difficulty: 'beginner',
      targetMuscles: ['chest', 'shoulders', 'triceps', 'core'],
      equipment: ['bodyweight'],
      instructions: [
        'Start in a plank position with hands shoulder-width apart',
        'Keep your body in a straight line from head to heels',
        'Lower your chest to the ground by bending elbows',
        'Push back up to starting position',
        'Keep core engaged throughout'
      ],
      baseDuration: 2,
      baseReps: 12,
      baseSets: 3,
      restBetweenSets: 45,
      caloriesPerRep: 0.5,
      improves: [TestType.MEDICINE_BALL_THROW, TestType.SIT_UPS]
    },
    {
      id: 'squat-bodyweight',
      name: 'Bodyweight Squats',
      description: 'Fundamental lower body strength exercise',
      category: 'strength',
      difficulty: 'beginner',
      targetMuscles: ['quads', 'glutes', 'hamstrings', 'core'],
      equipment: ['bodyweight'],
      instructions: [
        'Stand with feet shoulder-width apart',
        'Keep chest up and core engaged',
        'Lower down as if sitting in a chair',
        'Keep knees behind toes',
        'Push through heels to return to standing'
      ],
      baseDuration: 2,
      baseReps: 15,
      baseSets: 3,
      restBetweenSets: 45,
      caloriesPerRep: 0.4,
      improves: [TestType.MEDICINE_BALL_THROW]
    },
    {
      id: 'plank-hold',
      name: 'Plank Hold',
      description: 'Core stability and endurance',
      category: 'strength',
      difficulty: 'beginner',
      targetMuscles: ['core', 'shoulders', 'back'],
      equipment: ['bodyweight'],
      instructions: [
        'Start in forearm plank position',
        'Keep body in straight line',
        'Engage core and glutes',
        'Hold position without sagging',
        'Breathe steadily'
      ],
      baseDuration: 30,
      baseReps: 1,
      baseSets: 3,
      restBetweenSets: 30,
      caloriesPerRep: 3,
      improves: [TestType.MEDICINE_BALL_THROW, TestType.ENDURANCE_RUN, TestType.SIT_UPS]
    },
    {
      id: 'lunges-alternating',
      name: 'Alternating Lunges',
      description: 'Single-leg strength and balance',
      category: 'strength',
      difficulty: 'beginner',
      targetMuscles: ['quads', 'glutes', 'hamstrings', 'calves'],
      equipment: ['bodyweight'],
      instructions: [
        'Stand with feet hip-width apart',
        'Step forward with one leg',
        'Lower hips until both knees are at 90 degrees',
        'Push back to starting position',
        'Alternate legs'
      ],
      baseDuration: 2,
      baseReps: 10,
      baseSets: 3,
      restBetweenSets: 45,
      caloriesPerRep: 0.6,
      improves: [TestType.MEDICINE_BALL_THROW, TestType.STANDING_VERTICAL_JUMP]
    },
    // Cardio Exercises
    {
      id: 'high-knees',
      name: 'High Knees',
      description: 'Cardio and leg power',
      category: 'cardio',
      difficulty: 'intermediate',
      targetMuscles: ['quads', 'hip-flexors', 'calves', 'core'],
      equipment: ['bodyweight'],
      instructions: [
        'Stand with feet hip-width apart',
        'Run in place lifting knees to hip level',
        'Pump arms vigorously',
        'Land softly on balls of feet',
        'Maintain quick pace'
      ],
      baseDuration: 30,
      baseReps: 1,
      baseSets: 3,
      restBetweenSets: 30,
      caloriesPerRep: 5,
      improves: [TestType.TENNIS_STANDING_START, TestType.ENDURANCE_RUN, TestType.FOUR_X_10M_SHUTTLE_RUN]
    },
    {
      id: 'burpees',
      name: 'Burpees',
      description: 'Full body cardio and strength',
      category: 'cardio',
      difficulty: 'advanced',
      targetMuscles: ['full-body'],
      equipment: ['bodyweight'],
      instructions: [
        'Start standing',
        'Drop into squat and place hands on ground',
        'Jump feet back to plank',
        'Do a push-up',
        'Jump feet forward and explode up'
      ],
      baseDuration: 4,
      baseReps: 10,
      baseSets: 3,
      restBetweenSets: 60,
      caloriesPerRep: 1.2,
      improves: [TestType.MEDICINE_BALL_THROW, TestType.ENDURANCE_RUN, TestType.FOUR_X_10M_SHUTTLE_RUN]
    },
    {
      id: 'mountain-climbers',
      name: 'Mountain Climbers',
      description: 'Cardio and core strength',
      category: 'cardio',
      difficulty: 'intermediate',
      targetMuscles: ['core', 'shoulders', 'hip-flexors'],
      equipment: ['bodyweight'],
      instructions: [
        'Start in plank position',
        'Drive one knee toward chest',
        'Quickly switch legs',
        'Keep hips level',
        'Maintain steady rhythm'
      ],
      baseDuration: 30,
      baseReps: 1,
      baseSets: 3,
      restBetweenSets: 30,
      caloriesPerRep: 4,
      improves: [TestType.ENDURANCE_RUN, TestType.FOUR_X_10M_SHUTTLE_RUN, TestType.MEDICINE_BALL_THROW]
    },
    // Plyometric Exercises
    {
      id: 'jump-squats',
      name: 'Jump Squats',
      description: 'Explosive lower body power',
      category: 'plyometric',
      difficulty: 'intermediate',
      targetMuscles: ['quads', 'glutes', 'calves'],
      equipment: ['bodyweight'],
      instructions: [
        'Start in squat position',
        'Explode upward jumping as high as possible',
        'Land softly back into squat',
        'Use arms for momentum',
        'Maintain control'
      ],
      baseDuration: 3,
      baseReps: 12,
      baseSets: 3,
      restBetweenSets: 60,
      caloriesPerRep: 0.8,
      improves: [TestType.STANDING_VERTICAL_JUMP, TestType.STANDING_BROAD_JUMP, TestType.TENNIS_STANDING_START]
    },
    {
      id: 'box-jumps',
      name: 'Box Jumps',
      description: 'Explosive power and coordination',
      category: 'plyometric',
      difficulty: 'advanced',
      targetMuscles: ['quads', 'glutes', 'calves', 'core'],
      equipment: ['box'],
      instructions: [
        'Stand facing a sturdy box or platform',
        'Swing arms and jump onto box',
        'Land softly with knees bent',
        'Step down carefully',
        'Reset and repeat'
      ],
      baseDuration: 4,
      baseReps: 10,
      baseSets: 3,
      restBetweenSets: 60,
      caloriesPerRep: 1.0,
      improves: [TestType.STANDING_VERTICAL_JUMP, TestType.FOUR_X_10M_SHUTTLE_RUN]
    },
    // Flexibility Exercises
    {
      id: 'dynamic-stretching',
      name: 'Dynamic Stretching Routine',
      description: 'Active flexibility and mobility',
      category: 'flexibility',
      difficulty: 'beginner',
      targetMuscles: ['full-body'],
      equipment: ['bodyweight'],
      instructions: [
        'Leg swings forward and back',
        'Arm circles',
        'Hip circles',
        'Torso twists',
        'Walking lunges with twist'
      ],
      baseDuration: 300,
      baseReps: 1,
      baseSets: 1,
      restBetweenSets: 0,
      caloriesPerRep: 15,
      improves: [TestType.SIT_AND_REACH, TestType.STANDING_VERTICAL_JUMP]
    }
  ];

  /**
   * Generate a personalized workout based on assessment results
   */
  generateWorkout(
    assessments: AssessmentTest[],
    athlete: Athlete,
    preferences: WorkoutPreferences
  ): TrainingSession {
    // Analyze weak areas from assessments
    const weakAreas = this.analyzeWeakAreas(assessments);
    const fitnessLevel = this.determineFitnessLevel(assessments);
    
    // Select exercises that target weak areas
    const selectedExercises = this.selectExercises(
      weakAreas,
      fitnessLevel,
      preferences
    );
    
    // Adjust difficulty based on athlete's level
    const adjustedExercises = selectedExercises.map(ex => 
      this.adjustExerciseDifficulty(ex, fitnessLevel, athlete)
    );
    
    // Calculate total duration
    const totalDuration = this.calculateTotalDuration(adjustedExercises);
    
    return {
      id: `workout-${Date.now()}`,
      name: this.generateWorkoutName(weakAreas, preferences.focus),
      description: this.generateWorkoutDescription(weakAreas, fitnessLevel),
      exercises: adjustedExercises,
      totalDuration,
      difficulty: fitnessLevel
    };
  }

  private analyzeWeakAreas(assessments: AssessmentTest[]): TestType[] {
    // Sort assessments by score (lowest first)
    const sorted = [...assessments].sort((a, b) => a.score - b.score);
    
    // Return bottom 40% or at least 2 areas
    const weakCount = Math.max(2, Math.ceil(assessments.length * 0.4));
    return sorted.slice(0, weakCount).map(a => a.testType);
  }

  private determineFitnessLevel(assessments: AssessmentTest[]): 'beginner' | 'intermediate' | 'advanced' {
    if (assessments.length === 0) return 'beginner';
    
    const avgScore = assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length;
    
    if (avgScore < 50) return 'beginner';
    if (avgScore < 75) return 'intermediate';
    return 'advanced';
  }

  private selectExercises(
    weakAreas: TestType[],
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
    preferences: WorkoutPreferences
  ): TrainingExercise[] {
    const exercises: TrainingExercise[] = [];
    
    // Filter exercises by difficulty and equipment
    const availableExercises = this.exerciseLibrary.filter(ex => {
      const difficultyMatch = this.isDifficultyAppropriate(ex.difficulty, fitnessLevel);
      const equipmentMatch = ex.equipment.some(eq => preferences.equipment.includes(eq));
      return difficultyMatch && equipmentMatch;
    });
    
    // Prioritize exercises that improve weak areas
    const prioritizedExercises = availableExercises.sort((a, b) => {
      const aScore = a.improves.filter(t => weakAreas.includes(t)).length;
      const bScore = b.improves.filter(t => weakAreas.includes(t)).length;
      return bScore - aScore;
    });
    
    // Select exercises based on duration and focus
    const targetExerciseCount = this.calculateExerciseCount(preferences.duration);
    
    // Add warm-up
    const warmup = this.exerciseLibrary.find(ex => ex.id === 'dynamic-stretching');
    if (warmup) {
      exercises.push(this.convertToTrainingExercise(warmup));
    }
    
    // Add main exercises
    const mainExercises = prioritizedExercises.slice(0, targetExerciseCount);
    exercises.push(...mainExercises.map(ex => this.convertToTrainingExercise(ex)));
    
    return exercises;
  }

  private isDifficultyAppropriate(
    exerciseDifficulty: 'beginner' | 'intermediate' | 'advanced',
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  ): boolean {
    const levels = { beginner: 0, intermediate: 1, advanced: 2 };
    const exerciseLevel = levels[exerciseDifficulty];
    const userLevel = levels[fitnessLevel];
    
    // Allow exercises at user's level or one level above
    return exerciseLevel <= userLevel + 1;
  }

  private calculateExerciseCount(duration: number): number {
    // Rough estimate: 5-7 minutes per exercise including rest
    return Math.floor(duration / 6);
  }

  private convertToTrainingExercise(template: ExerciseTemplate): TrainingExercise {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      duration: template.baseDuration * template.baseReps,
      sets: template.baseSets,
      reps: template.baseReps,
      restBetweenSets: template.restBetweenSets,
      videoUrl: template.videoUrl,
      imageUrl: template.imageUrl,
      instructions: template.instructions,
      targetMuscles: template.targetMuscles
    };
  }

  private adjustExerciseDifficulty(
    exercise: TrainingExercise,
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
    athlete: Athlete
  ): TrainingExercise {
    const adjusted = { ...exercise };
    
    // Adjust based on fitness level
    switch (fitnessLevel) {
      case 'beginner':
        adjusted.reps = Math.max(5, Math.floor(exercise.reps * 0.7));
        adjusted.sets = Math.max(2, exercise.sets - 1);
        adjusted.restBetweenSets = Math.floor(exercise.restBetweenSets * 1.3);
        break;
      case 'advanced':
        adjusted.reps = Math.floor(exercise.reps * 1.3);
        adjusted.sets = Math.min(5, exercise.sets + 1);
        adjusted.restBetweenSets = Math.floor(exercise.restBetweenSets * 0.8);
        break;
    }
    
    // Adjust based on age
    if (athlete.age > 40) {
      adjusted.restBetweenSets = Math.floor(adjusted.restBetweenSets * 1.2);
    }
    
    return adjusted;
  }

  private calculateTotalDuration(exercises: TrainingExercise[]): number {
    return Math.ceil(
      exercises.reduce((total, ex) => {
        const exerciseTime = (ex.duration * ex.sets) / 60; // Convert to minutes
        const restTime = (ex.restBetweenSets * (ex.sets - 1)) / 60;
        return total + exerciseTime + restTime;
      }, 0)
    );
  }

  private generateWorkoutName(weakAreas: TestType[], focus: string): string {
    const areaNames: Record<string, string> = {
      [TestType.MEDICINE_BALL_THROW]: 'Strength',
      [TestType.TENNIS_STANDING_START]: 'Speed',
      [TestType.ENDURANCE_RUN]: 'Endurance',
      [TestType.SIT_AND_REACH]: 'Flexibility',
      [TestType.FOUR_X_10M_SHUTTLE_RUN]: 'Agility',
      [TestType.STANDING_VERTICAL_JUMP]: 'Balance'
    };
    
    if (weakAreas.length > 0) {
      const primaryArea = areaNames[weakAreas[0]] || 'Fitness';
      return `${primaryArea} Development Workout`;
    }
    
    return `${focus.charAt(0).toUpperCase() + focus.slice(1)} Training`;
  }

  private generateWorkoutDescription(
    weakAreas: TestType[],
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  ): string {
    const level = fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1);
    
    if (weakAreas.length > 0) {
      return `${level}-level workout designed to improve your performance in areas that need attention. Focus on proper form and consistency.`;
    }
    
    return `${level}-level balanced workout to maintain and improve overall fitness.`;
  }

  /**
   * Get exercise library for browsing
   */
  getExerciseLibrary(): ExerciseTemplate[] {
    return this.exerciseLibrary;
  }

  /**
   * Add custom exercise to library
   */
  addExercise(exercise: ExerciseTemplate): void {
    this.exerciseLibrary.push(exercise);
  }
}

const personalizedWorkoutGenerator = new PersonalizedWorkoutGenerator();
export default personalizedWorkoutGenerator;
export type { ExerciseTemplate, WorkoutPreferences };
