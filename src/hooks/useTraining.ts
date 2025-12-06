import { useState, useEffect } from 'react';
import { TestType } from '../models';
import { useAuth } from './useAuth';
import { useApi } from './useApi';

interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  sets: number;
  reps: number;
  restBetweenSets: number;
  videoUrl?: string;
  imageUrl?: string;
  instructions: string[];
  targetMuscles: string[];
}

export interface TrainingSession {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
}

interface GenerateWorkoutParams {
  userId: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutFocus: string[];
  availableTime: number;
  equipmentAvailable: string[];
  injuries: string[];
  goals: string[];
}

export const useTraining = () => {
  const { user } = useAuth();
  const api = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  // Generate a personalized workout based on user data
  const generatePersonalizedWorkout = async (params: GenerateWorkoutParams): Promise<TrainingSession> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would call your backend API
      // const response = await api.post('/training/generate', params);
      // return response.data;
      
      // Mock implementation for now
      return generateMockWorkout(params);
    } catch (err) {
      console.error('Error generating workout:', err);
      setError('Failed to generate workout. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Save a completed training session
  const saveTrainingSession = async (session: {
    userId: string;
    sessionId: string;
    completedAt: Date;
    exercises: Array<{
      exerciseId: string;
      name: string;
      completed: boolean;
    }>;
  }): Promise<void> => {
    try {
      // In a real app, this would call your backend API
      // await api.post('/training/sessions', session);
      console.log('Session saved:', session);
    } catch (err) {
      console.error('Error saving training session:', err);
      throw err;
    }
  };

  // Get user's training history
  const getTrainingHistory = async (userId: string): Promise<TrainingSession[]> => {
    try {
      // In a real app, this would call your backend API
      // const response = await api.get(`/training/users/${userId}/sessions`);
      // return response.data;
      
      // Mock implementation for now
      return [];
    } catch (err) {
      console.error('Error fetching training history:', err);
      throw err;
    }
  };

  // Get a specific training session
  const getTrainingSession = async (sessionId: string): Promise<TrainingSession | null> => {
    try {
      // In a real app, this would call your backend API
      // const response = await api.get(`/training/sessions/${sessionId}`);
      // return response.data;
      
      // Mock implementation for now
      return null;
    } catch (err) {
      console.error('Error fetching training session:', err);
      throw err;
    }
  };

  // Load user's training history on mount
  useEffect(() => {
    if (user?.id) {
      getTrainingHistory(user.id)
        .then(setSessions)
        .catch(console.error);
    }
  }, [user?.id]);

  return {
    isLoading,
    error,
    sessions,
    generatePersonalizedWorkout,
    saveTrainingSession,
    getTrainingHistory,
    getTrainingSession,
  };
};

// Helper function to generate a mock workout based on user parameters
const generateMockWorkout = (params: GenerateWorkoutParams): TrainingSession => {
  const { fitnessLevel, workoutFocus, availableTime } = params;
  
  // Base exercises that can be included
  const allExercises: Exercise[] = [
    {
      id: 'pushup-1',
      name: 'Push-ups',
      description: 'Standard push-ups to build upper body strength',
      duration: 60,
      sets: 3,
      reps: 10,
      restBetweenSets: 30,
      instructions: [
        'Start in a plank position with hands shoulder-width apart',
        'Lower your body until your chest nearly touches the floor',
        'Push back up to the starting position',
        'Keep your core engaged and back straight'
      ],
      targetMuscles: ['chest', 'shoulders', 'triceps']
    },
    {
      id: 'squat-1',
      name: 'Bodyweight Squats',
      description: 'Basic squats to strengthen lower body',
      duration: 60,
      sets: 3,
      reps: 15,
      restBetweenSets: 30,
      instructions: [
        'Stand with feet shoulder-width apart',
        'Lower your body as if sitting in a chair',
        'Keep your knees behind your toes',
        'Return to standing position'
      ],
      targetMuscles: ['quads', 'hamstrings', 'glutes']
    },
    // Add more exercises as needed
  ];
  
  // Filter exercises based on workout focus
  let filteredExercises = allExercises;
  if (workoutFocus.includes('upper_body')) {
    filteredExercises = allExercises.filter(ex => 
      ex.targetMuscles.some(muscle => 
        ['chest', 'shoulders', 'back', 'arms'].includes(muscle)
      )
    );
  } else if (workoutFocus.includes('lower_body')) {
    filteredExercises = allExercises.filter(ex => 
      ex.targetMuscles.some(muscle => 
        ['quads', 'hamstrings', 'glutes', 'calves'].includes(muscle)
      )
    );
  }
  
  // Adjust sets/reps based on fitness level
  const adjustedExercises = filteredExercises.map(exercise => {
    switch (fitnessLevel) {
      case 'beginner':
        return {
          ...exercise,
          sets: Math.max(1, exercise.sets - 1),
          reps: Math.max(5, exercise.reps - 5),
          restBetweenSets: exercise.restBetweenSets + 15
        };
      case 'advanced':
        return {
          ...exercise,
          sets: exercise.sets + 1,
          reps: exercise.reps + 5,
          restBetweenSets: exercise.restBetweenSets - 5
        };
      default:
        return exercise;
    }
  });
  
  // Calculate total duration
  const totalDuration = adjustedExercises.reduce((total, ex) => {
    return total + (ex.duration * ex.sets) + (ex.restBetweenSets * (ex.sets - 1));
  }, 0) / 60; // Convert to minutes
  
  return {
    id: `workout-${Date.now()}`,
    name: `Personalized ${fitnessLevel} Workout`,
    description: `A ${fitnessLevel}-level workout focusing on ${workoutFocus.join(', ')}`,
    exercises: adjustedExercises,
    totalDuration: Math.ceil(totalDuration),
    difficulty: fitnessLevel,
    createdAt: new Date()
  };
};
