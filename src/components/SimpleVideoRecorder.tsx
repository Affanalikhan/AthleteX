import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, Alert, IconButton, Tooltip } from '@mui/material';
import { Videocam, Stop, RecordVoiceOver, VolumeOff } from '@mui/icons-material';
import { Pose, Results as PoseResults } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import voiceTrainerService from '../services/voiceTrainerService';

// Define pose connections manually since import might not work
const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [29, 31],
  [27, 31], [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
];

interface SimpleVideoRecorderProps {
  onVideoRecorded: (videoBlob: Blob) => void;
  onMetricsUpdate?: (metrics: any) => void;
  exerciseType: string;
}

const SimpleVideoRecorder: React.FC<SimpleVideoRecorderProps> = ({
  onVideoRecorded,
  onMetricsUpdate,
  exerciseType
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isPoseReady, setIsPoseReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastFormFeedbackTime, setLastFormFeedbackTime] = useState(0);
  const [hasGivenStartInstructions, setHasGivenStartInstructions] = useState(false);

  // Calculate angle between three points
  const calculateAngle = (a: any, b: any, c: any): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  // Get test-specific instructions
  const getTestInstructions = (testType: string): string[] => {
    const type = testType.toLowerCase();
    
    if (type.includes('sit_ups') || type.includes('sit')) {
      return [
        'Position yourself with knees bent at 90 degrees',
        'Keep your feet flat on the ground',
        'Cross your arms over your chest',
        'Perform as many sit-ups as possible',
        'Maintain proper form throughout'
      ];
    } else if (type.includes('jump') || type.includes('vertical') || type.includes('broad')) {
      return [
        'Stand with feet shoulder-width apart',
        'Bend your knees and swing your arms back',
        'Jump as high as possible',
        'Land safely with both feet',
        'Perform 3 attempts'
      ];
    } else if (type.includes('reach') || type.includes('flexibility')) {
      return [
        'Sit with legs straight and feet against the box',
        'Keep your knees straight',
        'Reach forward slowly with both hands',
        'Hold the furthest position for 2 seconds',
        'Perform 3 attempts'
      ];
    } else if (type.includes('shuttle') || type.includes('sprint')) {
      return [
        'Start behind the line',
        'Sprint as fast as possible',
        'Touch each marker',
        'Maintain proper running form',
        'Give maximum effort'
      ];
    } else if (type.includes('throw')) {
      return [
        'Sit with back against the wall',
        'Hold the ball at chest level',
        'Throw as far as possible',
        'Use explosive power',
        'Perform 3 attempts'
      ];
    }
    
    return [
      'Position yourself correctly',
      'Maintain proper form',
      'Give your best effort',
      'Stay focused'
    ];
  };

  // Provide voice guidance based on form analysis
  const provideFormGuidance = (testType: string, angles: any, currentTime: number) => {
    if (!voiceEnabled) return;
    
    // Avoid too frequent feedback (minimum 5 seconds between messages)
    if (currentTime - lastFormFeedbackTime < 5) return;
    
    const type = testType.toLowerCase();
    
    if (type.includes('sit_ups')) {
      if (angles.avgHipAngle > 150) {
        voiceTrainerService.correctForm('core_engaged');
        setLastFormFeedbackTime(currentTime);
      } else if (angles.avgHipAngle < 90) {
        voiceTrainerService.speak('Good form! Keep it up!', 'normal');
        setLastFormFeedbackTime(currentTime);
      }
    } else if (type.includes('jump')) {
      if (angles.avgKneeAngle < 140) {
        voiceTrainerService.correctForm('full_range');
        setLastFormFeedbackTime(currentTime);
      } else if (angles.avgKneeAngle > 160) {
        voiceTrainerService.speak('Excellent extension!', 'normal');
        setLastFormFeedbackTime(currentTime);
      }
    } else if (type.includes('reach')) {
      if (angles.spineAngle > 120) {
        voiceTrainerService.speak('Reach further forward', 'normal');
        setLastFormFeedbackTime(currentTime);
      } else if (angles.spineAngle < 90) {
        voiceTrainerService.speak('Great flexibility!', 'normal');
        setLastFormFeedbackTime(currentTime);
      }
    }
  };

  // Draw angle text near joint
  const drawAngleText = (ctx: CanvasRenderingContext2D, landmark: any, angle: number, side: string) => {
    const x = landmark.x * ctx.canvas.width;
    const y = landmark.y * ctx.canvas.height;
    
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = angle < 90 ? '#ff0000' : angle < 160 ? '#ffff00' : '#00ff00';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    
    const text = `${side}: ${Math.round(angle)}°`;
    ctx.strokeText(text, x + 10, y);
    ctx.fillText(text, x + 10, y);
  };

  // Draw metrics overlay
  const drawMetricsOverlay = (ctx: CanvasRenderingContext2D) => {
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 100);
    
    // Reps
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText(`REPS: ${reps}`, 20, 40);
    ctx.fillText(`REPS: ${reps}`, 20, 40);
    
    // Form Score
    const formColor = formScore > 80 ? '#00ff00' : formScore > 60 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = formColor;
    ctx.strokeText(`Form: ${formScore}%`, 20, 70);
    ctx.fillText(`Form: ${formScore}%`, 20, 70);
    
    // Time
    ctx.fillStyle = '#00ffff';
    const minutes = Math.floor(recordingTime / 60);
    const seconds = recordingTime % 60;
    ctx.strokeText(`${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 100);
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 100);
  };

  // Analyze exercise based on type
  const analyzeExercise = (landmarks: any[], ctx: CanvasRenderingContext2D) => {
    const exerciseLower = exerciseType.toLowerCase();
    
    if (exerciseLower.includes('sit_ups') || exerciseLower.includes('sit')) {
      // Analyze sit-ups - check hip and knee angles
      if (landmarks[11] && landmarks[23] && landmarks[25]) {
        const leftHipAngle = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
        const rightHipAngle = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
        
        // Draw angle text
        const avgAngle = (leftHipAngle + rightHipAngle) / 2;
        drawAngleText(ctx, landmarks[23], leftHipAngle, 'L Hip');
        drawAngleText(ctx, landmarks[24], rightHipAngle, 'R Hip');
        
        // Update form score based on angle (sit-up position)
        const newFormScore = avgAngle < 120 ? 100 : avgAngle < 150 ? 80 : 60;
        setFormScore(newFormScore);
        
        // Voice guidance
        provideFormGuidance(exerciseType, { avgHipAngle: avgAngle }, recordingTime);
      }
    } else if (exerciseLower.includes('jump') || exerciseLower.includes('vertical') || exerciseLower.includes('broad')) {
      // Analyze jumps - check knee and hip extension
      if (landmarks[23] && landmarks[25] && landmarks[27]) {
        const leftKneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
        const rightKneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
        
        drawAngleText(ctx, landmarks[25], leftKneeAngle, 'L Knee');
        drawAngleText(ctx, landmarks[26], rightKneeAngle, 'R Knee');
        
        // Form score based on knee extension (straighter = better for jumps)
        const avgAngle = (leftKneeAngle + rightKneeAngle) / 2;
        const newFormScore = avgAngle > 160 ? 100 : avgAngle > 140 ? 80 : 60;
        setFormScore(newFormScore);
      }
    } else if (exerciseLower.includes('reach') || exerciseLower.includes('flexibility')) {
      // Analyze sit and reach - check spine flexion
      if (landmarks[11] && landmarks[12] && landmarks[23]) {
        const spineAngle = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
        drawAngleText(ctx, landmarks[23], spineAngle, 'Spine');
        
        // Better flexibility = smaller angle (more forward lean)
        const newFormScore = spineAngle < 90 ? 100 : spineAngle < 120 ? 80 : 60;
        setFormScore(newFormScore);
      }
    } else {
      // General posture analysis for other tests
      if (landmarks[11] && landmarks[23] && landmarks[25]) {
        const postureScore = 75 + Math.random() * 25; // Simulate posture analysis
        setFormScore(Math.round(postureScore));
      }
    }

    // Draw metrics overlay
    drawMetricsOverlay(ctx);
  };

  // Pose detection results handler
  const onPoseResults = useCallback((results: PoseResults) => {
    console.log('Pose results received:', results.poseLandmarks ? 'landmarks detected' : 'no landmarks');
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      console.log('Drawing pose landmarks...');
      
      // Draw skeleton connections (green lines)
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS as any, {
        color: '#00FF00',
        lineWidth: 4
      });

      // Draw landmarks (red dots)
      drawLandmarks(ctx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
        radius: 6
      });

      // Analyze exercise and update metrics
      analyzeExercise(results.poseLandmarks, ctx);
    }
  }, [exerciseType, reps, formScore, recordingTime]);

  // Initialize MediaPipe Pose
  useEffect(() => {
    const initPose = async () => {
      try {
        console.log('Initializing pose detection...');
        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1635988162/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults(onPoseResults);
        poseRef.current = pose;
        setIsPoseReady(true);
        console.log('Pose detection initialized successfully');
      } catch (err) {
        console.error('Failed to initialize pose detection:', err);
        setError('Failed to load pose detection model');
      }
    };

    initPose();

    return () => {
      if (poseRef.current) {
        poseRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onPoseResults]);

  // Process video frames for pose detection
  const processFrame = async () => {
    if (videoRef.current && poseRef.current && videoRef.current.readyState === 4) {
      try {
        await poseRef.current.send({ image: videoRef.current });
      } catch (err) {
        console.error('Error processing frame:', err);
      }
    }
    
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  };

  // Start pose detection when recording starts
  useEffect(() => {
    if (isRecording && poseRef.current) {
      console.log('Starting pose detection loop...');
      processFrame();
    }
  }, [isRecording]);

  // Timer effect with voice guidance
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Voice guidance at specific intervals
          if (voiceEnabled) {
            if (newTime === 10) {
              voiceTrainerService.speak('10 seconds in, keep going!', 'normal');
            } else if (newTime === 30) {
              voiceTrainerService.speak('30 seconds, you\'re doing great!', 'normal');
            } else if (newTime === 60) {
              voiceTrainerService.speak('One minute complete, excellent work!', 'normal');
            }
          }
          
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, voiceEnabled]);

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      console.log('Starting recording...');

      // Voice guidance - give instructions
      if (voiceEnabled && !hasGivenStartInstructions) {
        const instructions = getTestInstructions(exerciseType);
        voiceTrainerService.speak(`Starting ${exerciseType} assessment. ${instructions[0]}`, 'high');
        setTimeout(() => {
          if (instructions[1]) {
            voiceTrainerService.speak(instructions[1], 'normal');
          }
        }, 3000);
        setHasGivenStartInstructions(true);
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('Video playing');
      }

      // Initialize MediaRecorder
      recordedChunksRef.current = [];
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      console.log('MediaRecorder started');

      setIsRecording(true);
      setRecordingTime(0);
      setReps(0);
      setFormScore(0);

      // Pose detection will start automatically via useEffect

    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Failed to start recording: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Stop recording
  const stopRecording = () => {
    console.log('Stopping recording...');
    setIsRecording(false);

    // Voice guidance - completion message
    if (voiceEnabled) {
      voiceTrainerService.speak('Recording complete! Great job!', 'high');
      if (reps > 0) {
        voiceTrainerService.speak(`You completed ${reps} repetitions with a form score of ${formScore}%`, 'normal');
      }
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        console.log('Video blob created:', videoBlob.size, 'bytes');
        onVideoRecorded(videoBlob);
        recordedChunksRef.current = [];
      };
      mediaRecorderRef.current.stop();
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Reset for next recording
    setHasGivenStartInstructions(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="primary">
          Video Assessment
        </Typography>
        <Tooltip title={voiceEnabled ? "Voice guidance enabled" : "Voice guidance disabled"}>
          <IconButton
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            color={voiceEnabled ? "primary" : "default"}
            size="small"
          >
            {voiceEnabled ? <RecordVoiceOver /> : <VolumeOff />}
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!isPoseReady && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loading pose detection model...
        </Alert>
      )}

      <Box sx={{ position: 'relative', width: '100%', height: '480px', backgroundColor: '#000', mb: 2 }}>
        {/* Video element */}
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
            transform: 'scaleX(-1)'
          }}
        />

        {/* Canvas for pose overlay */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)'
          }}
        />

        {/* Recording indicator */}
        {isRecording && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: 'white',
                animation: 'pulse 1s infinite'
              }}
            />
            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </Box>
        )}
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {!isRecording ? (
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Videocam />}
            onClick={startRecording}
            disabled={!isPoseReady}
          >
            Start Recording
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<Stop />}
            onClick={stopRecording}
          >
            Stop Recording
          </Button>
        )}
      </Box>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Paper>
  );
};

export default SimpleVideoRecorder;
