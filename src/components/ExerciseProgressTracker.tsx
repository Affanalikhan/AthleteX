import React, { useEffect, useRef, useState } from 'react';
import { Box, LinearProgress, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Info as InfoIcon } from '@mui/icons-material';

interface ExerciseMetrics {
  reps: number;
  formScore: number;
  tempo: number;
  rangeOfMotion: number;
  symmetry: number;
  feedback: Array<{message: string; severity: 'success' | 'warning' | 'error' | 'info'}>;
}

interface ExerciseProgressTrackerProps {
  exerciseType: string;
  duration: number;
  metrics: ExerciseMetrics;
  onComplete: () => void;
  isRecording: boolean;
  isProcessing: boolean;
}

const ExerciseProgressTracker: React.FC<ExerciseProgressTrackerProps> = ({
  exerciseType,
  duration,
  metrics,
  onComplete,
  isRecording,
  isProcessing
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [showFeedback, setShowFeedback] = useState(true);

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    // For demonstration, we'll use time-based progress
    // In a real app, this could be based on actual exercise completion
    const maxDuration = 300; // 5 minutes max
    return Math.min(100, (elapsedTime / maxDuration) * 100);
  };

  // Update elapsed time
  useEffect(() => {
    if (isRecording && !isProcessing) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isProcessing]);

  // Check if exercise is complete
  useEffect(() => {
    if (metrics.reps >= 10) { // Example: Complete after 10 reps
      onComplete();
    }
  }, [metrics.reps, onComplete]);

  // Get color based on form score
  const getFormScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    return 'warning';
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          {exerciseType} Progress
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          {formatTime(elapsedTime)}
        </Typography>
      </Box>

      {/* Overall Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Overall Progress
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {Math.round(calculateProgress())}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={calculateProgress()} 
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>

      {/* Metrics Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            {metrics.reps}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Repetitions
          </Typography>
        </Paper>
        
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color={getFormScoreColor(metrics.formScore)}>
            {metrics.formScore}%
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Form Score
          </Typography>
        </Paper>
        
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4">
            {metrics.tempo.toFixed(1)}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Tempo (s)
          </Typography>
        </Paper>
        
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4">
            {metrics.rangeOfMotion}°
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Range of Motion
          </Typography>
        </Paper>
      </Box>

      {/* Feedback Section */}
      {showFeedback && metrics.feedback.length > 0 && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            bgcolor: 'background.paper',
            borderLeft: theme => `4px solid ${getFeedbackColor(metrics.feedback[0].severity, theme)}`
          }}
        >
          <Box display="flex" alignItems="flex-start">
            {getFeedbackIcon(metrics.feedback[0].severity)}
            <Box ml={1}>
              <Typography variant="subtitle2">
                {getFeedbackTitle(metrics.feedback[0].severity)}
              </Typography>
              <Typography variant="body2">
                {metrics.feedback[0].message}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => setShowFeedback(false)}
              sx={{ ml: 'auto' }}
            >
              <span>×</span>
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Box mt={2} display="flex" alignItems="center" color="text.secondary">
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Processing your performance data...</Typography>
        </Box>
      )}
    </Paper>
  );
};

// Helper functions for feedback UI
const getFeedbackColor = (severity: string, theme: any) => {
  switch (severity) {
    case 'success': return theme.palette.success.main;
    case 'warning': return theme.palette.warning.main;
    case 'error': return theme.palette.error.main;
    default: return theme.palette.info.main;
  }
};

const getFeedbackIcon = (severity: string) => {
  switch (severity) {
    case 'success': return <CheckCircle color="success" />;
    case 'warning': return <InfoIcon color="warning" />;
    case 'error': return <ErrorIcon color="error" />;
    default: return <InfoIcon color="info" />;
  }
};

const getFeedbackTitle = (severity: string) => {
  switch (severity) {
    case 'success': return 'Great job!';
    case 'warning': return 'Heads up!';
    case 'error': return 'Needs attention';
    default: return 'Tip';
  }
};

export default ExerciseProgressTracker;
