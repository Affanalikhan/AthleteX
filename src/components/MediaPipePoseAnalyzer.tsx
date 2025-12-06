/* eslint-disable import/first */
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Box, Button, Typography, Paper, CircularProgress, 
  Slider, FormControl, InputLabel, Select, MenuItem, 
  Switch, FormControlLabel, Dialog, DialogTitle, 
  DialogContent, DialogActions, IconButton, Tooltip,
  Grid, LinearProgress, Alert, SelectChangeEvent
} from '@mui/material';
import { 
  Videocam, Stop, Replay, Settings, 
  PlayArrow, Pause, Save, Speed, Info, 
  CheckCircle, Warning, Error as ErrorIcon
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import { Pose, Results as PoseResults } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { EXERCISES, ExerciseSessionService, AnalyticsService } from '../services/exerciseService';
/* eslint-enable import/first */

// Types
type ExerciseMetrics = {
  reps: number;
  formScore: number;
  tempo: number;
  rangeOfMotion: number;
  symmetry: number;
  feedback: Array<{ message: string; severity: 'success' | 'warning' | 'error' | 'info' }>;
  message?: string;
  severity?: 'success' | 'warning' | 'error' | 'info';
  lastUpdate?: number;
  wasDown?: boolean;
}

interface SessionData {
  id: string;
  userId: string;
  exerciseType: string;
  timestamp: Date;
  duration: number;
  metrics: ExerciseMetrics;
  landmarks: any[];
  keypoints: any[];
  videoUrl?: string;
}

// Web Worker for heavy computations
const createWorker = () => {
  if (typeof window !== 'undefined') {
    return new Worker(new URL('../workers/poseWorker.ts', import.meta.url));
  }
  return null;
};

// Ideal form angles for different exercises (in degrees)
const IDEAL_ANGLES: Record<string, Record<string, [number, number]>> = {
  PUSHUP: {
    shoulder_elbow_wrist: [160, 180],
    shoulder_hip_knee: [160, 180],
  },
  SQUAT: {
    hip_knee_ankle: [160, 180],
    shoulder_hip_knee: [140, 180],
  },
  PULLUP: {
    shoulder_elbow: [0, 30],
    shoulder_hip_knee: [160, 180],
  },
};

// Audio feedback
const playAudioFeedback = (type: 'success' | 'warning' | 'error') => {
  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.volume = 0.5;
  audio.play().catch(e => console.warn('Audio playback failed:', e));
};

declare global {
  interface Window {
    poseDetection: any;
  }
}

interface MediaPipePoseAnalyzerProps {
  onAnalysisComplete: (results: any) => void;
  exerciseType: string;
  onFrameProcessed?: (results: PoseResults) => void;
  onVideoRecorded?: (videoBlob: Blob) => void;
}

// Helper function to draw form feedback on canvas
const drawFormFeedback = (
  ctx: CanvasRenderingContext2D,
  feedback: Array<{message: string, severity: string}>,
  width: number,
  height: number
) => {
  if (!ctx) return;
  
  const yOffset = 30;
  const lineHeight = 20;
  const padding = 10;
  const maxWidth = width * 0.8;
  
  feedback.forEach((item, index) => {
    const y = yOffset + (lineHeight * index);
    
    // Set text style based on severity
    ctx.font = '16px Arial';
    ctx.fillStyle = {
      'error': '#f44336',
      'warning': '#ff9800',
      'success': '#4caf50',
      'info': '#2196f3'
    }[item.severity] || '#000';
    
    ctx.textBaseline = 'top';
    ctx.fillText(
      item.message.length > 30 ? item.message.substring(0, 27) + '...' : item.message, 
      padding, 
      y,
      maxWidth - 10
    );
  });
};

// Function to save session data to cloud
const saveSessionToCloud = async (sessionData: SessionData): Promise<boolean> => {
  try {
    console.log('Saving session to cloud:', sessionData);
    return true;
  } catch (error) {
    console.error('Error saving to cloud:', error);
    return false;
  }
};

// Helper function to format time (seconds to MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// MediaPipe Pose connections
export const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12], [11, 13], [12, 14],
  [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28], [27, 29], [28, 30],
  [29, 31], [30, 32],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24],
  [23, 24],
  [27, 31], [28, 32]
];

