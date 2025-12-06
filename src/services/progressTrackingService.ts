// Types are defined in this file

export interface WorkoutSession {
  id: string;
  date: string;
  exerciseType: string;
  reps: number;
  formScore: number;
  duration: number;
  videoUrl?: string;
  notes?: string;
}

export interface ProgressMetrics {
  totalWorkouts: number;
  totalReps: number;
  averageFormScore: number;
  bestFormScore: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: {
    week: string;
    workouts: number;
    reps: number;
    avgFormScore: number;
  }[];
  exerciseBreakdown: {
    [exerciseType: string]: {
      count: number;
      totalReps: number;
      avgFormScore: number;
      bestFormScore: number;
      improvement: number;
    };
  };
  recentSessions: WorkoutSession[];
}

export interface PersonalRecord {
  exerciseType: string;
  metric: 'reps' | 'formScore' | 'duration';
  value: number;
  date: string;
  sessionId: string;
}

class ProgressTrackingService {
  private readonly STORAGE_KEY = 'workout_sessions';
  private readonly RECORDS_KEY = 'personal_records';

  saveWorkoutSession(session: Omit<WorkoutSession, 'id'>): WorkoutSession {
    const sessions = this.getAllSessions();
    const newSession: WorkoutSession = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    sessions.push(newSession);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    
    // Check and update personal records
    this.updatePersonalRecords(newSession);
    
    return newSession;
  }

  getAllSessions(): WorkoutSession[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getSessionById(id: string): WorkoutSession | null {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === id) || null;
  }

  getSessionsByExercise(exerciseType: string): WorkoutSession[] {
    return this.getAllSessions().filter(s => s.exerciseType === exerciseType);
  }

