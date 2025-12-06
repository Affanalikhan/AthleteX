import React, { useState } from 'react';
import { Container, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import PoseAnalysisRecorder from '../components/PoseAnalysisRecorder';

const ExerciseAnalysisPage: React.FC = () => {
  const [exerciseType, setExerciseType] = useState<string>('Pushups');

  const exerciseTypes = [
    'Sprint',
    'Shotput',
    'Long Jump',
    'Broad Jump',
    'High Jump',
    'Pushups',
    'Squats',
    'Pullups'
  ];

  const handleExerciseChange = (event: SelectChangeEvent) => {
    setExerciseType(event.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Exercise Analysis
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Exercise
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="exercise-select-label">Exercise Type</InputLabel>
          <Select
            labelId="exercise-select-label"
            id="exercise-select"
            value={exerciseType}
            label="Exercise Type"
            onChange={handleExerciseChange}
          >
            {exerciseTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body1" paragraph>
          Instructions:
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          {getExerciseInstructions(exerciseType)}
        </Typography>
      </Paper>

      <PoseAnalysisRecorder 
        exerciseType={exerciseType}
        onAnalysisComplete={(results) => {
          console.log('Analysis complete:', results);
          // Here you can save the analysis results to your database
        }}
      />
    </Container>
  );
};

const getExerciseInstructions = (exerciseType: string): string => {
  const instructions: { [key: string]: string } = {
    'Sprint': 'Position yourself in the frame and run in place. The system will analyze your running form and speed.',
    'Shotput': 'Stand sideways in the frame and demonstrate your shotput throwing motion.',
    'Long Jump': 'Position yourself at the edge of the frame, then perform your long jump approach and jump.',
    'Broad Jump': 'Stand with feet shoulder-width apart, then jump forward as far as possible.',
    'High Jump': 'Position yourself in the frame and demonstrate your high jump technique.',
    'Pushups': 'Get into a pushup position in front of the camera. The system will count your reps and check your form.',
    'Squats': 'Stand with feet shoulder-width apart. The system will count your squats and check your form.',
    'Pullups': 'If possible, position yourself under a pullup bar. The system will count your reps and check your form.'
  };

  return instructions[exerciseType] || 'Position yourself in the frame and perform the exercise.';
};

export default ExerciseAnalysisPage;
