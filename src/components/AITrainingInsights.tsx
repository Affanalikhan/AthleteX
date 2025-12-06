import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  TrendingUp,
  FitnessCenter,
  LocalFireDepartment,
  Psychology,
  CheckCircle,
  Warning,
  Info,
  EmojiEvents,
  Speed,
  Favorite
} from '@mui/icons-material';
import { PersonalizedRecommendation, AITrainingInsight, RealTimeMetrics } from '../services/aiTrainingService';

interface AITrainingInsightsProps {
  recommendations?: PersonalizedRecommendation[];
  realTimeInsight?: AITrainingInsight | null;
  currentMetrics?: RealTimeMetrics;
  showRecommendations?: boolean;
}

const AITrainingInsights: React.FC<AITrainingInsightsProps> = ({
  recommendations = [],
  realTimeInsight,
  currentMetrics,
  showRecommendations = true
}) => {
  const [expandedRec, setExpandedRec] = useState<number | null>(null);
  const [showInsight, setShowInsight] = useState(true);

  useEffect(() => {
    if (realTimeInsight) {
      setShowInsight(true);
      // Auto-hide low priority insights after 5 seconds
      if (realTimeInsight.priority === 'low') {
        const timer = setTimeout(() => setShowInsight(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [realTimeInsight]);

  const getInsightIcon = (type: AITrainingInsight['type']) => {
    switch (type) {
      case 'form':
        return <FitnessCenter />;
      case 'pace':
        return <Speed />;
      case 'motivation':
        return <Psychology />;
      case 'warning':
        return <Warning />;
      case 'achievement':
        return <EmojiEvents />;
      default:
        return <Info />;
    }
  };

  const getInsightSeverity = (type: AITrainingInsight['type']): 'error' | 'warning' | 'info' | 'success' => {
    switch (type) {
      case 'warning':
        return 'error';
      case 'form':
      case 'pace':
        return 'warning';
      case 'achievement':
        return 'success';
      default:
        return 'info';
    }
  };

  const getCategoryIcon = (category: PersonalizedRecommendation['category']) => {
    switch (category) {
      case 'strength':
        return <FitnessCenter color="primary" />;
      case 'cardio':
        return <Favorite color="error" />;
      case 'flexibility':
        return <TrendingUp color="success" />;
      case 'recovery':
        return <Psychology color="info" />;
      case 'nutrition':
        return <LocalFireDepartment color="warning" />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
    }
  };

  return (
    <Box>
      {/* Real-time Insight */}
      {realTimeInsight && showInsight && (
        <Alert
          severity={getInsightSeverity(realTimeInsight.type)}
          icon={getInsightIcon(realTimeInsight.type)}
          onClose={() => setShowInsight(false)}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {realTimeInsight.title}
          </Typography>
          <Typography variant="body2">
            {realTimeInsight.message}
          </Typography>
          {realTimeInsight.actionable && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
              💡 {realTimeInsight.actionable}
            </Typography>
          )}
        </Alert>
      )}

      {/* Current Metrics */}
      {currentMetrics && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Real-Time Performance
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="textSecondary">
                  Form Score
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {currentMetrics.formScore}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={currentMetrics.formScore} 
                color={currentMetrics.formScore > 80 ? 'success' : currentMetrics.formScore > 60 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="textSecondary">
                  Pace
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {currentMetrics.currentPace.toFixed(1)} / {currentMetrics.targetPace.toFixed(1)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(currentMetrics.currentPace / currentMetrics.targetPace) * 100} 
                color="primary"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  Calories Burned
                </Typography>
                <Typography variant="h6" color="primary">
                  {Math.round(currentMetrics.caloriesBurned)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  Fatigue Level
                </Typography>
                <Typography 
                  variant="h6" 
                  color={currentMetrics.fatigueLevel > 80 ? 'error' : currentMetrics.fatigueLevel > 60 ? 'warning' : 'success'}
                >
                  {currentMetrics.fatigueLevel}%
                </Typography>
              </Box>
              {currentMetrics.heartRateZone && (
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block">
                    HR Zone
                  </Typography>
                  <Chip 
                    label={currentMetrics.heartRateZone.replace('_', ' ').toUpperCase()} 
                    size="small"
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Psychology color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                AI Training Recommendations
              </Typography>
            </Box>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Personalized suggestions based on your assessment results and goals
            </Typography>

            <List disablePadding>
              {recommendations.map((rec, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  
                  <ListItem
                    disablePadding
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      bgcolor: expandedRec === index ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      p: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                      onClick={() => setExpandedRec(expandedRec === index ? null : index)}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getCategoryIcon(rec.category)}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {rec.title}
                            </Typography>
                            <Chip 
                              label={rec.priority.toUpperCase()} 
                              size="small" 
                              color={getPriorityColor(rec.priority)}
                            />
                          </Box>
                        }
                        secondary={rec.description}
                      />
                      
                      <IconButton size="small">
                        {expandedRec === index ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>

                    <Collapse in={expandedRec === index} timeout="auto">
                      <Box sx={{ mt: 2, pl: 5 }}>
                        <Typography variant="body2" color="textSecondary" paragraph>
                          <strong>Why this matters:</strong> {rec.reasoning}
                        </Typography>

                        <Typography variant="subtitle2" gutterBottom>
                          Recommended Exercises:
                        </Typography>
                        <List dense disablePadding sx={{ mb: 2 }}>
                          {rec.exercises.map((exercise, idx) => (
                            <ListItem key={idx} disablePadding sx={{ pl: 2 }}>
                              <ListItemIcon sx={{ minWidth: 30 }}>
                                <CheckCircle fontSize="small" color="success" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={exercise}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Duration
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {rec.duration}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Frequency
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {rec.frequency}
                            </Typography>
                          </Box>
                        </Box>

                        <Alert severity="info" icon={<TrendingUp />}>
                          <Typography variant="caption">
                            <strong>Expected Results:</strong> {rec.expectedImprovement}
                          </Typography>
                        </Alert>
                      </Box>
                    </Collapse>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AITrainingInsights;
