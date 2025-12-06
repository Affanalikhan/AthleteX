export interface Athlete {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  sportsPlayed: string[];
  primarySport?: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
  profilePictureUrl: string;
  location?: string;
  dietPreference?: 'vegetarian' | 'non-vegetarian' | 'vegan' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentTest {
  id: string;
  athleteId: string;
  testType: TestType;
  videoUrl: string;
  score: number;
  timestamp: Date;
  notes: string;
}

export enum TestType {
  // Fitness Assessment Tests (10 Tests from the table)
  HEIGHT = 'height',                           // Test 1 - Height
  WEIGHT = 'weight',                           // Test 2 - Weight  
  SIT_AND_REACH = 'sit_and_reach',            // Test 3 - Sit and Reach (Flexibility)
  STANDING_VERTICAL_JUMP = 'standing_vertical_jump', // Test 4 - Standing Vertical Jump (Lower Body Explosive Strength)
  STANDING_BROAD_JUMP = 'standing_broad_jump', // Test 5 - Standing Broad Jump (Lower Body Explosive Strength)
  MEDICINE_BALL_THROW = 'medicine_ball_throw', // Test 6 - Medicine Ball Throw (Upper Body Strength)
  TENNIS_STANDING_START = 'tennis_standing_start', // Test 7 - Tennis Standing Start (Speed)
  FOUR_X_10M_SHUTTLE_RUN = 'four_x_10m_shuttle_run', // Test 8 - 4 X 10 Mts Shuttle Run (Agility)
  SIT_UPS = 'sit_ups',                        // Test 9 - Sit Ups (Core Strength)
  ENDURANCE_RUN = 'endurance_run'             // Test 10 - 300m Run for U-12, 1.6km run for 12+ years (Endurance)
}

export interface TrainingPreferences {
  id: string;
  userId: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  availableTime: number; // in minutes
  equipment: string[];
  workoutDays: number[]; // 0-6 for Sunday-Saturday
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening';
  injuries: string[];
  notes: string;
}

export interface AthleteProfile {
  id: string;
  userId: string;
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  sports: string[];
  primarySport: string;
  trainingExperience: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  medicalConditions: string[];
  injuries: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceMetric {
  id: string;
  athleteId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  notes: string;
}

export enum MetricType {
  HEIGHT = 'height',
  WEIGHT = 'weight',
  SIT_AND_REACH = 'sit_and_reach',
  STANDING_VERTICAL_JUMP = 'standing_vertical_jump',
  STANDING_BROAD_JUMP = 'standing_broad_jump',
  MEDICINE_BALL_THROW = 'medicine_ball_throw',
  TENNIS_STANDING_START = 'tennis_standing_start',
  FOUR_X_10M_SHUTTLE_RUN = 'four_x_10m_shuttle_run',
  SIT_UPS = 'sit_ups',
  ENDURANCE_RUN = 'endurance_run'
}

export interface TrainingProgram {
  id: string;
  sport: SportType;
  title: string;
  description: string;
  exercises: Exercise[];
  difficulty: DifficultyLevel;
  duration: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: string;
  reps: string;
  imageUrl: string;
}

export enum SportType {
  FOOTBALL = 'football',
  BASKETBALL = 'basketball',
  HANDBALL = 'handball',
  ATHLETICS = 'athletics',
  HOCKEY = 'hockey',
  KABADDI = 'kabaddi',
  CRICKET = 'cricket',
  SWIMMING = 'swimming',
  VOLLEYBALL = 'volleyball',
  BADMINTON = 'badminton',
  TENNIS = 'tennis',
  BOXING = 'boxing',
  WRESTLING = 'wrestling',
  WEIGHTLIFTING = 'weightlifting',
  GYMNASTICS = 'gymnastics',
  CYCLING = 'cycling',
  ROWING = 'rowing',
  ARCHERY = 'archery',
  SHOOTING = 'shooting',
  JUDO = 'judo',
  TAEKWONDO = 'taekwondo'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export interface SocialPost {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteProfilePicture: string;
  content: string;
  mediaUrl: string;
  mediaType: MediaType;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  timestamp: Date;
}

export interface Comment {
  id: string;
  athleteId: string;
  athleteName: string;
  content: string;
  timestamp: Date;
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video'
}

export interface AdminFilter {
  sport?: SportType;
  minAge?: number;
  maxAge?: number;
  country: string;
  state: string;
  city: string;
}

export interface AthleteRanking {
  athlete: Athlete;
  totalScore: number;
  rank: number;
  isShortlisted: boolean;
}

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  role: 'athlete' | 'admin';
}
