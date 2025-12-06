// Define the SessionData interface
interface SessionData {
  id: string;
  userId: string;
  exerciseType: string;
  timestamp: Date;
  duration: number;
  metrics: {
    reps?: number;
    formScore?: number;
    caloriesBurned?: number;
    // Add other metrics as needed
  };
  keypoints: any[];
  // Add other session properties as needed
}

// Define the ExerciseSession interface for type safety
interface ExerciseSession {
  exercise: string;
  bestReps: number;
  bestFormScore: number;
  totalSessions: number;
  lastSession: Date;
}

// Exercise configurations with detailed form checks and instructions
export interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl: string;
  formChecks: {
    id: string;
    description: string;
    severity: 'info' | 'warning' | 'error';
    check: (landmarks: any) => { passed: boolean; message?: string; data?: any };
  }[];
  calculateScore: (landmarks: any, history: any[]) => number;
  getInstructions: () => string[];
}

// Exercise database
export const EXERCISES: Record<string, ExerciseConfig> = {
  PUSHUP: {
    id: 'pushup',
    name: 'Push-Up',
    description: 'A classic upper body exercise targeting chest, shoulders, and triceps',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'beginner',
    videoUrl: '/videos/pushup.mp4',
    formChecks: [
      {
        id: 'elbow-extension',
        description: 'Fully extend arms at the top',
        severity: 'warning',
        check: (landmarks) => {
          const leftAngle = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
          const rightAngle = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
          const isExtended = leftAngle > 160 && rightAngle > 160;
          return {
            passed: isExtended,
            message: isExtended ? undefined : 'Extend your arms fully at the top',
            data: { leftAngle, rightAngle }
          };
        }
      },
      // Add more form checks...
    ],
    calculateScore: (landmarks, history) => {
      // Implement scoring logic
      return 0;
    },
    getInstructions: () => [
      'Start in a plank position with hands shoulder-width apart',
      'Keep your body straight from head to heels',
      'Lower your body until your chest nearly touches the floor',
      'Push back up to the starting position',
      'Repeat for the desired number of repetitions'
    ]
  },
  // Add more exercises...
};

// Helper function to calculate angle between three points
function calculateAngle(a: any, b: any, c: any): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs(radians * (180 / Math.PI));
  return degrees > 180 ? 360 - degrees : degrees;
}

// Cloud service integration
export class ExerciseSessionService {
  private static instance: ExerciseSessionService;
  private baseUrl = 'https://api.athletex.com/v1';

  private constructor() {}

  public static getInstance(): ExerciseSessionService {
    if (!ExerciseSessionService.instance) {
      ExerciseSessionService.instance = new ExerciseSessionService();
    }
    return ExerciseSessionService.instance;
  }

  async saveSession(session: SessionData, userId: string, authToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          userId,
          exerciseType: session.exerciseType,
          duration: session.duration,
          metrics: session.metrics,
          timestamp: session.timestamp.toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to save session');
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  async getSessionHistory(userId: string, authToken: string): Promise<SessionData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch session history');
      return await response.json();
    } catch (error) {
      console.error('Error fetching session history:', error);
      return [];
    }
  }

  async getProgressAnalytics(userId: string, exerciseType: string, authToken: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/analytics/progress?userId=${userId}&exerciseType=${exerciseType}`, 
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch progress analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching progress analytics:', error);
      return null;
    }
  }

  async getPersonalizedRecommendations(userId: string, authToken: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/recommendations?userId=${userId}`, 
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }
}

// Analytics service
export class AnalyticsService {
  static calculateTrend(sessions: SessionData[], metric: keyof SessionData['metrics']) {
    if (sessions.length < 2) return 'stable';
    
    const sortedSessions = [...sessions].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    const first = sortedSessions[0].metrics[metric];
    const last = sortedSessions[sortedSessions.length - 1].metrics[metric];
    
    if (typeof first === 'number' && typeof last === 'number') {
      return last > first ? 'improving' : last < first ? 'declining' : 'stable';
    }
    
    return 'stable';
  }

  static getPersonalBests(sessions: SessionData[]) {
    const byExercise = sessions.reduce((acc, session) => {
      if (!acc[session.exerciseType]) {
        acc[session.exerciseType] = [];
      }
      acc[session.exerciseType].push(session);
      return acc;
    }, {} as Record<string, SessionData[]>);

    return Object.entries(byExercise).map(([exercise, exerciseSessions]: [string, SessionData[]]): ExerciseSession => {
      const sessions = exerciseSessions || [];
      const timestamps = sessions.map(s => s.timestamp?.getTime() || 0);
      
      return {
        exercise,
        bestReps: sessions.length > 0 ? Math.max(...sessions.map(s => s.metrics.reps || 0)) : 0,
        bestFormScore: sessions.length > 0 ? Math.max(...sessions.map(s => s.metrics.formScore || 0)) : 0,
        totalSessions: sessions.length,
        lastSession: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date()
      };
    });
  }
}
