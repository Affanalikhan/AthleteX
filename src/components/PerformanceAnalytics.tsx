import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Speed,
  FitnessCenter,
  Timer,
  Accessibility,
  SportsGymnastics,
  Balance,
} from '@mui/icons-material';
import { AssessmentTest, TestType } from '../models';

interface PerformanceAnalyticsProps {
  assessments: AssessmentTest[];
  athleteId: string;
}

interface TestStats {
  testType: TestType;
  latestScore: number;
  averageScore: number;
  improvement: number;
  trend: 'improving' | 'declining' | 'stable';
  count: number;
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  assessments,
  athleteId,
}) => {
  // Filter assessments for this athlete
  const athleteAssessments = assessments.filter(a => a.athleteId === athleteId);

  // Calculate stats for each test type
  const calculateTestStats = (): TestStats[] => {
    const testTypes = Object.values(TestType);
    return testTypes.map(testType => {
      const testAssessments = athleteAssessments
        .filter(a => a.testType === testType)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (testAssessments.length === 0) {
        return {
          testType,
          latestScore: 0,
          averageScore: 0,
          improvement: 0,
          trend: 'stable' as const,
          count: 0,
        };
      }

      const latestScore = testAssessments[0].score;
      const averageScore = testAssessments.reduce((sum, a) => sum + a.score, 0) / testAssessments.length;
      
      let improvement = 0;
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      
      if (testAssessments.length > 1) {
        const secondLatest = testAssessments[1].score;
        improvement = latestScore - secondLatest;
        if (improvement > 3) trend = 'improving';
        else if (improvement < -3) trend = 'declining';
      }

      return {
        testType,
        latestScore: Math.round(latestScore * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        improvement: Math.round(improvement * 100) / 100,
        trend,
        count: testAssessments.length,
      };
    });
  };

  const testStats = calculateTestStats();
  const totalAssessments = athleteAssessments.length;
  const overallAverage = totalAssessments > 0 
    ? Math.round(athleteAssessments.reduce((sum, a) => sum + a.score, 0) / totalAssessments * 100) / 100
    : 0;

  const getTestIcon = (testType: TestType) => {
    switch (testType) {
      case TestType.TENNIS_STANDING_START:
        return <Speed color="primary" />;
      case TestType.FOUR_X_10M_SHUTTLE_RUN:
        return <SportsGymnastics color="secondary" />;
      case TestType.MEDICINE_BALL_THROW:
        return <FitnessCenter color="error" />;
      case TestType.ENDURANCE_RUN:
        return <Timer color="warning" />;
      case TestType.SIT_AND_REACH:
        return <Accessibility color="info" />;
      case TestType.STANDING_VERTICAL_JUMP:
        return <Balance color="success" />;
      default:
        return <Speed color="primary" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp color="success" />;
      case 'declining':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="info" />;
    }
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  if (totalAssessments === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No assessment data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete some assessments to see your performance analytics
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Overall Performance Summary */}
      <Card elevation={3} sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d215, #1976d205)' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {overallAverage}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Overall Average Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold" color="info.main">
                  {totalAssessments}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Total Assessments
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {testStats.filter(s => s.trend === 'improving').length}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Improving Areas
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Individual Test Performance */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Performance by Test Type
      </Typography>
      
      <Grid container spacing={2}>
        {testStats
          .filter(stat => stat.count > 0)
          .map((stat) => (
            <Grid item xs={12} sm={6} md={4} key={stat.testType}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTestIcon(stat.testType)}
                      <Typography variant="h6">
                        {stat.testType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                    </Box>
                    {getTrendIcon(stat.trend)}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Latest Score
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h5" fontWeight="bold">
                        {stat.latestScore}
                      </Typography>
                      <Chip
                        label={`${stat.improvement > 0 ? '+' : ''}${stat.improvement}`}
                        color={stat.improvement > 0 ? 'success' : stat.improvement < 0 ? 'error' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress to 100
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.latestScore}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(stat.latestScore, 100)}
                      color={getScoreColor(stat.latestScore)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Avg: {stat.averageScore}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.count} test{stat.count !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* Performance Trends */}
      <Typography variant="h5" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
        Performance Trends
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {testStats.filter(s => s.trend === 'improving').length}
              </Typography>
              <Typography variant="body1">
                Improving Areas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingFlat sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {testStats.filter(s => s.trend === 'stable').length}
              </Typography>
              <Typography variant="body1">
                Stable Areas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDown sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {testStats.filter(s => s.trend === 'declining').length}
              </Typography>
              <Typography variant="body1">
                Needs Focus
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceAnalytics;
