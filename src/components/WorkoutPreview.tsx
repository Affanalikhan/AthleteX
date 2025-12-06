import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  PlayArrow,
  FitnessCenter,
  Timer,
  TrendingUp,
  CheckCircle,
  Psychology
} from '@mui/icons-material';
import { TrainingSession } from '../types/trainingTypes';

interface WorkoutPreviewProps {
  session: TrainingSession;
  onStart: () => void;
  aiInsights?: string[];
}

const WorkoutPreview: React.FC<WorkoutPreviewProps> = ({ session, onStart, aiInsights = [] }) => {
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const estimatedCalories = Math.round(session.totalDuration * 5); // Rough estimate

  return (
    <Card elevation={3}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {session.name}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {session.description}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Chip 
              icon={<Timer />}
              label={`${session.totalDuration} minutes`}
              color="primary"
              variant="outlined"
            />
            <Chip 
              icon={<FitnessCenter />}
              label={`${session.exercises.length} exercises`}
              color="primary"
              variant="outlined"
            />
            <Chip 
              icon={<TrendingUp />}
              label={`${totalSets} total sets`}
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={`~${estimatedCalories} cal`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Chip 
            label={session.difficulty.toUpperCase()}
            color={
              session.difficulty === 'beginner' ? 'success' : 
              session.difficulty === 'intermediate' ? 'warning' : 'error'
            }
            sx={{ fontWeight: 'bold', fontSize: '0.9rem', px: 2, py: 0.5 }}
          />
        </Box>

        {aiInsights.length > 0 && (
          <Alert severity="info" icon={<Psychology />} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              🤖 AI Insights
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              {aiInsights.map((insight, index) => (
                <li key={index}>
                  <Typography variant="body2">{insight}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Workout Overview
        </Typography>
        
        <List>
          {session.exercises.map((exercise, index) => (
            <ListItem key={exercise.id} disablePadding sx={{ py: 1 }}>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {index + 1}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={exercise.name}
                secondary={`${exercise.sets} sets × ${exercise.reps} reps`}
                primaryTypographyProps={{ fontWeight: 'medium' }}
              />
              <Chip 
                label={`${Math.floor(exercise.duration / 60)}:${(exercise.duration % 60).toString().padStart(2, '0')}`}
                size="small"
                variant="outlined"
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            💡 Tips for Success
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            <li><Typography variant="body2">Focus on proper form over speed</Typography></li>
            <li><Typography variant="body2">Take breaks when needed</Typography></li>
            <li><Typography variant="body2">Stay hydrated throughout</Typography></li>
            <li><Typography variant="body2">Listen to your body</Typography></li>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<PlayArrow />}
          onClick={onStart}
          sx={{ py: 1.5, fontSize: '1.1rem' }}
        >
          Start Workout
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkoutPreview;
