import { Exercise } from '../models';

export interface TrainingExercise extends Omit<Exercise, 'duration' | 'reps' | 'imageUrl'> {
  duration: number; // in seconds
  sets: number;
  reps: number;
  restBetweenSets: number; // in seconds
  videoUrl?: string;
  imageUrl?: string;
  instructions: string[];
  targetMuscles: string[];
}

export interface TrainingSession {
  id: string;
  name: string;
  description: string;
  exercises: TrainingExercise[];
  totalDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface CompletedExercise {
  exerciseId: string;
  name: string;
  completed: boolean;
}

export interface TrainingSessionData {
  userId: string;
  sessionId: string;
  completedAt: Date;
  exercises: CompletedExercise[];
}

export interface AITrainingFeedback {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
}
