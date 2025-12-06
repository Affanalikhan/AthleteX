import React, { useRef, useState, useEffect } from 'react';
import { Button, Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { Videocam, Stop, Replay } from '@mui/icons-material';

declare global {
  interface Window {
    poseDetection: any;
  }
}

interface PoseAnalysisRecorderProps {
  onAnalysisComplete: (results: any) => void;
  exerciseType: string;
}

const PoseAnalysisRecorder: React.FC<PoseAnalysisRecorderProps> = ({ onAnalysisComplete, exerciseType }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poseDetector, setPoseDetector] = useState<any>(null);
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Load MediaPipe Pose model
  useEffect(() => {
    const loadPoseModel = async () => {
      try {
        const poseDetection = await import('@tensorflow-models/pose-detection');
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        };
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        setPoseDetector(detector);
        setIsModelLoading(false);
      } catch (err) {
        console.error('Failed to load pose detection model:', err);
        setError('Failed to load pose detection model. Please try again.');
        setIsModelLoading(false);
      }
    };

    loadPoseModel();

    return () => {
      if (poseDetector) {
        poseDetector.dispose();
      }
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setFrameCount(0);
      setStartTime(performance.now());
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setIsRecording(true);
        detectPose();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  interface ExerciseResult {
    exerciseType: string;
    timestamp: string;
    keyPoints: any;
    score: number;
    fps: number;
    count?: number;
  }

  const analyzeExercise = (pose: any): ExerciseResult => {
    const results: ExerciseResult = {
      exerciseType: exerciseType,
      timestamp: new Date().toISOString(),
      keyPoints: pose,
      score: 0,
      fps: 0,
      count: 0
    };

    switch (exerciseType.toLowerCase()) {
      case 'pushups':
        results.count = analyzePushups(pose);
        break;
      case 'squats':
        results.count = analyzeSquats(pose);
        break;
      case 'pullups':
        results.count = analyzePullups(pose);
        break;
      // Add more exercise types as needed
    }

    return results;
  };

  // Example analysis functions - these would be more sophisticated in production
  const analyzePushups = (pose: any) => {
    // Simplified pushup counter - counts when elbows bend past 90 degrees
    const leftElbow = pose.keypoints[9]; // Left elbow keypoint
    const rightElbow = pose.keypoints[10]; // Right elbow keypoint
    
    // This is a placeholder - actual implementation would track movement over time
    return Math.floor(frameCount / 30); // Rough estimate based on frame count
  };

  const analyzeSquats = (pose: any) => {
    // Simplified squat counter
    const leftHip = pose.keypoints[11]; // Left hip keypoint
    const rightHip = pose.keypoints[12]; // Right hip keypoint
    const leftKnee = pose.keypoints[13]; // Left knee keypoint
    const rightKnee = pose.keypoints[14]; // Right knee keypoint
    
    // This is a placeholder - actual implementation would track knee and hip angles
    return Math.floor(frameCount / 45); // Rough estimate based on frame count
  };

  const analyzePullups = (pose: any) => {
    // Simplified pullup counter
    const leftElbow = pose.keypoints[9]; // Left elbow keypoint
    const rightElbow = pose.keypoints[10]; // Right elbow keypoint
    
    // This is a placeholder - actual implementation would track elbow and shoulder movement
    return Math.floor(frameCount / 40); // Rough estimate based on frame count
  };

  const detectPose = async () => {
    if (!isRecording || !poseDetector || !videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Detect poses in the video stream
      const poses = await poseDetector.estimatePoses(video);
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw pose landmarks and skeleton if available
      if (poses && poses.length > 0) {
        const pose = poses[0];
        if (pose.keypoints) {
          drawKeypoints(pose.keypoints, 0.3, ctx);
          drawSkeleton(pose.keypoints, 0.3, ctx);
          
          // Analyze exercise and get results
          const analysis = analyzeExercise(pose);
          
          // Draw exercise-specific metrics
          drawMetrics(ctx, analysis);
        }
      }
      
      // Update FPS counter
      setFrameCount(prev => {
        const newCount = prev + 1;
        const elapsed = (performance.now() - startTime) / 1000;
        if (elapsed >= 1) { // Update FPS every second
          setFps(newCount / elapsed);
          setStartTime(performance.now());
          return 0;
        }
        return newCount;
      });
      
      // Continue the detection loop
      animationFrameRef.current = requestAnimationFrame(detectPose);
    } catch (err) {
      console.error('Error detecting pose:', err);
      stopRecording();
      setError('Error during pose detection. Please try again.');
    }
  };

  // Draw keypoints on the canvas
  const drawKeypoints = (keypoints: any[], minConfidence: number, ctx: CanvasRenderingContext2D) => {
    const keypointIndices = {
      NOSE: 0,
      LEFT_EYE: 1,
      RIGHT_EYE: 2,
      LEFT_EAR: 3,
      RIGHT_EAR: 4,
      LEFT_SHOULDER: 5,
      RIGHT_SHOULDER: 6,
      LEFT_ELBOW: 7,
      RIGHT_ELBOW: 8,
      LEFT_WRIST: 9,
      RIGHT_WRIST: 10,
      LEFT_HIP: 11,
      RIGHT_HIP: 12,
      LEFT_KNEE: 13,
      RIGHT_KNEE: 14,
      LEFT_ANKLE: 15,
      RIGHT_ANKLE: 16,
    };

    keypoints.forEach((keypoint: any) => {
      if (keypoint.score >= minConfidence) {
        const { y, x } = keypoint.position;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'aqua';
        ctx.fill();
      }
    });
  };

  // Draw skeleton on the canvas
  const drawSkeleton = (keypoints: any[], minConfidence: number, ctx: CanvasRenderingContext2D) => {
    const adjacentKeyPoints = [
      [0, 1], [0, 2], [1, 3], [2, 4], // Face
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // Upper body
      [5, 11], [6, 12], [11, 12], // Torso
      [11, 13], [13, 15], [12, 14], [14, 16] // Legs
    ];

    adjacentKeyPoints.forEach((indices) => {
      const [i, j] = indices;
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      if (kp1 && kp2 && kp1.score >= minConfidence && kp2.score >= minConfidence) {
        ctx.beginPath();
        ctx.moveTo(kp1.position.x, kp1.position.y);
        ctx.lineTo(kp2.position.x, kp2.position.y);
        ctx.strokeStyle = 'aqua';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  // Draw metrics on the canvas
  const drawMetrics = (ctx: CanvasRenderingContext2D | null, metrics: any) => {
    if (!ctx) return;
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    
    // Draw exercise type
    ctx.strokeText(`Exercise: ${metrics.exerciseType}`, 10, 30);
    ctx.fillText(`Exercise: ${metrics.exerciseType}`, 10, 30);
    
    // Draw FPS
    ctx.strokeText(`FPS: ${metrics.fps || 0}`, 10, 60);
    ctx.fillText(`FPS: ${metrics.fps || 0}`, 10, 60);
    
    // Draw count if available
    if (metrics.count !== undefined) {
      ctx.strokeText(`Count: ${metrics.count}`, 10, 90);
      ctx.fillText(`Count: ${metrics.count}`, 10, 90);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {exerciseType} Analysis
      </Typography>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Box sx={{ position: 'relative', mb: 2 }}>
        <video
          ref={videoRef}
          style={{
            display: isRecording ? 'block' : 'none',
            width: '100%',
            backgroundColor: '#000',
            borderRadius: '4px',
          }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: isRecording ? 'block' : 'none',
          }}
        />
        {!isRecording && (
          <Box
            sx={{
              width: '100%',
              height: '400px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '4px',
              border: '2px dashed #ccc',
            }}
          >
            <Typography variant="body1" color="textSecondary">
              Camera feed will appear here
            </Typography>
          </Box>
        )}
      </Box>
      
      <Grid container spacing={2} justifyContent="center">
        {isModelLoading ? (
          <Grid item>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
              Loading pose detection model...
            </Typography>
          </Grid>
        ) : isRecording ? (
          <>
            <Grid item>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Stop />}
                onClick={stopRecording}
                disabled={!isRecording}
              >
                Stop Recording
              </Button>
            </Grid>
          </>
        ) : (
          <>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Videocam />}
                onClick={startRecording}
                disabled={isRecording}
              >
                Start Recording
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Replay />}
                onClick={() => window.location.reload()}
              >
                Reset
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default PoseAnalysisRecorder;
