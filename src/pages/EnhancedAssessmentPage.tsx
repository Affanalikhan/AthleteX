import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  RadioGroup,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Speed,
  Security,
  Psychology,
  Analytics,
  CheckCircle,
  Warning,
  Error,
  Info,
  ExpandMore,
  VideoLibrary,
  Timeline,
  SmartToy,
  Assessment,
  TrendingUp,
  Refresh,
  Settings,
  Help,
  Close
} from '@mui/icons-material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { TestType } from '../models';
import { useEnhancedAssessment } from '../hooks/useEnhancedAssessment';
import VideoRecorder from '../components/VideoRecorder';
import { AssessmentProcessingProgress } from '../services/enhancedAssessmentService';

interface AssessmentForm {
  testType: TestType;
  analysisMode: 'quick' | 'enhanced' | 'comprehensive';
  notes: string;
}

const assessmentSchema = yup.object().shape({
  testType: yup.mixed<TestType>().oneOf(Object.values(TestType)).required(),
  analysisMode: yup.mixed<'quick' | 'enhanced' | 'comprehensive'>().oneOf(['quick', 'enhanced', 'comprehensive']).required(),
  notes: yup.string().max(500).optional()
});

const EnhancedAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    createEnhancedAssessment,
    uploading,
    processing,
    processingProgress,
    error,
    clearError,
    getScoreDisplay,
    getAvailableModes,
    getModeDescription,
    getAssessmentAnalytics
  } = useEnhancedAssessment();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [processingDialog, setProcessingDialog] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  const form = useForm<AssessmentForm>({
    resolver: yupResolver(assessmentSchema) as any,
    defaultValues: { 
      testType: TestType.TENNIS_STANDING_START, 
      analysisMode: 'enhanced',
      notes: '' 
    }
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = getAssessmentAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const onVideoReady = (file: File) => {
    setVideoFile(file);
  };

  const onSubmit: SubmitHandler<AssessmentForm> = async (data) => {
    if (!videoFile) {
      alert('Please record a video first.');
      return;
    }

    try {
      clearError();
      setProcessingDialog(true);

      const progressHandler = (progress: AssessmentProcessingProgress) => {
        // Progress is handled by the hook's state
        console.log('Processing progress:', progress);
      };

      const result = await createEnhancedAssessment(
        data.testType,
        videoFile,
        data.notes,
        { type: data.analysisMode },
        progressHandler
      );

      setLastResult(result);
      setVideoFile(null);
      setProcessingDialog(false);

      // Show results immediately or redirect based on mode
      if (data.analysisMode === 'quick') {
        setTimeout(() => {
          navigate(`/assessment/results/${result.assessment.id}`);
        }, 1500);
      } else {
        // For enhanced/comprehensive, show immediate results dialog
        setTimeout(() => {
          navigate(`/assessment/results/${result.assessment.id}`);
        }, 2000);
      }

    } catch (error) {
      setProcessingDialog(false);
      console.error('Assessment submission failed:', error);
    }
  };

  const getAnalysisModeIcon = (mode: string) => {
    switch (mode) {
      case 'quick': return <Speed color="primary" />;
      case 'enhanced': return <SmartToy color="secondary" />;
      case 'comprehensive': return <Analytics color="success" />;
      default: return <Assessment />;
    }
  };

  const getAnalysisModeColor = (mode: string) => {
    switch (mode) {
      case 'quick': return 'primary';
      case 'enhanced': return 'secondary';
      case 'comprehensive': return 'success';
      default: return 'default';
    }
  };

  const getProcessingStageIcon = (stage: string) => {
    switch (stage) {
      case 'upload': return <CloudUpload />;
      case 'integrity': return <Security />;
      case 'movement': return <VideoLibrary />;
      case 'performance': return <TrendingUp />;
      case 'feedback': return <Psychology />;
      case 'complete': return <CheckCircle />;
      default: return <CircularProgress size={20} />;
    }
  };

  const renderModeSelection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Analysis Mode
        </Typography>
        <Controller
          name="analysisMode"
          control={form.control}
          render={({ field }) => (
            <RadioGroup
              {...field}
              row
              sx={{ gap: 2 }}
            >
              {getAvailableModes().map((mode) => (
                <Card 
                  key={mode.type}
                  variant="outlined"
                  sx={{ 
                    minWidth: 200, 
                    cursor: 'pointer',
                    border: field.value === mode.type ? 2 : 1,
                    borderColor: field.value === mode.type ? `${getAnalysisModeColor(mode.type)}.main` : 'grey.300',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  onClick={() => field.onChange(mode.type)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Avatar 
                        sx={{ 
                          bgcolor: field.value === mode.type ? `${getAnalysisModeColor(mode.type)}.main` : 'grey.400',
                          width: 32, 
                          height: 32, 
                          mr: 1 
                        }}
                      >
                        {getAnalysisModeIcon(mode.type)}
                      </Avatar>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {mode.type}
                      </Typography>
                      <FormControlLabel
                        control={<Radio checked={field.value === mode.type} />}
                        label=""
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {getModeDescription(mode.type)}
                    </Typography>
                    
                    {mode.type === 'enhanced' && (
                      <Box mt={1}>
                        <Chip label="Recommended" color="secondary" size="small" />
                      </Box>
                    )}
                    
                    {mode.type === 'comprehensive' && (
                      <Box mt={1}>
                        <Chip label="Most Detailed" color="success" size="small" />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Assessment Analytics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {analytics.total}
                </Typography>
                <Typography variant="caption">
                  Total Assessments
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {analytics.withAIAnalysis}
                </Typography>
                <Typography variant="caption">
                  AI Analyzed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {analytics.averagePercentile}%
                </Typography>
                <Typography variant="caption">
                  Avg Percentile
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {analytics.integrityPassRate.toFixed(0)}%
                </Typography>
                <Typography variant="caption">
                  Integrity Pass Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderProcessingDialog = () => (
    <Dialog 
      open={processingDialog} 
      onClose={() => {}} 
      disableEscapeKeyDown
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <SmartToy sx={{ mr: 1 }} />
          AI Assessment Analysis
        </Box>
      </DialogTitle>
      <DialogContent>
        {processingProgress && (
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              {getProcessingStageIcon(processingProgress.stage)}
              <Box ml={2} flex={1}>
                <Typography variant="body1">
                  {processingProgress.message}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={processingProgress.progress} 
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {processingProgress.progress.toFixed(0)}% complete
                  {processingProgress.estimatedTimeRemaining && 
                    ` • ${processingProgress.estimatedTimeRemaining}s remaining`
                  }
                </Typography>
              </Box>
            </Box>

            {/* Processing stages stepper */}
            <Stepper activeStep={getStepIndex(processingProgress.stage)} alternativeLabel sx={{ mt: 2 }}>
              {getProcessingSteps().map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {!processingProgress && (
          <Box display="flex" alignItems="center" justifyContent="center" py={3}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Initializing AI analysis...</Typography>
          </Box>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Please keep this window open while your assessment is being analyzed.
        </Alert>
      </DialogContent>
    </Dialog>
  );

  const getStepIndex = (stage: string): number => {
    const stages = ['upload', 'integrity', 'movement', 'performance', 'feedback', 'complete'];
    return stages.indexOf(stage);
  };

  const getProcessingSteps = () => [
    { label: 'Upload' },
    { label: 'Integrity Check' },
    { label: 'Movement Analysis' },
    { label: 'Performance' },
    { label: 'Feedback' },
    { label: 'Complete' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          AI-Powered Assessment
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Submit your performance video for intelligent analysis and personalized feedback
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {renderAnalytics()}

      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Grid container spacing={4}>
            {/* Left Column - Form Controls */}
            <Grid item xs={12} lg={6}>
              <Box mb={3}>
                <Typography variant="h5" gutterBottom>
                  Assessment Details
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Test Type</InputLabel>
                  <Controller
                    name="testType"
                    control={form.control}
                    render={({ field }) => (
                      <Select {...field} label="Test Type">
                        {Object.values(TestType).map((t) => (
                          <MenuItem key={t} value={t}>
                            <Box display="flex" alignItems="center">
                              <Assessment sx={{ mr: 1 }} />
                              {t.replace('_', ' ').toUpperCase()}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>

                <TextField
                  {...form.register('notes')}
                  label="Notes (optional)"
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Add any relevant information about your performance..."
                  sx={{ mb: 3 }}
                />

                <Box display="flex" gap={2} mb={3}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={uploading || processing || !videoFile}
                    startIcon={uploading || processing ? <CircularProgress size={20} /> : <CloudUpload />}
                    sx={{ flex: 1 }}
                  >
                    {uploading || processing ? 'Processing...' : 'Submit Assessment'}
                  </Button>

                  <Tooltip title="Advanced Options">
                    <IconButton 
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      color={showAdvancedOptions ? 'primary' : 'default'}
                    >
                      <Settings />
                    </IconButton>
                  </Tooltip>
                </Box>

                {lastResult && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Box>
                      <Typography variant="subtitle2">Assessment submitted successfully!</Typography>
                      <Typography variant="body2">
                        Score: {getScoreDisplay(lastResult.assessment.testType, lastResult.assessment.score)}
                        {lastResult.processingStatus === 'complete' && (
                          <Chip label="AI Analysis Complete" color="success" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </Box>
                  </Alert>
                )}
              </Box>

              {/* Advanced Options */}
              <Accordion expanded={showAdvancedOptions} onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Advanced Options</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Security />
                      </ListItemIcon>
                      <ListItemText
                        primary="Integrity Verification"
                        secondary="AI checks for video tampering and cheating"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUp />
                      </ListItemIcon>
                      <ListItemText
                        primary="Performance Benchmarking"
                        secondary="Compare against age/gender-based standards"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <VideoLibrary />
                      </ListItemIcon>
                      <ListItemText
                        primary="Movement Analysis"
                        secondary="Detailed biomechanical assessment"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Psychology />
                      </ListItemIcon>
                      <ListItemText
                        primary="Comprehensive Feedback"
                        secondary="Personalized recommendations and insights"
                      />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Right Column - Video Recording */}
            <Grid item xs={12} lg={6}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  Record Your Performance
                </Typography>
                
                <VideoRecorder
                  onVideoReady={onVideoReady}
                  onUpload={async () => {}} // Handled by form submission
                  uploading={uploading || processing}
                  maxDuration={120}
                />

                {videoFile && (
                  <Box mt={2}>
                    <Alert severity="success" icon={<CheckCircle />}>
                      Video ready: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </Alert>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Analysis Mode Selection */}
          {renderModeSelection()}
        </form>
      </Paper>

      {/* Processing Dialog */}
      {renderProcessingDialog()}
    </Container>
  );
};

export default EnhancedAssessmentPage;