const MediaPipePoseAnalyzer: React.FC<MediaPipePoseAnalyzerProps> = ({
  onAnalysisComplete,
  exerciseType,
  onFrameProcessed,
  onVideoRecorded
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const lastFrameTimeRef = useRef(0);
  const frameTimesRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const pose = useRef<Pose | null>(null);
  const camera = useRef<Camera | null>(null);

  // UI State
  const [isRecording, setIsRecording] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Performance State
  const [performanceMode, setPerformanceMode] = useState<'performance' | 'balanced' | 'quality'>('balanced');
  const [frameSkip, setFrameSkip] = useState(1);
  const [frameCounter, setFrameCounter] = useState(0);
  
  // Exercise State
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [repetitionCount, setRepetitionCount] = useState(0);
  
  // Session State
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [analysisResults, setAnalysisResults] = useState<ExerciseMetrics>({
    reps: 0,
    formScore: 0,
    tempo: 0,
    rangeOfMotion: 0,
    symmetry: 0,
    feedback: [],
    wasDown: false,
    lastUpdate: 0
  });

  // Services
  const exerciseService = useMemo(() => ExerciseSessionService.getInstance(), []);

  // Calculate angle between three points
  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let degrees = Math.abs(radians * (180 / Math.PI));
    return degrees > 180 ? 360 - degrees : degrees;
  };

  // Draw angle indicator on canvas
  const drawAngleIndicator = (
    ctx: CanvasRenderingContext2D,
    point1: any,
    point2: any,
    point3: any,
    width: number,
    height: number,
    label: string
  ) => {
    if (!point1 || !point2 || !point3) return;
    
    const angle = calculateAngle(point1, point2, point3);
    const x = point2.x * width;
    const y = point2.y * height;
    
    // Draw angle arc
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, 2 * Math.PI);
    ctx.strokeStyle = angle < 90 ? '#ff0000' : angle < 160 ? '#ffff00' : '#00ff00';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw angle text
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText(`${label}: ${Math.round(angle)}°`, x + 40, y);
    ctx.fillText(`${label}: ${Math.round(angle)}°`, x + 40, y);
  };

  // Draw metrics on canvas with enhanced visual feedback
  const drawMetrics = (ctx: CanvasRenderingContext2D, metrics: any) => {
    const { fps, repetitionCount, ...additionalMetrics } = metrics;
    const yStart = 30;
    const yStep = 30;
    let y = yStart;
    
    // Background for better readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, 5, 250, yStart + (yStep * 5));
    
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    
    // Reps (most important)
    ctx.strokeText(`REPS: ${repetitionCount}`, 15, y);
    ctx.fillText(`REPS: ${repetitionCount}`, 15, y);
    y += yStep;
    
    // Form Score
    if (additionalMetrics.formScore !== undefined) {
      const formColor = additionalMetrics.formScore > 80 ? '#00ff00' : 
                       additionalMetrics.formScore > 60 ? '#ffff00' : '#ff0000';
      ctx.fillStyle = formColor;
      ctx.strokeText(`Form: ${Math.round(additionalMetrics.formScore)}%`, 15, y);
      ctx.fillText(`Form: ${Math.round(additionalMetrics.formScore)}%`, 15, y);
      y += yStep;
    }
    
    // Range of Motion (angle)
    if (additionalMetrics.rangeOfMotion !== undefined) {
      ctx.fillStyle = '#00ffff';
      ctx.strokeText(`Angle: ${Math.round(additionalMetrics.rangeOfMotion)}°`, 15, y);
      ctx.fillText(`Angle: ${Math.round(additionalMetrics.rangeOfMotion)}°`, 15, y);
      y += yStep;
    }
    
    // Symmetry
    if (additionalMetrics.symmetry !== undefined) {
      ctx.fillStyle = '#ff00ff';
      ctx.strokeText(`Symmetry: ${Math.round(additionalMetrics.symmetry)}%`, 15, y);
      ctx.fillText(`Symmetry: ${Math.round(additionalMetrics.symmetry)}%`, 15, y);
      y += yStep;
    }
    
    // Exercise State
    const state = additionalMetrics.wasDown ? '⬇️ DOWN' : '⬆️ UP';
    ctx.fillStyle = additionalMetrics.wasDown ? '#ff9800' : '#4caf50';
    ctx.font = 'bold 18px Arial';
    ctx.strokeText(`State: ${state}`, 15, y);
    ctx.fillText(`State: ${state}`, 15, y);
  };

  // Analyze exercise based on landmarks with angle calculations
  const analyzeExercise = (landmarks: any) => {
    const newResults = { ...analysisResults };
    const exerciseLower = exerciseType.toLowerCase();
    
    // Squat analysis
    if (exerciseLower.includes('squat') || exerciseLower.includes('sit')) {
      if (landmarks[23] && landmarks[25] && landmarks[27]) { // Left: hip, knee, ankle
        const leftKneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
        const rightKneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
        
        // Display angles
        newResults.rangeOfMotion = Math.min(leftKneeAngle, rightKneeAngle);
        
        // Count reps based on knee angle
        if (leftKneeAngle < 100 && rightKneeAngle < 100) { // Squat down
          if (!newResults.wasDown) {
            newResults.wasDown = true;
            newResults.feedback = [{ message: 'Squat Down - Good depth!', severity: 'success' }];
          }
        } else if (leftKneeAngle > 160 && rightKneeAngle > 160) { // Stand up
          if (newResults.wasDown) {
            setRepetitionCount(prev => prev + 1);
            newResults.wasDown = false;
            newResults.feedback = [{ message: 'Rep Complete! Stand up fully.', severity: 'success' }];
          }
        }
        
        // Form feedback
        const angleDiff = Math.abs(leftKneeAngle - rightKneeAngle);
        newResults.symmetry = 100 - Math.min(angleDiff * 2, 50);
        if (angleDiff > 15) {
          newResults.feedback = [{ message: 'Keep knees aligned evenly', severity: 'warning' }];
        }
      }
    }
    // Push-up analysis
    else if (exerciseLower.includes('push') || exerciseLower.includes('up')) {
      if (landmarks[11] && landmarks[13] && landmarks[15]) {
        const leftElbowAngle = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
        const rightElbowAngle = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
        
        newResults.rangeOfMotion = Math.min(leftElbowAngle, rightElbowAngle);
        
        // Count reps
        if (leftElbowAngle < 90 && rightElbowAngle < 90) { // Down position
          if (!newResults.wasDown) {
            newResults.wasDown = true;
            newResults.feedback = [{ message: 'Down - Good form!', severity: 'success' }];
          }
        } else if (leftElbowAngle > 160 && rightElbowAngle > 160) { // Up position
          if (newResults.wasDown) {
            setRepetitionCount(prev => prev + 1);
            newResults.wasDown = false;
            newResults.feedback = [{ message: 'Rep Complete!', severity: 'success' }];
          }
        }
        
        // Symmetry check
        const angleDiff = Math.abs(leftElbowAngle - rightElbowAngle);
        newResults.symmetry = 100 - Math.min(angleDiff * 2, 50);
      }
    }
    // Generic arm exercise
    else {
      if (landmarks[15] && landmarks[16] && landmarks[11] && landmarks[12]) {
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        if (leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y) {
          if (!newResults.wasDown) {
            setRepetitionCount(prev => prev + 1);
            newResults.wasDown = true;
          }
        } else if (leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y) {
          newResults.wasDown = false;
        }
      }
    }

    setAnalysisResults(newResults);
  };

  // Handle pose detection results
  const onPoseResults = useCallback((results: PoseResults) => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(
      results.image,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    if (results.poseLandmarks) {
      // Draw pose skeleton
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
        radius: 4
      });

      // Draw angle indicators for key joints
      const exerciseLower = exerciseType.toLowerCase();
      if (exerciseLower.includes('squat') || exerciseLower.includes('sit')) {
        // Draw knee angles
        drawAngleIndicator(ctx, results.poseLandmarks[23], results.poseLandmarks[25], results.poseLandmarks[27], canvasRef.current!.width, canvasRef.current!.height, 'L Knee');
        drawAngleIndicator(ctx, results.poseLandmarks[24], results.poseLandmarks[26], results.poseLandmarks[28], canvasRef.current!.width, canvasRef.current!.height, 'R Knee');
      } else if (exerciseLower.includes('push')) {
        // Draw elbow angles
        drawAngleIndicator(ctx, results.poseLandmarks[11], results.poseLandmarks[13], results.poseLandmarks[15], canvasRef.current!.width, canvasRef.current!.height, 'L Elbow');
        drawAngleIndicator(ctx, results.poseLandmarks[12], results.poseLandmarks[14], results.poseLandmarks[16], canvasRef.current!.width, canvasRef.current!.height, 'R Elbow');
      }

      analyzeExercise(results.poseLandmarks);
    }

    const now = performance.now();
    if (startTime === 0) {
      setStartTime(now);
    }
    setFrameCount(prev => prev + 1);
    setFps(Math.round((frameCount / (now - startTime)) * 1000));

    onFrameProcessed?.(results);

    // Draw metrics overlay
    drawMetrics(ctx, {
      fps,
      repetitionCount,
      ...analysisResults
    });

    ctx.restore();
  }, [startTime, frameCount, analysisResults, onFrameProcessed]);

  // Initialize MediaPipe Pose
  useEffect(() => {
    const initializePose = async () => {
      try {
        setIsModelLoading(true);
        pose.current = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1635988162/${file}`
        });

        pose.current.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.current.onResults(onPoseResults);

        setIsModelLoading(false);
      } catch (err) {
        console.error('Error initializing pose detection:', err);
        setError('Failed to initialize pose detection. Please try again.');
        setIsModelLoading(false);
      }
    };

    initializePose();

    return () => {
      if (camera.current) {
        camera.current.stop();
      }
      if (pose.current) {
        pose.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onPoseResults]);

  // Start recording
  const startRecording = async () => {
    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'user' 
        },
        audio: false
      });

      console.log('Camera access granted, stream:', stream);

      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Set video source and play
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      console.log('Video playing');

      // Initialize MediaRecorder to capture video
      recordedChunksRef.current = [];
      
      // Try different codecs if vp9 is not supported
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      console.log('Using MediaRecorder with mimeType:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log('Recorded chunk:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      console.log('MediaRecorder started, state:', mediaRecorder.state);

      // Initialize pose detection
      if (!pose.current) {
        throw new Error('Pose detection not initialized');
      }

      // Use requestAnimationFrame for pose detection instead of Camera
      const detectPose = async () => {
        if (videoRef.current && pose.current && isRecording && !isPaused) {
          await pose.current.send({ image: videoRef.current });
          animationFrameRef.current = requestAnimationFrame(detectPose);
        }
      };
      
      detectPose();
      console.log('Pose detection started');

      setIsRecording(true);
      setStartTime(performance.now());
      setFrameCount(0);
      setRepetitionCount(0);
      setAnalysisResults({
        reps: 0,
        formScore: 0,
        tempo: 0,
        rangeOfMotion: 0,
        symmetry: 0,
        feedback: [],
        wasDown: false,
        lastUpdate: performance.now()
      });
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Failed to access camera: ${err instanceof Error ? err.message : 'Unknown error'}. Please check permissions.`);
    }
  };

  // Stop recording
  const stopRecording = () => {
    console.log('Stopping recording...');
    
    setIsRecording(false);
    
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      console.log('Animation frame cancelled');
    }
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('MediaRecorder stopped, state:', mediaRecorderRef.current.state);
      
      // Wait for final data and create blob
      mediaRecorderRef.current.onstop = () => {
        console.log('MediaRecorder onstop event, chunks:', recordedChunksRef.current.length);
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        console.log('Video blob created, size:', videoBlob.size, 'bytes');
        
        // Pass video blob to parent component
        if (onVideoRecorded) {
          onVideoRecorded(videoBlob);
          console.log('Video blob passed to parent');
        }
        
        recordedChunksRef.current = [];
      };
    }
    
    // Stop camera stream
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      video.srcObject = null;
    }

    const sessionData: SessionData = {
      id: `session-${Date.now()}`,
      userId: 'current-user',
      exerciseType,
      timestamp: new Date(),
      duration: (performance.now() - startTime) / 1000,
      metrics: {
        ...analysisResults,
        reps: repetitionCount
      },
      landmarks: [],
      keypoints: []
    };

    setCurrentSession(sessionData);
    setIsRecording(false);
  };

  // Toggle settings
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Handle performance mode change
  const handlePerformanceModeChange = (event: SelectChangeEvent) => {
    setPerformanceMode(event.target.value as 'performance' | 'balanced' | 'quality');
  };

  // Handle frame skip change
  const handleFrameSkipChange = (event: Event, value: number | number[]) => {
    setFrameSkip(Array.isArray(value) ? value[0] : value);
    setFrameCounter(0);
  };

  // Handle close settings
  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  // Handle save session
  const handleSaveSession = async () => {
    if (!currentSession) return;

    try {
      const saved = await saveSessionToCloud(currentSession);
      if (saved) {
        setSessionHistory(prev => [currentSession, ...prev]);
        setCurrentSession(null);
        onAnalysisComplete(currentSession);
      }
    } catch (err) {
      console.error('Error saving session:', err);
      setError('Failed to save session. Please try again.');
    }
  };

  // Handle discard session
  const handleDiscardSession = () => {
    setCurrentSession(null);
  };

  if (isModelLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading pose detection model...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {exerciseType} Analysis
        </Typography>
        <Box>
          <Tooltip title="Settings">
            <IconButton 
              onClick={() => setShowSettings(true)} 
              size="small"
              sx={{ mr: 1 }}
            >
              <Settings />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Performance: ${performanceMode}`}>
            <IconButton size="small">
              <Speed />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'relative', width: '100%', height: '500px', mb: 2, backgroundColor: '#000' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            display: 'block',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)',
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 2,
            zIndex: 10,
          }}
        >
          <IconButton
            color="primary"
            onClick={toggleSettings}
            sx={{ backgroundColor: 'background.paper' }}
          >
            <Settings />
          </IconButton>
          
          {!isRecording ? (
            <IconButton
              color="primary"
              onClick={startRecording}
              sx={{ backgroundColor: 'background.paper' }}
            >
              <Videocam />
            </IconButton>
          ) : (
            <IconButton
              color="secondary"
              onClick={stopRecording}
              sx={{ backgroundColor: 'background.paper' }}
            >
              <Stop />
            </IconButton>
          )}
          
          {isPaused ? (
            <IconButton
              color="primary"
              onClick={() => setIsPaused(false)}
              sx={{ backgroundColor: 'background.paper' }}
            >
              <PlayArrow />
            </IconButton>
          ) : (
            <IconButton
              color="primary"
              onClick={() => setIsPaused(true)}
              sx={{ backgroundColor: 'background.paper' }}
              disabled={!isRecording}
            >
              <Pause />
            </IconButton>
          )}
        </Box>
      </Box>

      <Dialog open={showSettings} onClose={handleCloseSettings}>
        <DialogTitle>Performance Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, padding: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="performance-mode-label">Performance Mode</InputLabel>
              <Select
                labelId="performance-mode-label"
                value={performanceMode}
                label="Performance Mode"
                onChange={handlePerformanceModeChange}
              >
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="balanced">Balanced</MenuItem>
                <MenuItem value="quality">Quality</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 3 }}>
              <Typography id="frame-skip-slider" gutterBottom>
                Frame Skip: {frameSkip}
              </Typography>
              <Slider
                value={frameSkip}
                onChange={handleFrameSkipChange}
                aria-labelledby="frame-skip-slider"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={0}
                max={10}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings}>Close</Button>
          <Button onClick={handleCloseSettings} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!currentSession}
        onClose={handleDiscardSession}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Session Review</DialogTitle>
        <DialogContent>
          {currentSession && (
            <Box>
              <Typography variant="h6">Exercise: {currentSession.exerciseType}</Typography>
              <Typography>Duration: {formatTime(currentSession.duration)}</Typography>
              <Typography>Form Score: {currentSession.metrics.formScore}%</Typography>
              <Typography>Repetitions: {currentSession.metrics.reps}</Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Feedback:
                </Typography>
                {currentSession.metrics.feedback.length > 0 ? (
                  <ul>
                    {currentSession.metrics.feedback.map((item, index) => (
                      <li key={index}>
                        <Typography color={item.severity === 'error' ? 'error' : 'textPrimary'}>
                          {item.message}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Typography>No feedback available</Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDiscardSession} color="primary">
            Discard
          </Button>
          <Button onClick={handleSaveSession} color="primary" variant="contained">
            Save Session
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MediaPipePoseAnalyzer;
