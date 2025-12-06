import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
  Divider
} from '@mui/material';
import { 
  Add, 
  TrendingUp, 
  TrendingDown, 
  Delete, 
  Edit, 
  FitnessCenter,
  EmojiEvents,
  LocalFireDepartment,
  Timeline
} from '@mui/icons-material';
import { useForm, Controller, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { MetricType } from '../models';
import { usePerformance } from '../hooks/usePerformance';
import { progressTrackingService } from '../services/progressTrackingService';
import PersonalRecordsCard from '../components/PersonalRecordsCard';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface MetricForm {
  metricType: MetricType;
  value: number;
  unit: string;
  notes: string;
}

const metricSchema = yup.object({
  metricType: yup.mixed<MetricType>().oneOf(Object.values(MetricType)).required(),
  value: yup.number().positive('Value must be positive').required('Value is required'),
  unit: yup.string().required('Unit is required'),
  notes: yup.string().max(500, 'Notes must be less than 500 characters')
}).required() as yup.ObjectSchema<MetricForm>;

const PerformancePage: React.FC = () => {
  const {
    metrics,
    loading,
    error,
    adding,
    addMetric,
    deleteMetric,
    getPersonalBest,
    getProgress,
    getChartData,
    getMetricDisplayInfo,
    clearError
  } = usePerformance();

  const [open, setOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>(MetricType.HEIGHT);
  const [tabValue, setTabValue] = useState(0);
  const [progressMetrics, setProgressMetrics] = useState(progressTrackingService.getProgressMetrics());

  // Refresh progress metrics when component mounts or when new data is added
  useEffect(() => {
    setProgressMetrics(progressTrackingService.getProgressMetrics());
  }, []);

const form = useForm<MetricForm>({
    resolver: yupResolver(metricSchema) as unknown as Resolver<MetricForm>,
    defaultValues: {
      metricType: MetricType.HEIGHT,
      value: 0,
      unit: 'cm',
      notes: ''
    }
  });

  // Update unit when metric type changes
  React.useEffect(() => {
    const info = getMetricDisplayInfo(form.watch('metricType'));
    form.setValue('unit', info.unit);
  }, [form.watch('metricType'), form, getMetricDisplayInfo]);

const handleSubmit: SubmitHandler<MetricForm> = async (data) => {
    try {
      clearError();
      await addMetric(data);
      form.reset();
      setOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDelete = async (metricId: string) => {
    if (window.confirm('Are you sure you want to delete this metric?')) {
      try {
        await deleteMetric(metricId);
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance Progress',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  if (loading && metrics.length === 0) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const getWeeklyChartData = () => {
    const weeks = progressMetrics.weeklyProgress.slice(0, 8).reverse();
    return {
      labels: weeks.map(w => new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Workouts',
          data: weeks.map(w => w.workouts),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Total Reps',
          data: weeks.map(w => w.reps),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getFormScoreChartData = () => {
    const weeks = progressMetrics.weeklyProgress.slice(0, 8).reverse();
    return {
      labels: weeks.map(w => new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Average Form Score',
          data: weeks.map(w => w.avgFormScore),
          fill: true,
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderColor: 'rgba(255, 159, 64, 1)',
          tension: 0.4,
        },
      ],
    };
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1">
            Performance Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            📊 Assessment results are automatically saved here for progress tracking
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Add Metric
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} centered>
          <Tab label="Workout Progress" icon={<FitnessCenter />} iconPosition="start" />
          <Tab label="Performance Metrics" icon={<Timeline />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Workout Progress Tab */}
      {tabValue === 0 && (
        <>
          {/* Overview Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <FitnessCenter color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Workouts</Typography>
                  </Box>
                  <Typography variant="h3" color="primary">
                    {progressMetrics.totalWorkouts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmojiEvents color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Reps</Typography>
                  </Box>
                  <Typography variant="h3" color="warning.main">
                    {progressMetrics.totalReps}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Across all exercises
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocalFireDepartment color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6">Current Streak</Typography>
                  </Box>
                  <Typography variant="h3" color="error.main">
                    {progressMetrics.currentStreak}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    days (Best: {progressMetrics.longestStreak})
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Avg Form Score</Typography>
                  </Box>
                  <Typography variant="h3" color="success.main">
                    {progressMetrics.averageFormScore.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Best: {progressMetrics.bestFormScore.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          {progressMetrics.weeklyProgress.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Weekly Activity
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar 
                      data={getWeeklyChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' },
                        },
                      }} 
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Form Score Progress
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line 
                      data={getFormScoreChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                          },
                        },
                      }} 
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Exercise Breakdown */}
          {Object.keys(progressMetrics.exerciseBreakdown).length > 0 && (
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Exercise Breakdown
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(progressMetrics.exerciseBreakdown).map(([exercise, data]) => (
                  <Grid item xs={12} sm={6} md={4} key={exercise}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {exercise.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Sessions
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {data.count}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Total Reps
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {data.totalReps}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Avg Form
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {data.avgFormScore.toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Best Form
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {data.bestFormScore.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                        {data.improvement !== 0 && (
                          <Box display="flex" alignItems="center">
                            {data.improvement > 0 ? (
                              <TrendingUp color="success" fontSize="small" />
                            ) : (
                              <TrendingDown color="error" fontSize="small" />
                            )}
                            <Typography
                              variant="body2"
                              color={data.improvement > 0 ? 'success.main' : 'error.main'}
                              sx={{ ml: 0.5 }}
                            >
                              {data.improvement > 0 ? '+' : ''}{data.improvement.toFixed(1)}% improvement
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Personal Records */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <PersonalRecordsCard />
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <LocalFireDepartment color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6">Streak Information</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current Streak
                    </Typography>
                    <Typography variant="h3" color="error.main">
                      {progressMetrics.currentStreak} days
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Longest Streak
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {progressMetrics.longestStreak} days
                    </Typography>
                  </Box>
                  {progressMetrics.currentStreak > 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Keep it up! You're on a {progressMetrics.currentStreak}-day streak! 🔥
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Sessions */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Workout Sessions
            </Typography>
            {progressMetrics.recentSessions.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No workout sessions recorded yet. Complete an assessment to start tracking!
              </Typography>
            ) : (
              <List>
                {progressMetrics.recentSessions.map((session) => (
                  <ListItem key={session.id} divider>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {session.exerciseType.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Chip label={`${session.reps} reps`} size="small" color="primary" />
                          <Chip 
                            label={`${session.formScore.toFixed(1)}% form`} 
                            size="small" 
                            color={session.formScore >= 80 ? 'success' : session.formScore >= 60 ? 'warning' : 'error'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString()}
                          </Typography>
                          <Typography variant="body2">
                            Duration: {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}
                          </Typography>
                          {session.notes && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {session.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          if (window.confirm('Delete this workout session?')) {
                            progressTrackingService.deleteSession(session.id);
                            setProgressMetrics(progressTrackingService.getProgressMetrics());
                          }
                        }}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </>
      )}

      {/* Performance Metrics Tab */}
      {tabValue === 1 && (
        <>
          {/* Assessment Integration Info */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              🤖 Automatic Assessment Integration
            </Typography>
            <Typography variant="body2">
              When you complete assessment tests, the results are automatically stored here as performance metrics. 
              This allows you to track your progress over time and see improvements across all fitness categories.
            </Typography>
          </Alert>

        {/* Performance Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.values(MetricType).map((metricType) => {
          const info = getMetricDisplayInfo(metricType);
          const personalBest = getPersonalBest(metricType);
          const progress = getProgress(metricType);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={metricType}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {info.label}
                  </Typography>
                  
                  {personalBest !== null ? (
                    <>
                      <Typography variant="h4" color="primary">
                        {info.format(personalBest)}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" mt={1}>
                        {progress > 0 ? (
                          <TrendingUp color="success" />
                        ) : progress < 0 ? (
                          <TrendingDown color="error" />
                        ) : null}
                        
                        <Typography
                          variant="body2"
                          color={progress > 0 ? 'success.main' : progress < 0 ? 'error.main' : 'text.secondary'}
                          sx={{ ml: 0.5 }}
                        >
                          {progress !== 0 ? `${progress.toFixed(1)}% (30 days)` : 'No change'}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      No records yet
                    </Typography>
                  )}
                  
                  <Button
                    size="small"
                    onClick={() => setSelectedMetricType(metricType)}
                    sx={{ mt: 1 }}
                  >
                    View Chart
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        </Grid>

        {/* Chart Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Progress Chart - {getMetricDisplayInfo(selectedMetricType).label}
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Metric Type</InputLabel>
            <Select
              value={selectedMetricType}
              label="Metric Type"
              onChange={(e) => setSelectedMetricType(e.target.value as MetricType)}
            >
              {Object.values(MetricType).map((type) => (
                <MenuItem key={type} value={type}>
                  {getMetricDisplayInfo(type).label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

          <Box sx={{ height: 400 }}>
            <Line data={getChartData(selectedMetricType)} options={chartOptions} />
          </Box>
        </Paper>

        {/* Recent Metrics List */}
        <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Metrics
        </Typography>
        
        {metrics.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No metrics recorded yet. Add your first performance metric!
          </Typography>
        ) : (
          <List>
            {metrics.slice(0, 10).map((metric) => {
              const info = getMetricDisplayInfo(metric.metricType);
              
              return (
                <ListItem key={metric.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">
                          {info.label}
                        </Typography>
                        <Chip 
                          label={info.format(metric.value)} 
                          color="primary" 
                          size="small" 
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {metric.timestamp.toLocaleDateString()} at {metric.timestamp.toLocaleTimeString()}
                        </Typography>
                        {metric.notes && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {metric.notes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(metric.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
        </Paper>
        </>
      )}

      {/* Add Metric Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Performance Metric</DialogTitle>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="metricType"
                  control={form.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Metric Type</InputLabel>
                      <Select {...field} label="Metric Type">
                        {Object.values(MetricType).map((type) => (
                          <MenuItem key={type} value={type}>
                            {getMetricDisplayInfo(type).label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={8}>
<TextField
                  {...form.register('value')}
                  error={!!form.formState.errors.value}
                  helperText={form.formState.errors.value?.message}
                  label="Value"
                  type="number"
                  inputProps={{ step: 0.01 }}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={4}>
                <TextField
                  {...form.register('unit')}
                  error={!!form.formState.errors.unit}
                  helperText={form.formState.errors.unit?.message}
                  label="Unit"
                  fullWidth
                  disabled
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  {...form.register('notes')}
                  error={!!form.formState.errors.notes}
                  helperText={form.formState.errors.notes?.message}
                  label="Notes (optional)"
                  multiline
                  rows={3}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={adding}>
              {adding ? <CircularProgress size={20} /> : 'Add Metric'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default PerformancePage;
