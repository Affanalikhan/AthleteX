import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  FitnessCenter,
  Timer,
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon,
  Close
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useAssessment } from '../hooks/useAssessment';
import { useTraining } from '../hooks/useTraining';
import { useAthlete } from '../hooks/useAthlete';
import ExerciseProgressTracker from '../components/ExerciseProgressTracker';
import VideoRecorder from '../components/VideoRecorder';
import AITrainingInsights from '../components/AITrainingInsights';
import WorkoutPreview from '../components/WorkoutPreview';
import { TestType } from '../models';
import { TrainingSession, TrainingExercise, AITrainingFeedback } from '../types/trainingTypes';
import aiTrainingService, { PersonalizedRecommendation, AITrainingInsight, RealTimeMetrics } from '../services/aiTrainingService';
import personalizedWorkoutGenerator from '../services/personalizedWorkoutGenerator';
import voiceTrainerService from '../services/voiceTrainerService';
import VoiceTrainerSettings from '../components/VoiceTrainerSettings';

// Use the TrainingExercise and TrainingSession types from trainingTypes

const PersonalizedTrainingPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useAthlete();
  const { latestAssessments, assessments, loading: assessmentsLoading } = useAssessment();
  const { generatePersonalizedWorkout, saveTrainingSession } = useTraining();
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    console.log('PersonalizedTrainingPage mounted', {
      user: !!user,
      profile: !!profile,
      profileLoading,
      assessmentsCount: assessments?.length || 0,
      assessmentsLoading
    });
  }, [user, profile, profileLoading, assessments, assessmentsLoading]);

  const [isLoading, setIsLoading] = useState(true);
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [showInstructions, setShowInstructions] = useState(true);
  const [aiFeedback, setAiFeedback] = useState<AITrainingFeedback | null>(null);
  
  // AI-powered features
  const [aiRecommendations, setAiRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [realTimeInsight, setRealTimeInsight] = useState<AITrainingInsight | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<RealTimeMetrics>({
    currentPace: 1.0,
    targetPace: 1.0,
    formScore: 85,
    fatigueLevel: 20,
    caloriesBurned: 0,
    heartRateZone: 'cardio'
  });
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [lastMotivationTime, setLastMotivationTime] = useState(0);

  // Generate personalized workout and AI recommendations
  useEffect(() => {
    const generateWorkout = () => {
      try {
        console.log('Generating workout...', { profile, assessmentsCount: assessments.length });
        setIsLoading(true);
        
        // Check if we have assessments and profile
        if (!profile || assessments.length === 0) {
          console.log('Missing profile or assessments', { hasProfile: !!profile, assessmentsCount: assessments.length });
          setIsLoading(false);
          return;
        }
        
        const goals = ['general_fitness', 'strength', 'endurance'];
        
        // Generate AI-powered personalized workout based on assessment results
        const workout = personalizedWorkoutGenerator.generateWorkout(
          assessments,
          profile,
          {
            duration: 30, // 30 minutes
            intensity: 'medium',
            focus: 'balanced',
            equipment: ['bodyweight']
          }
        );
        
        setTrainingSession(workout);
        setTimeRemaining(workout.exercises[0]?.duration || 0);
        
        // Generate AI recommendations
        const recommendations = aiTrainingService.generateRecommendations(
          assessments,
          profile,
          goals
        );
        setAiRecommendations(recommendations);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error generating workout:', error);
        setIsLoading(false);
      }
    };

    generateWorkout();
  }, [profile, assessments]);

  // Timer effect with real-time insights
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleExerciseComplete();
            return 0;
          }
          
          // Voice countdown announcements
          if (prev <= 10 && prev > 0) {
            voiceTrainerService.announceCountdown(prev);
          }
          
          return prev - 1;
        });
        
        setElapsedTime(prev => {
          const newTime = prev + 1;
          
          // Motivational messages every 30 seconds
          if (newTime - lastMotivationTime >= 30 && newTime % 30 === 0) {
            const intensity = currentMetrics.fatigueLevel > 70 ? 'high' : 
                            currentMetrics.fatigueLevel > 40 ? 'medium' : 'low';
            voiceTrainerService.motivate(intensity);
            setLastMotivationTime(newTime);
          }
          
          return newTime;
        });
        
        // Update metrics (simulated - in real app, this would come from sensors/camera)
        setCurrentMetrics(prev => {
          const newMetrics = {
            ...prev,
            currentPace: 0.9 + Math.random() * 0.3, // Simulated pace variation
            formScore: Math.max(60, Math.min(100, prev.formScore + (Math.random() - 0.5) * 5)),
            fatigueLevel: Math.min(100, prev.fatigueLevel + 0.5),
            caloriesBurned: prev.caloriesBurned + 0.15
          };
          
          // Generate real-time insight every 10 seconds
          if (elapsedTime % 10 === 0 && trainingSession) {
            const insight = aiTrainingService.generateRealTimeInsight(
              trainingSession.exercises[currentExerciseIndex],
              newMetrics,
              elapsedTime,
              currentSet
            );
            if (insight) {
              setRealTimeInsight(insight);
            }
          }
          
          return newMetrics;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining, elapsedTime, currentExerciseIndex, currentSet, trainingSession]);

  const calculateFitnessLevel = (): 'beginner' | 'intermediate' | 'advanced' => {
    // Simple logic - in a real app, this would be more sophisticated
    const pushupScore = latestAssessments[TestType.SIT_UPS]?.score || 0;
    const sprintScore = latestAssessments[TestType.TENNIS_STANDING_START]?.score || 0;
    
    const avgScore = (pushupScore + sprintScore) / 2;
    
    if (avgScore < 40) return 'beginner';
    if (avgScore < 75) return 'intermediate';
    return 'advanced';
  };

  const determineWorkoutFocus = (): string[] => {
    // Determine focus areas based on assessment results
    const focusAreas: string[] = [];
    
    if ((latestAssessments[TestType.SIT_UPS]?.score || 0) < 50) {
      focusAreas.push('upper_body');
    }
    
    if ((latestAssessments[TestType.TENNIS_STANDING_START]?.score || 0) < 50) {
      focusAreas.push('cardio', 'explosiveness');
    }
    
    // Using STANDING_LONG_JUMP instead of LONG_JUMP
    if ((latestAssessments[TestType.STANDING_BROAD_JUMP]?.score || 0) < 50) {
      focusAreas.push('lower_body', 'explosiveness');
    }
    
    return focusAreas.length > 0 ? focusAreas : ['general_fitness'];
  };

  const handleStartExercise = () => {
    setIsPlaying(true);
    setShowInstructions(false);
    
    // Voice announcement
    if (trainingSession && !workoutStarted) {
      voiceTrainerService.welcomeMessage(profile?.name);
      setWorkoutStarted(true);
    }
    
    if (trainingSession) {
      const exercise = trainingSession.exercises[currentExerciseIndex];
      voiceTrainerService.announcePhase({
        type: 'exercise',
        exerciseName: exercise.name,
        duration: exercise.duration,
        reps: exercise.reps,
        setNumber: currentSet
      });
    }
  };

  const handlePauseExercise = () => {
    setIsPlaying(false);
    voiceTrainerService.pause();
  };

  const handleNextExercise = () => {
    if (!trainingSession) return;
    
    if (currentExerciseIndex < trainingSession.exercises.length - 1) {
      // Announce progress
      voiceTrainerService.announceProgress(
        currentExerciseIndex + 1,
        trainingSession.exercises.length
      );
      
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setTimeRemaining(trainingSession.exercises[currentExerciseIndex + 1].duration);
      setShowInstructions(true);
      setIsPlaying(false);
    } else {
      // Workout complete
      voiceTrainerService.announcePhase({ type: 'complete' });
      handleWorkoutComplete();
    }
  };

  const handleExerciseComplete = () => {
    if (!trainingSession) return;
    
    const currentExercise = trainingSession.exercises[currentExerciseIndex];
    
    if (currentSet < currentExercise.sets) {
      // Move to next set
      setCurrentSet(currentSet + 1);
      setTimeRemaining(currentExercise.restBetweenSets);
      setAiFeedback({
        message: `Great job! Take a ${currentExercise.restBetweenSets} second break before the next set.`,
        type: 'success',
        timestamp: new Date()
      });
    } else {
      // Move to next exercise
      handleNextExercise();
    }
  };

  const handleWorkoutComplete = async () => {
    if (!trainingSession) return;
    
    try {
await saveTrainingSession({
        userId: user?.id || '',
        sessionId: trainingSession.id,
        completedAt: new Date(),
        exercises: trainingSession.exercises.map((ex: TrainingExercise) => ({
          exerciseId: ex.id,
          name: ex.name,
          completed: true
        }))
      });
      
      // Show completion message
      setAiFeedback({
        message: 'Workout completed! Great job!',
        type: 'success',
        timestamp: new Date()
      });
      
      // Navigate to workout summary after a delay
      setTimeout(() => {
        navigate(`/workout-summary/${trainingSession.id}`);
      }, 3000);
    } catch (error) {
      console.error('Error saving workout:', error);
      setAiFeedback({
        message: 'Error saving workout. Your progress may not have been saved.',
        type: 'error',
        timestamp: new Date()
      });
    }
  };

  const getFeedbackIcon = () => {
    if (!aiFeedback) return null;
    
    switch (aiFeedback.type) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  // Show loading while data is being fetched
  if (profileLoading || assessmentsLoading || isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {profileLoading || assessmentsLoading ? 'Loading your data...' : '🤖 AI is creating your personalized workout...'}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {profileLoading || assessmentsLoading ? 'Please wait' : 'Analyzing your assessment results to target your weak areas'}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!profile || !assessments || assessments.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              🤖 AI-Powered Personalized Training
            </Typography>
            <Typography variant="body2" paragraph>
              Get a workout plan tailored specifically to your strengths and weaknesses!
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Setup Required
            </Typography>
            <Typography variant="body2" paragraph>
              To generate your personalized AI workout, you need to:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>
                <Typography variant="body2">
                  {profile ? '✅ Profile completed' : '❌ Complete your athlete profile'}
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  {assessments && assessments.length > 0 
                    ? `✅ ${assessments.length} assessment${assessments.length > 1 ? 's' : ''} completed` 
                    : '❌ Take at least 2 assessment tests'}
                </Typography>
              </li>
            </Box>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            {!profile && (
              <Button 
                variant="contained" 
                onClick={() => navigate('/profile')}
                fullWidth
              >
                Complete Profile
              </Button>
            )}
            <Button 
              variant={profile ? 'contained' : 'outlined'}
              onClick={() => navigate('/assessments')}
              fullWidth
            >
              Take Assessments
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!trainingSession) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Unable to generate a personalized workout. Please try again or contact support.
        </Alert>
      </Container>
    );
  }

  const currentExercise = trainingSession.exercises[currentExerciseIndex];
  const progress = (currentExerciseIndex / trainingSession.exercises.length) * 100;
  const isLastExercise = currentExerciseIndex === trainingSession.exercises.length - 1;

  // Show workout preview before starting
  if (!workoutStarted) {
    const aiInsights = [
      `This workout targets your weak areas based on ${assessments.length} assessment${assessments.length > 1 ? 's' : ''}`,
      `Difficulty adjusted to your ${trainingSession.difficulty} fitness level`,
      `Focus on form and consistency for best results`
    ];

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <WorkoutPreview
          session={trainingSession}
          onStart={() => setWorkoutStarted(true)}
          aiInsights={aiInsights}
        />
      </Container>
    );
  }

  return (
    <>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {trainingSession.name}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowVoiceSettings(true)}
            sx={{ mr: 1 }}
          >
            🎙️ Voice Trainer
          </Button>
          <Chip 
            icon={<FitnessCenter />}
            label={trainingSession.difficulty.toUpperCase()} 
            color={
              trainingSession.difficulty === 'beginner' ? 'success' : 
              trainingSession.difficulty === 'intermediate' ? 'warning' : 'error'
            } 
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Typography variant="body1" color="textSecondary" paragraph>
          {trainingSession.description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip 
            icon={<Timer />}
            label={`${trainingSession.totalDuration} min`}
            variant="outlined"
          />
          <Chip 
            icon={<FitnessCenter />}
            label={`${trainingSession.exercises.length} exercises`}
            variant="outlined"
          />
          <Chip 
            icon={<CheckCircle />}
            label={`${Math.round(progress)}% complete`}
            variant="outlined"
            color="primary"
          />
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 10, borderRadius: 5, mb: 3 }} 
        />
      </Box>

      {/* AI Recommendations Toggle */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant={showRecommendations ? 'contained' : 'outlined'}
          onClick={() => setShowRecommendations(!showRecommendations)}
          startIcon={<Info />}
        >
          {showRecommendations ? 'Hide' : 'Show'} AI Recommendations
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* AI Recommendations Panel */}
        {showRecommendations && (
          <Grid item xs={12}>
            <AITrainingInsights
              recommendations={aiRecommendations}
              showRecommendations={true}
            />
          </Grid>
        )}

        <Grid item xs={12} md={8}>
          {/* Real-time AI Insights */}
          <Box sx={{ mb: 2 }}>
            <AITrainingInsights
              realTimeInsight={realTimeInsight}
              currentMetrics={isPlaying ? currentMetrics : undefined}
              showRecommendations={false}
            />
          </Box>

          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h5" component="h2">
                  {currentExercise.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Exercise {currentExerciseIndex + 1} of {trainingSession.exercises.length}
                </Typography>
              </Box>
              <Box>
                <Chip 
                  icon={<Timer />} 
                  label={`${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`} 
                  color={isPlaying ? 'primary' : 'default'}
                  variant={isPlaying ? 'filled' : 'outlined'}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <VideoRecorder 
                onVideoReady={() => {}}
                onUpload={() => Promise.resolve()}
                uploading={false}
              />
            </Box>

            {showInstructions ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Instructions
                </Typography>
                <Box component="ul" sx={{ pl: 2.5, mb: 3 }}>
                  {currentExercise.instructions.map((instruction: string, index: number) => (
                    <li key={index} style={{ marginBottom: 8 }}>
                      <Typography variant="body1">{instruction}</Typography>
                    </li>
                  ))}
                </Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large" 
                  fullWidth
                  onClick={handleStartExercise}
                  startIcon={<PlayArrow />}
                >
                  Start Exercise
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                {isPlaying ? (
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={handlePauseExercise}
                    startIcon={<Pause />}
                  >
                    Pause
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleStartExercise}
                    startIcon={<PlayArrow />}
                  >
                    Resume
                  </Button>
                )}
                
                <Button 
                  variant="outlined" 
                  onClick={handleNextExercise}
                  endIcon={<SkipNext />}
                >
                  {isLastExercise ? 'Finish Workout' : 'Skip Exercise'}
                </Button>
              </Box>
            )}

            {aiFeedback && (
              <Alert 
                severity={aiFeedback.type} 
                icon={getFeedbackIcon()}
                sx={{ mb: 2 }}
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => setAiFeedback(null)}
                  >
                    <Close fontSize="inherit" />
                  </IconButton>
                }
              >
                {aiFeedback.message}
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Workout Progress
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Exercise {currentExerciseIndex + 1} of {trainingSession.exercises.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {Math.round(progress)}% complete
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            </Box>

            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Current Exercise:
            </Typography>
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1">{currentExercise.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                Set {currentSet} of {currentExercise.sets} • {currentExercise.reps} reps
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
              Up Next:
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
              {trainingSession.exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 3).map((exercise: TrainingExercise, index: number) => (
                <li key={exercise.id} style={{ marginBottom: 8 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 1.5, 
                    borderRadius: 1,
                    bgcolor: index === 0 ? 'action.selected' : 'background.paper',
                    border: index === 0 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}>
                    <FitnessCenter color="action" sx={{ mr: 1.5 }} />
                    <Box>
                      <Typography variant="body2">{exercise.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {exercise.sets} sets × {exercise.reps} reps
                      </Typography>
                    </Box>
                  </Box>
                </li>
              ))}
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Exercise Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Target Muscles:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {currentExercise.targetMuscles.map((muscle: string) => (
                  <Chip 
                    key={muscle} 
                    label={muscle.replace('_', ' ')} 
                    size="small" 
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Instructions:</Typography>
              <Box component="ol" sx={{ pl: 2.5, mt: 0.5 }}>
                {currentExercise.instructions.map((step: string, index: number) => (
                  <li key={index} style={{ marginBottom: 4 }}>
                    <Typography variant="body2">{step}</Typography>
                  </li>
                ))}
              </Box>
            </Box>

            <Button 
              variant="text" 
              color="primary" 
              size="small"
              onClick={() => setShowInstructions(true)}
              disabled={showInstructions}
            >
              Show Instructions Again
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>

      {/* Voice Trainer Settings Dialog */}
      <Dialog
        open={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          AI Voice Trainer Settings
        </DialogTitle>
        <DialogContent>
          <VoiceTrainerSettings />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVoiceSettings(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PersonalizedTrainingPage;
