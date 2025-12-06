import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Tooltip,
  Tabs,
  Tab,
  TextField,
  Grid
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Videocam as VideocamIcon,
  NetworkCheck as NetworkIcon,
  Smartphone as DeviceIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useForm, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
// Import TestType from models to ensure consistency
import { TestType } from '../models';
import { useAssessment } from '../hooks/useAssessment';
import { useCapacitorContext } from '../providers/CapacitorProvider';
import SimpleVideoRecorder from '../components/SimpleVideoRecorder';
import { progressTrackingService } from '../services/progressTrackingService';
// Exercise metrics would be handled by the pose detection service

interface ExerciseMetrics {
  reps: number;
  formScore: number;
  tempo: number;
  rangeOfMotion: number;
  symmetry: number;
  feedback: Array<{message: string; severity: 'success' | 'warning' | 'error' | 'info'}>;
}

interface AssessmentForm {
  testType: TestType;
  notes?: string;
  // Manual measurement fields
  timeTaken?: number; // For timed tests (seconds)
  distance?: number; // For distance tests (meters/cm)
  height?: number; // For height measurement (cm)
  weight?: number; // For weight measurement (kg)
  reps?: number; // For rep-based tests
}

type TabValue = 'instructions' | 'test' | 'history';

const TEST_INSTRUCTIONS = {
  [TestType.HEIGHT]: [
    'Stand straight against a wall with heels together',
    'Keep your head in the Frankfort horizontal plane',
    'Take a deep breath and stand as tall as possible',
    'Measure to the nearest 0.1 cm',
    'Record the measurement'
  ],
  [TestType.WEIGHT]: [
    'Use a calibrated digital scale',
    'Wear minimal clothing (shorts and t-shirt)',
    'Stand still in the center of the scale',
    'Record weight to the nearest 0.1 kg',
    'Take measurement at the same time of day'
  ],
  [TestType.SIT_AND_REACH]: [
    'Sit with legs straight and feet against the box',
    'Keep knees straight throughout the test',
    'Reach forward slowly with both hands',
    'Hold the furthest position for 2 seconds',
    'Record the best of 3 attempts'
  ],
  [TestType.STANDING_VERTICAL_JUMP]: [
    'Stand with feet shoulder-width apart',
    'Swing arms back and jump as high as possible',
    'Land safely with both feet',
    'Measure the highest point reached',
    'Record the best of 3 attempts'
  ],
  [TestType.STANDING_BROAD_JUMP]: [
    'Stand behind the takeoff line',
    'Use arm swing to generate momentum',
    'Jump as far as possible with both feet',
    'Land with both feet together',
    'Measure from takeoff line to nearest landing point'
  ],
  [TestType.MEDICINE_BALL_THROW]: [
    'Use a 2kg medicine ball for this test',
    'Sit with back against the wall',
    'Hold ball with both hands at chest level',
    'Throw the ball as far as possible',
    'Record the best of 3 attempts'
  ],
  [TestType.TENNIS_STANDING_START]: [
    'Start in a standing position behind the line',
    'Sprint as fast as possible when ready',
    'Maintain proper running form',
    'Run through the finish line',
    'Record time to the nearest 0.1 seconds'
  ],
  [TestType.FOUR_X_10M_SHUTTLE_RUN]: [
    'Place markers 10 meters apart',
    'Start behind the first marker',
    'Run to the second marker and back (4 times total)',
    'Touch each marker with your hand',
    'Record total time for 4 shuttles'
  ],
  [TestType.SIT_UPS]: [
    'Lie on your back with knees bent at 90 degrees',
    'Keep feet flat on the ground',
    'Cross arms over chest',
    'Perform as many sit-ups as possible in 60 seconds',
    'Count only complete repetitions'
  ],
  [TestType.ENDURANCE_RUN]: [
    'For U-12: Complete 300m run at steady pace',
    'For 12+ years: Complete 1.6km run',
    'Maintain consistent pace throughout',
    'Do not stop or walk during the test',
    'Record total time accurately'
  ]
};