  getSessionsByDateRange(startDate: Date, endDate: Date): WorkoutSession[] {
    const sessions = this.getAllSessions();
    return sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  deleteSession(id: string): boolean {
    const sessions = this.getAllSessions();
    const filtered = sessions.filter(s => s.id !== id);
    
    if (filtered.length === sessions.length) {
      return false;
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  getProgressMetrics(): ProgressMetrics {
    const sessions = this.getAllSessions();
    
    if (sessions.length === 0) {
      return this.getEmptyMetrics();
    }

    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate basic metrics
    const totalWorkouts = sessions.length;
    const totalReps = sessions.reduce((sum, s) => sum + s.reps, 0);
    const averageFormScore = sessions.reduce((sum, s) => sum + s.formScore, 0) / totalWorkouts;
    const bestFormScore = Math.max(...sessions.map(s => s.formScore));

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(sortedSessions);

    // Calculate weekly progress
    const weeklyProgress = this.calculateWeeklyProgress(sortedSessions);

    // Calculate exercise breakdown
    const exerciseBreakdown = this.calculateExerciseBreakdown(sessions);

    // Get recent sessions (last 10)
    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      totalWorkouts,
      totalReps,
      averageFormScore,
      bestFormScore,
      currentStreak,
      longestStreak,
      weeklyProgress,
      exerciseBreakdown,
      recentSessions,
    };
  }

  private calculateStreaks(sortedSessions: WorkoutSession[]): { currentStreak: number; longestStreak: number } {
    if (sortedSessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unique workout dates
    const uniqueDates = new Set<number>();
    sortedSessions.forEach(s => {
      const date = new Date(s.date);
      date.setHours(0, 0, 0, 0);
      uniqueDates.add(date.getTime());
    });
    const workoutDates = Array.from(uniqueDates).sort((a, b) => a - b);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Calculate current streak
    const lastWorkoutDate = new Date(workoutDates[workoutDates.length - 1]);
    const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastWorkout <= 1) {
      currentStreak = 1;
      for (let i = workoutDates.length - 2; i >= 0; i--) {
        const dayDiff = Math.floor((workoutDates[i + 1] - workoutDates[i]) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < workoutDates.length; i++) {
      const dayDiff = Math.floor((workoutDates[i] - workoutDates[i - 1]) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  private calculateWeeklyProgress(sortedSessions: WorkoutSession[]) {
    const weeklyData: { [key: string]: WorkoutSession[] } = {};
    
    sortedSessions.forEach(session => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = [];
      }
      weeklyData[weekKey].push(session);
    });

    return Object.entries(weeklyData)
      .map(([week, sessions]) => ({
        week,
        workouts: sessions.length,
        reps: sessions.reduce((sum, s) => sum + s.reps, 0),
        avgFormScore: sessions.reduce((sum, s) => sum + s.formScore, 0) / sessions.length,
      }))
      .sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
      .slice(0, 12); // Last 12 weeks
  }

  private calculateExerciseBreakdown(sessions: WorkoutSession[]) {
    const breakdown: ProgressMetrics['exerciseBreakdown'] = {};

    sessions.forEach(session => {
      if (!breakdown[session.exerciseType]) {
        breakdown[session.exerciseType] = {
          count: 0,
          totalReps: 0,
          avgFormScore: 0,
          bestFormScore: 0,
          improvement: 0,
        };
      }

      const ex = breakdown[session.exerciseType];
      ex.count++;
      ex.totalReps += session.reps;
      ex.bestFormScore = Math.max(ex.bestFormScore, session.formScore);
    });

    // Calculate averages and improvement
    Object.keys(breakdown).forEach(exerciseType => {
      const exerciseSessions = sessions
        .filter(s => s.exerciseType === exerciseType)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const ex = breakdown[exerciseType];
      ex.avgFormScore = exerciseSessions.reduce((sum, s) => sum + s.formScore, 0) / ex.count;

      // Calculate improvement (compare first half vs second half)
      if (exerciseSessions.length >= 4) {
        const midPoint = Math.floor(exerciseSessions.length / 2);
        const firstHalf = exerciseSessions.slice(0, midPoint);
        const secondHalf = exerciseSessions.slice(midPoint);

        const firstAvg = firstHalf.reduce((sum, s) => sum + s.formScore, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, s) => sum + s.formScore, 0) / secondHalf.length;

        ex.improvement = ((secondAvg - firstAvg) / firstAvg) * 100;
      }
    });

    return breakdown;
  }

  private getEmptyMetrics(): ProgressMetrics {
    return {
      totalWorkouts: 0,
      totalReps: 0,
      averageFormScore: 0,
      bestFormScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyProgress: [],
      exerciseBreakdown: {},
      recentSessions: [],
    };
  }

  private updatePersonalRecords(session: WorkoutSession): void {
    const records = this.getPersonalRecords();
    
    // Check reps record
    this.checkAndUpdateRecord(records, session, 'reps', session.reps);
    
    // Check form score record
    this.checkAndUpdateRecord(records, session, 'formScore', session.formScore);
    
    // Check duration record
    this.checkAndUpdateRecord(records, session, 'duration', session.duration);
    
    localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
  }

  private checkAndUpdateRecord(
    records: PersonalRecord[],
    session: WorkoutSession,
    metric: PersonalRecord['metric'],
    value: number
  ): void {
    const existingRecord = records.find(
      r => r.exerciseType === session.exerciseType && r.metric === metric
    );

    if (!existingRecord || value > existingRecord.value) {
      const newRecord: PersonalRecord = {
        exerciseType: session.exerciseType,
        metric,
        value,
        date: session.date,
        sessionId: session.id,
      };

      if (existingRecord) {
        const index = records.indexOf(existingRecord);
        records[index] = newRecord;
      } else {
        records.push(newRecord);
      }
    }
  }

  getPersonalRecords(): PersonalRecord[] {
    const data = localStorage.getItem(this.RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getRecordsByExercise(exerciseType: string): PersonalRecord[] {
    return this.getPersonalRecords().filter(r => r.exerciseType === exerciseType);
  }

  exportData(): string {
    const sessions = this.getAllSessions();
    const records = this.getPersonalRecords();
    
    return JSON.stringify({
      sessions,
      records,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.sessions && Array.isArray(data.sessions)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.sessions));
      }
      
      if (data.records && Array.isArray(data.records)) {
        localStorage.setItem(this.RECORDS_KEY, JSON.stringify(data.records));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.RECORDS_KEY);
  }
}

export const progressTrackingService = new ProgressTrackingService();
