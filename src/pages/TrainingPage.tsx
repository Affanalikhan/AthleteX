import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  FitnessCenter,
  Timer,
  Repeat,
  Star,
  StarBorder,
  PlayArrow,
  Psychology,
  TrendingUp,
  AutoAwesome
} from '@mui/icons-material';
import { SportType, DifficultyLevel, TrainingProgram } from '../models';
import trainingProgramsData from '../data/trainingPrograms.json';
import { useAuth } from '../hooks/useAuth';
import { useAthlete } from '../hooks/useAthlete';
import { useAssessment } from '../hooks/useAssessment';
import personalizedWorkoutGenerator from '../services/personalizedWorkoutGenerator';
import aiTrainingService from '../services/aiTrainingService';
import WorkoutPreview from '../components/WorkoutPreview';
import AITrainingInsights from '../components/AITrainingInsights';
import { TrainingSession } from '../types/trainingTypes';

// Convert JSON data to our TypeScript interface
const trainingPrograms: TrainingProgram[] = trainingProgramsData.map(program => ({
  ...program,
  sport: program.sport as SportType,
  difficulty: program.difficulty as DifficultyLevel
}));

const TrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useAthlete();
  const { assessments, loading: assessmentsLoading } = useAssessment();
  
  // Tab state
  const [currentTab, setCurrentTab] = useState(0);
  
  // Program library state
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // AI Personalized training state
  const [aiWorkout, setAiWorkout] = useState<TrainingSession | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [generatingWorkout, setGeneratingWorkout] = useState(false);

  const filteredPrograms = trainingPrograms.filter(program => {
    const sportMatch = selectedSport === 'all' || program.sport === selectedSport;
    const difficultyMatch = selectedDifficulty === 'all' || program.difficulty === selectedDifficulty;
    return sportMatch && difficultyMatch;
  });

  const toggleFavorite = (programId: string) => {
    setFavorites(prev => 
      prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER:
        return 'success';
      case DifficultyLevel.INTERMEDIATE:
        return 'warning';
      case DifficultyLevel.ADVANCED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getSportIcon = (sport: SportType) => {
    // In a real app, you'd have different icons for different sports
    return <FitnessCenter />;
  };

  // Get sport-specific image URL
  const getSportImage = (sport: SportType): string => {
    const sportImages: Record<SportType, string> = {
      [SportType.FOOTBALL]: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop',
      [SportType.BASKETBALL]: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
      [SportType.HANDBALL]: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=300&fit=crop',
      [SportType.ATHLETICS]: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
      [SportType.HOCKEY]: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=400&h=300&fit=crop',
      [SportType.KABADDI]: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop',
      [SportType.CRICKET]: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=300&fit=crop',
      [SportType.SWIMMING]: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=400&h=300&fit=crop',
      [SportType.VOLLEYBALL]: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=300&fit=crop',
      [SportType.BADMINTON]: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=300&fit=crop',
      [SportType.TENNIS]: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop',
      [SportType.BOXING]: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop',
      [SportType.WRESTLING]: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=300&fit=crop',
      [SportType.WEIGHTLIFTING]: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
      [SportType.GYMNASTICS]: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
      [SportType.CYCLING]: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400&h=300&fit=crop',
      [SportType.ROWING]: 'https://images.unsplash.com/photo-1593891127583-51e6d49e1c4f?w=400&h=300&fit=crop',
      [SportType.ARCHERY]: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
      [SportType.SHOOTING]: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=400&h=300&fit=crop',
      [SportType.JUDO]: 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=400&h=300&fit=crop',
      [SportType.TAEKWONDO]: 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=400&h=300&fit=crop'
    };
    
    return sportImages[sport] || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop';
  };

  // Generate AI workout when tab changes to AI training
  useEffect(() => {
    if (currentTab === 1 && profile && assessments.length > 0 && !aiWorkout) {
      generateAIWorkout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, profile, assessments]);

  const generateAIWorkout = () => {
    if (!profile || assessments.length === 0) return;
    
    setGeneratingWorkout(true);
    try {
      const workout = personalizedWorkoutGenerator.generateWorkout(
        assessments,
        profile,
        {
          duration: 30,
          intensity: 'medium',
          focus: 'balanced',
          equipment: ['bodyweight']
        }
      );
      
      setAiWorkout(workout);
      
      // Generate recommendations
      const recommendations = aiTrainingService.generateRecommendations(
        assessments,
        profile,
        ['general_fitness', 'strength', 'endurance']
      );
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating AI workout:', error);
    } finally {
      setGeneratingWorkout(false);
    }
  };

  const handleStartAIWorkout = () => {
    // Navigate to the personalized training page to start the workout
    navigate('/training/personalized');
  };

  const renderAITrainingTab = () => {
    // Loading state
    if (profileLoading || assessmentsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading your data...
            </Typography>
          </Box>
        </Box>
      );
    }

    // Missing data state
    if (!profile || assessments.length === 0) {
      return (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Psychology sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              🤖 AI-Powered Personalized Training
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Get a workout plan tailored specifically to your strengths and weaknesses!
            </Typography>
          </Box>

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

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
            {!profile && (
              <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate('/profile')}
              >
                Complete Profile
              </Button>
            )}
            <Button 
              variant={profile ? 'contained' : 'outlined'}
              size="large"
              onClick={() => navigate('/assessments')}
            >
              Take Assessments
            </Button>
          </Box>
        </Paper>
      );
    }

    // Generating workout
    if (generatingWorkout) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              🤖 AI is creating your personalized workout...
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Analyzing your assessment results to target your weak areas
            </Typography>
          </Box>
        </Box>
      );
    }

    // Show workout
    if (aiWorkout) {
      const aiInsights = [
        `This workout targets your weak areas based on ${assessments.length} assessment${assessments.length > 1 ? 's' : ''}`,
        `Difficulty adjusted to your ${aiWorkout.difficulty} fitness level`,
        `Focus on form and consistency for best results`
      ];

      return (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <WorkoutPreview
              session={aiWorkout}
              onStart={handleStartAIWorkout}
              aiInsights={aiInsights}
            />
          </Grid>
          <Grid item xs={12} lg={4}>
            <AITrainingInsights
              recommendations={aiRecommendations}
              showRecommendations={true}
            />
          </Grid>
        </Grid>
      );
    }

    return null;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Training
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Choose from pre-made programs or get an AI-personalized workout
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 4 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<FitnessCenter />} 
            label="Training Programs" 
            iconPosition="start"
          />
          <Tab 
            icon={<AutoAwesome />} 
            label="AI Personalized" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentTab === 0 && (
        <>
          {/* Filters */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filter Programs
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Sport</InputLabel>
              <Select
                value={selectedSport}
                label="Sport"
                onChange={(e) => setSelectedSport(e.target.value as SportType | 'all')}
              >
                <MenuItem value="all">All Sports</MenuItem>
                {Object.values(SportType).map((sport) => (
                  <MenuItem key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={selectedDifficulty}
                label="Difficulty"
                onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel | 'all')}
              >
                <MenuItem value="all">All Levels</MenuItem>
                {Object.values(DifficultyLevel).map((level) => (
                  <MenuItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Programs Grid */}
      <Grid container spacing={3}>
        {filteredPrograms.map((program) => (
          <Grid item xs={12} sm={6} md={4} key={program.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={getSportImage(program.sport)}
                alt={`${program.sport} training`}
                sx={{
                  objectFit: 'cover',
                  backgroundColor: 'grey.300'
                }}
              />
              <Box
                sx={{
                  position: 'relative',
                  mt: -6,
                  mx: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 1,
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {getSportIcon(program.sport)}
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {program.sport.charAt(0).toUpperCase() + program.sport.slice(1).replace('_', ' ')}
                </Typography>
              </Box>

              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="h2">
                    {program.title}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => toggleFavorite(program.id)}
                    startIcon={favorites.includes(program.id) ? <Star /> : <StarBorder />}
                  >
                    {favorites.includes(program.id) ? 'Favorited' : 'Favorite'}
                  </Button>
                </Box>

                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    label={program.difficulty}
                    color={getDifficultyColor(program.difficulty)}
                    size="small"
                  />
                  <Chip
                    label={program.duration}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {program.description}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {program.exercises.length} exercises included
                </Typography>
              </CardContent>

              <CardActions sx={{ gap: 1, px: 2, pb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setSelectedProgram(program)}
                  fullWidth
                >
                  View Details
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AutoAwesome />}
                  onClick={() => setCurrentTab(1)}
                  fullWidth
                >
                  AI Training
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredPrograms.length === 0 && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No training programs found for the selected filters.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your sport or difficulty level filters.
          </Typography>
        </Paper>
      )}
        </>
      )}

      {/* AI Personalized Tab */}
      {currentTab === 1 && renderAITrainingTab()}

      {/* Program Details Dialog */}
      <Dialog
        open={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedProgram && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">
                  {selectedProgram.title}
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip
                    label={selectedProgram.difficulty}
                    color={getDifficultyColor(selectedProgram.difficulty)}
                  />
                  <Chip
                    label={selectedProgram.duration}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedProgram.description}
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Exercises ({selectedProgram.exercises.length})
              </Typography>

              {selectedProgram.exercises.map((exercise, index) => (
                <Accordion key={exercise.id}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" width="100%">
                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        {index + 1}. {exercise.name}
                      </Typography>
                      <Box display="flex" gap={2} mr={2}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Timer fontSize="small" />
                          <Typography variant="body2">{exercise.duration}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Repeat fontSize="small" />
                          <Typography variant="body2">{exercise.reps}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {exercise.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" display="block">
                        <strong>Duration:</strong> {exercise.duration}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Repetitions:</strong> {exercise.reps}
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setSelectedProgram(null)}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => {
                  setSelectedProgram(null);
                  setCurrentTab(1);
                }}
              >
                Get AI Training
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default TrainingPage;