const assessmentSchema = yup.object({
  testType: yup.mixed<TestType>().oneOf(Object.values(TestType)).required(),
  notes: yup.string().max(500),
  timeTaken: yup.number().optional().positive(),
  distance: yup.number().optional().positive(),
  height: yup.number().optional().positive(),
  weight: yup.number().optional().positive(),
  reps: yup.number().optional().positive().integer()
}).required();

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAssessment, error, clearError, getScoreDisplay } = useAssessment();
  const capacitor = useCapacitorContext();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('instructions');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [uploadMode, setUploadMode] = useState<'record' | 'upload'>('record');
  const [exerciseMetrics, setExerciseMetrics] = useState<ExerciseMetrics>({
    reps: 0,
    formScore: 0,
    tempo: 0,
    rangeOfMotion: 0,
    symmetry: 0,
    feedback: []
  });

  const form = useForm<AssessmentForm>({
    resolver: yupResolver(assessmentSchema),
    defaultValues: { 
      testType: TestType.HEIGHT, 
      notes: '',
      timeTaken: undefined,
      distance: undefined,
      height: undefined,
      weight: undefined,
      reps: undefined
    }
  });

  const testType = form.watch('testType');

  // Helper function to get required manual input fields based on test type
  const getManualInputFields = (type: TestType) => {
    switch (type) {
      case TestType.TENNIS_STANDING_START:
        return [{ name: 'timeTaken', label: 'Time Taken (seconds)', type: 'number', step: 0.01 }];
      
      case TestType.FOUR_X_10M_SHUTTLE_RUN:
        return [{ name: 'timeTaken', label: 'Total Time (seconds)', type: 'number', step: 0.1 }];
      
      case TestType.ENDURANCE_RUN:
        return [
          { name: 'timeTaken', label: 'Time Taken (seconds)', type: 'number', step: 1 },
          { name: 'distance', label: 'Distance (meters)', type: 'number', step: 1, placeholder: '300 or 1600' }
        ];
      
      case TestType.MEDICINE_BALL_THROW:
        return [{ name: 'distance', label: 'Throw Distance (meters)', type: 'number', step: 0.1 }];
      
      case TestType.STANDING_BROAD_JUMP:
        return [{ name: 'distance', label: 'Jump Distance (cm)', type: 'number', step: 1 }];
      
      case TestType.STANDING_VERTICAL_JUMP:
        return [{ name: 'distance', label: 'Jump Height (cm)', type: 'number', step: 1 }];
      
      case TestType.SIT_AND_REACH:
        return [{ name: 'distance', label: 'Reach Distance (cm)', type: 'number', step: 0.1 }];
      
      case TestType.HEIGHT:
        return [{ name: 'height', label: 'Height (cm)', type: 'number', step: 0.1 }];
      
      case TestType.WEIGHT:
        return [{ name: 'weight', label: 'Weight (kg)', type: 'number', step: 0.1 }];
      
      case TestType.SIT_UPS:
        return [
          { name: 'reps', label: 'Number of Reps', type: 'number', step: 1 },
          { name: 'timeTaken', label: 'Time Duration (seconds)', type: 'number', step: 1, placeholder: '60' }
        ];
      
      default:
        return [];
    }
  };

  // Simulate exercise metrics updates (in a real app, this would come from pose detection)
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      setExerciseMetrics(prev => {
        // Only increment reps for exercises where it makes sense (like sit-ups)
        const newReps = testType === TestType.SIT_UPS
          ? Math.min(prev.reps + Math.floor(Math.random() * 2), 50)
          : prev.reps;
          
        return {
          reps: newReps,
          formScore: Math.min(100, prev.formScore + (Math.random() * 5)),
          tempo: 1.5 + (Math.random() * 0.5),
          rangeOfMotion: 80 + (Math.random() * 20),
          symmetry: 85 + (Math.random() * 15),
          feedback: [
            {
              message: getRandomFeedback(testType, newReps),
              severity: getRandomSeverity()
            }
          ]
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isRecording, testType]);

  const getRandomFeedback = (type: TestType, reps: number): string => {
    // Use type assertion to handle dynamic property access
    const feedbacks: Record<string, string[]> = {
      [TestType.SIT_UPS]: [
        'Great form! Keep it up!',
        'Keep your knees bent at 90 degrees',
        'Cross your arms over your chest',
        'Maintain a steady pace',
        `You've completed ${reps} reps!`
      ],
      [TestType.STANDING_VERTICAL_JUMP]: [
        'Good jump!',
        'Use your arms for momentum',
        'Land safely with both feet',
        'Try to reach higher',
        'Excellent explosive power!'
      ],
      [TestType.STANDING_BROAD_JUMP]: [
        'Good takeoff!',
        'Extend your legs forward on landing',
        'Use your arms for momentum',
        'Great distance!',
        'Try to land with both feet together'
      ]
    };
    
    const typeFeedbacks = feedbacks[type] || ['Keep going!'];
    return typeFeedbacks[Math.floor(Math.random() * typeFeedbacks.length)];
  };

  const getRandomSeverity = (): 'success' | 'warning' | 'info' | 'error' => {
    const severities: ('success' | 'warning' | 'info' | 'error')[] = ['success', 'warning', 'info', 'error'];
    return severities[Math.floor(Math.random() * severities.length)];
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  // Capture location for assessment context
  const handleCaptureLocation = async () => {
    if (!capacitor.permissions.location) {
      const permissions = await capacitor.requestPermissions();
      if (!permissions.location) {
        alert('Location permission is required to capture assessment location.');
        return;
      }
    }

    setGettingLocation(true);
    try {
      const location = await capacitor.getCurrentLocation();
      if (location) {
        setLocationData({
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy
        });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setGettingLocation(false);
    }
  };

  // Handle video file upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      console.log('Video file uploaded:', file.name, file.size, 'bytes');
      // Note: Uploaded videos will be processed by AI/ML for pose estimation
    } else {
      alert('Please select a valid video file.');
    }
  };

  const onUpload = useCallback(async (file: File) => {
    setUploadingVideo(true);
    try {
      clearError();
      const data = form.getValues();
      
      // Collect manual measurements
      const manualMeasurements = {
        timeTaken: data.timeTaken,
        distance: data.distance,
        height: data.height,
        weight: data.weight,
        reps: data.reps
      };
      
      const assessment = await createAssessment(data.testType, file, data.notes || '', manualMeasurements);
      setLastResult(getScoreDisplay(assessment.testType, assessment.score));
      
      // Save workout session to progress tracking
      try {
        progressTrackingService.saveWorkoutSession({
          date: new Date().toISOString(),
          exerciseType: data.testType,
          reps: exerciseMetrics.reps || 0,
          formScore: exerciseMetrics.formScore || assessment.score,
          duration: recordingDuration,
          notes: data.notes || '',
        });
        console.log('Assessment result automatically saved to performance metrics and progress tracking');
      } catch (err) {
        console.error('Failed to save workout session:', err);
        // Don't fail the assessment if progress tracking fails
      }
      
      setVideoFile(null);
      
      // Redirect to results page after successful submission
      setTimeout(() => {
        navigate(`/assessment/results/${assessment.id}`);
      }, 1500); // Show success message briefly before redirecting
      
    } finally {
      setUploadingVideo(false);
    }
  }, [clearError, createAssessment, form, navigate, exerciseMetrics, recordingDuration]);



  const renderTabContent = () => {
    switch (activeTab) {
      case 'instructions':
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Instructions
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 3 }}>
              {TEST_INSTRUCTIONS[testType as keyof typeof TEST_INSTRUCTIONS]?.map((instruction, index) => (
                <li key={index}>
                  <Typography variant="body1">{instruction}</Typography>
                </li>
              )) || (
                <Typography variant="body1">No specific instructions available for this test.</Typography>
              )}
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setActiveTab('test')}
              sx={{ mt: 2 }}
            >
              Start Test
            </Button>
          </Box>
        );
      
      case 'test':
        return (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🤖 AI-Powered Pose Analysis
              </Typography>
              <Typography variant="body2">
                {uploadMode === 'record' 
                  ? 'Watch the green skeleton overlay to see your form in real-time. The AI tracks your joints, calculates angles, and counts reps automatically!'
                  : 'Upload your video and our AI will analyze your pose, detect patterns, and provide detailed feedback on your form and performance.'}
              </Typography>
            </Alert>

            {/* Mode Selection */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
              <Button
                variant={uploadMode === 'record' ? 'contained' : 'outlined'}
                onClick={() => setUploadMode('record')}
                startIcon={<VideocamIcon />}
              >
                Record Video
              </Button>
              <Button
                variant={uploadMode === 'upload' ? 'contained' : 'outlined'}
                onClick={() => setUploadMode('upload')}
                startIcon={<UploadIcon />}
              >
                Upload Video
              </Button>
            </Box>

            {uploadMode === 'record' ? (
              /* Simple Video Recorder with Pose Detection */
              <SimpleVideoRecorder
                exerciseType={testType}
                onVideoRecorded={(videoBlob) => {
                  // Convert blob to File
                  const videoFile = new File([videoBlob], `assessment-${Date.now()}.webm`, {
                    type: 'video/webm'
                  });
                  setVideoFile(videoFile);
                  console.log('Video recorded:', videoFile);
                }}
                onMetricsUpdate={(metrics) => {
                  setExerciseMetrics(prev => ({
                    ...prev,
                    ...metrics
                  }));
                }}
              />
            ) : (
              /* Video Upload Section */
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Upload Your Assessment Video
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Select a video file from your device. Our AI will analyze your movements, detect pose patterns, and provide detailed performance metrics.
                </Typography>
                
                <input
                  accept="video/*"
                  style={{ display: 'none' }}
                  id="video-upload-input"
                  type="file"
                  onChange={handleVideoUpload}
                />
                <label htmlFor="video-upload-input">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<UploadIcon />}
                    size="large"
                  >
                    Choose Video File
                  </Button>
                </label>

                {videoFile && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                      ✅ Video selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      The video will be processed by our ML model for pose estimation and pattern detection.
                    </Typography>
                  </Alert>
                )}
              </Paper>
            )}

            {/* Manual Measurement Input Fields */}
            {getManualInputFields(testType).length > 0 && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  📊 Manual Measurements
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Enter your actual measurements to enhance AI analysis accuracy. These values will be combined with video analysis for more precise results.
                </Typography>
                
                <Grid container spacing={2}>
                  {getManualInputFields(testType).map((field) => (
                    <Grid item xs={12} sm={6} key={field.name}>
                      <TextField
                        fullWidth
                        label={field.label}
                        type={field.type}
                        inputProps={{ 
                          step: field.step,
                          min: 0
                        }}
                        placeholder={field.placeholder}
                        value={form.watch(field.name as keyof AssessmentForm) || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          form.setValue(field.name as keyof AssessmentForm, value as any);
                        }}
                        helperText={`Optional: Improves accuracy of AI analysis`}
                        variant="outlined"
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* Notes Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                📝 Additional Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                placeholder="Add any additional observations, conditions, or comments about this assessment..."
                value={form.watch('notes') || ''}
                onChange={(e) => form.setValue('notes', e.target.value)}
                variant="outlined"
                helperText="E.g., weather conditions, equipment used, how you felt, etc."
              />
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveTab('instructions')}
                disabled={isRecording}
              >
                Back to Instructions
              </Button>
              <Box>
                <Button
                  variant="contained"
                  color="success"
                  disabled={!videoFile || uploadingVideo}
                  onClick={() => videoFile && onUpload(videoFile)}
                  startIcon={uploadingVideo ? <CircularProgress size={20} /> : <UploadIcon />}
                >
                  {uploadingVideo ? 'Analyzing with AI...' : 'Submit Test'}
                </Button>
              </Box>
            </Box>
          </Box>
        );
      
      case 'history':
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Previous Test Results
            </Typography>
            <Typography color="textSecondary">
              Your test history will appear here.
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => setActiveTab('instructions')}
              sx={{ mt: 2 }}
            >
              Back to Instructions
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Assessment Tests
          </Typography>
          <Chip 
            label={isRecording ? 'Recording...' : 'Ready'} 
            color={isRecording ? 'error' : 'success'} 
            size="small" 
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        {/* Native Features Status */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Instructions" value="instructions" />
          <Tab label="Take Test" value="test" />
          <Tab label="History" value="history" />
        </Tabs>

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="test-type-label">Test Type</InputLabel>
            <Select
              labelId="test-type-label"
              id="test-type"
              value={testType}
              onChange={(e) => form.setValue('testType', e.target.value as TestType)}
              label="Test Type"
              disabled={isRecording}
            >
              {Object.values(TestType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<DeviceIcon />}
              label={capacitor.isNative ? 'Native App' : 'Web'}
              color={capacitor.isNative ? 'success' : 'default'}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<NetworkIcon />}
              label={capacitor.networkInfo?.connected ? 'Online' : 'Offline'}
              color={capacitor.networkInfo?.connected ? 'success' : 'warning'}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Native Actions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Assessment Tools
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Capture current location for assessment context">
              <Button
                variant="outlined"
                startIcon={gettingLocation ? <CircularProgress size={16} /> : <LocationIcon />}
                onClick={handleCaptureLocation}
                disabled={gettingLocation}
                size="small"
              >
                {locationData ? 'Location Captured' : 'Get Location'}
              </Button>
            </Tooltip>
          </Box>
          
          {locationData && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Location captured: {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)} 
              (±{locationData.accuracy.toFixed(0)}m)
            </Alert>
          )}
        </Box>

        {renderTabContent()}

        {/* Error and Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {lastResult && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Assessment Complete! 🎉
            </Typography>
            <Typography variant="body2">
              {lastResult}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              ✅ Result automatically saved to your Performance Metrics for tracking progress
            </Typography>
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default AssessmentPage;
