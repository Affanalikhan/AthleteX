import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CardHeader,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Psychology,
  FitnessCenter,
  Speed,
  Timeline,
  Warning,
  CheckCircle,
  Info,
  ArrowBack,
  Share,
  Download,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import assessmentService from '../services/assessmentService';
import aiAnalysisService, { AssessmentAnalysis } from '../services/aiAnalysisService';
import athleteService from '../services/athleteService';
import { AssessmentTest } from '../models';

const AssessmentResultsPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<AssessmentTest | null>(null);
  const [analysis, setAnalysis] = useState<AssessmentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const loadAssessmentResults = useCallback(async () => {
    if (!assessmentId || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Load the specific assessment
      const assessmentResult = await assessmentService.getAssessmentById(assessmentId);
      if (!assessmentResult) {
        throw new Error('Assessment not found');
      }
      setAssessment(assessmentResult);

      // Load all assessments for comparison
      const allAssessments = await assessmentService.getAthleteAssessments(user.id);
      
      // Load athlete data
      const athlete = await athleteService.getAthleteById(user.id);
      const athleteSports = athlete?.sportsPlayed as any[] || []; // Convert string[] to SportType[]

      // Start AI analysis
      setAnalyzing(true);
      console.log('Starting AI analysis...', { assessmentResult, allAssessmentsCount: allAssessments.length, athleteSports });
      const aiAnalysis = await aiAnalysisService.analyzeAssessment(
        assessmentResult,
        allAssessments,
        athleteSports
      );
      console.log('AI Analysis complete:', aiAnalysis);
      setAnalysis(aiAnalysis);
      setAnalyzing(false);

    } catch (err) {
      console.error('Error loading assessment results:', err);
      setError('Failed to load assessment results');
    } finally {
      setLoading(false);
    }
  }, [assessmentId, user]);

  useEffect(() => {
    loadAssessmentResults();
  }, [loadAssessmentResults]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'info';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return '#4caf50';
      case 'good': return '#2196f3';
      case 'average': return '#ff9800';
      case 'below_average': return '#ff5722';
      case 'poor': return '#f44336';
      default: return '#757575';
    }
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'strength': return <CheckCircle color="success" />;
      case 'weakness': return <Warning color="error" />;
      case 'improvement': return <TrendingUp color="info" />;
      case 'risk': return <Warning color="warning" />;
      default: return <Info color="primary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp color="success" />;
      case 'declining': return <TrendingDown color="error" />;
      default: return <TrendingFlat color="info" />;
    }
  };

  const handleDownloadReport = () => {
    if (!assessment || !analysis) return;

    const report = {
      assessment: {
        testType: assessment.testType,
        score: assessment.score,
        date: assessment.timestamp.toLocaleDateString()
      },
      analysis: {
        overallRating: analysis.performanceMetrics.overallRating,
        percentile: analysis.performanceMetrics.percentile,
        insights: analysis.insights.map(i => ({ title: i.title, description: i.description })),
        recommendations: analysis.recommendations.map(r => ({
          title: r.title,
          description: r.description,
          exercises: r.exercises
        }))
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment-report-${assessment.testType}-${assessment.timestamp.toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error || !assessment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => navigate('/assessment')}>
            Back to Assessments
          </Button>
        }>
          {error || 'Assessment not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/assessment')} color="primary">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Assessment Results
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {assessment.testType.replace('_', ' ')} • {assessment.timestamp.toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button startIcon={<Download />} onClick={handleDownloadReport} variant="outlined">
            Download Report
          </Button>
          <Button startIcon={<Share />} variant="outlined">
            Share Results
          </Button>
        </Box>
      </Box>

      {/* Main Score Card */}
      <Paper elevation={3} sx={{ p: 4, mb: 3, background: `linear-gradient(135deg, ${getRatingColor(analysis?.performanceMetrics.overallRating || 'average')}15, ${getRatingColor(analysis?.performanceMetrics.overallRating || 'average')}05)` }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h2" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                {assessment.score}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Overall Score
              </Typography>
              <Chip
                label={analysis?.performanceMetrics.overallRating.replace('_', ' ').toUpperCase() || 'ANALYZING'}
                color={getScoreColor(assessment.score)}
                size="medium"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="bold" color="info.main" sx={{ mb: 1 }}>
                {analysis?.performanceMetrics.percentile || '...'}th
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Percentile
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Better than {analysis?.performanceMetrics.percentile || 0}% of athletes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              {analysis && (
                <>
                  {getTrendIcon(analysis.progressTracking.trend)}
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {analysis.progressTracking.trend.charAt(0).toUpperCase() + analysis.progressTracking.trend.slice(1)}
                  </Typography>
                  {analysis.progressTracking.previousScore && (
                    <Typography variant="body2" color="text.secondary">
                      {analysis.progressTracking.improvement > 0 ? '+' : ''}{analysis.progressTracking.improvement.toFixed(1)} points
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* AI Analysis Loading */}
      {analyzing && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Psychology color="primary" />
            <Box flex={1}>
              <Typography variant="h6">AI Analysis in Progress...</Typography>
              <Typography variant="body2" color="text.secondary">
                Our AI is analyzing your performance and generating personalized insights
              </Typography>
            </Box>
            <CircularProgress size={40} />
          </Box>
          <LinearProgress sx={{ mt: 2 }} />
        </Paper>
      )}

      {analysis && (
        <>
          {/* Insights Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <CardHeader
              avatar={<Psychology color="primary" />}
              title="AI Insights & Analysis"
              subheader="Personalized insights based on your performance"
            />
            {analysis.insights.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No specific insights available yet. Complete more assessments to get personalized AI insights.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {analysis.insights.map((insight, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        {getInsightIcon(insight.category)}
                        <Box flex={1}>
                          <Typography variant="h6" gutterBottom>
                            {insight.icon} {insight.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {insight.description}
                          </Typography>
                          <Chip
                            label={`${insight.priority.toUpperCase()} PRIORITY`}
                            color={getPriorityColor(insight.priority)}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              </Grid>
            )}
          </Paper>

          {/* Performance Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <FitnessCenter sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Performance Breakdown
                </Typography>
                {analysis.performanceMetrics.strengths.length === 0 && analysis.performanceMetrics.weaknesses.length === 0 ? (
                  <Alert severity="info">
                    Complete more assessments to see detailed performance breakdown.
                  </Alert>
                ) : (
                  <List>
                    {analysis.performanceMetrics.strengths.map((strength, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={strength} />
                      </ListItem>
                    ))}
                    {analysis.performanceMetrics.weaknesses.map((weakness, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={weakness} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Benchmark Comparison
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="body2">Your Score</Typography>
                    <Typography variant="h6" color="primary">{assessment.score}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="body2">Peer Average</Typography>
                    <Typography variant="body1">{analysis.benchmarkComparison.peerAverage.toFixed(1)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="body2">Sport Average</Typography>
                    <Typography variant="body1">{analysis.benchmarkComparison.sportAverage.toFixed(1)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Elite Level</Typography>
                    <Typography variant="body1" color="success.main">{analysis.benchmarkComparison.eliteLevel}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Training Recommendations */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
              Personalized Training Recommendations
            </Typography>
            {analysis.recommendations.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No training recommendations available yet. Complete more assessments to get personalized training plans.
              </Alert>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {analysis.recommendations.map((recommendation, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Typography variant="h6">
                          {recommendation.title}
                        </Typography>
                        <Chip
                          label={recommendation.priority.toUpperCase()}
                          color={getPriorityColor(recommendation.priority)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {recommendation.description}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Recommended Exercises:
                      </Typography>
                      <List dense>
                        {recommendation.exercises.map((exercise, exerciseIndex) => (
                          <ListItem key={exerciseIndex}>
                            <ListItemText 
                              primary={exercise}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Duration: {recommendation.duration}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              </Grid>
            )}
          </Paper>
        </>
      )}

      {/* Action Buttons */}
      <Box display="flex" justifyContent="center" gap={2} sx={{ mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/assessment')}
          startIcon={<Refresh />}
        >
          Take Another Assessment
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/performance')}
          startIcon={<Timeline />}
        >
          View Performance History
        </Button>
      </Box>
    </Container>
  );
};

export default AssessmentResultsPage;
