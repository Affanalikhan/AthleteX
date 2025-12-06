import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Videocam,
  Stop,
  PlayArrow,
  Replay,
  Upload,
  VideocamOff
} from '@mui/icons-material';

interface VideoRecorderProps {
  onVideoReady: (videoFile: File) => void;
  onUpload: (videoFile: File) => Promise<void>;
  uploading: boolean;
  maxDuration?: number; // in seconds
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onVideoReady,
  onUpload,
  uploading,
  maxDuration = 60
}) => {
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [stream, previewUrl]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraReady(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startRecording = () => {
    if (!stream) return;

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        // Create file and notify parent
        const file = new File([blob], `assessment_${Date.now()}.webm`, {
          type: 'video/webm'
        });
        onVideoReady(file);

        // Stop camera after recording
        stopCamera();
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Auto-stop recording at max duration
          if (newTime >= maxDuration) {
            stopRecording();
          }
          
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setRecordingTime(0);
    startCamera(); // Restart camera for new recording
  };

  const handleUpload = async () => {
    if (!recordedBlob) return;

    const file = new File([recordedBlob], `assessment_${Date.now()}.webm`, {
      type: 'video/webm'
    });

    try {
      await onUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Video Assessment
        </Typography>
        <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
          🤖 AI will analyze your form after upload
        </Alert>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'relative', mb: 2 }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            maxWidth: '600px',
            height: 'auto',
            backgroundColor: '#000',
            borderRadius: '8px'
          }}
          src={previewUrl || undefined}
          controls={previewUrl ? true : false}
        />

        {recording && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255, 0, 0, 0.8)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                backgroundColor: 'white',
                borderRadius: '50%',
                animation: 'blink 1s infinite'
              }}
            />
            <Typography variant="body2">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {!stream && !previewUrl && (
          <Button
            variant="contained"
            startIcon={<Videocam />}
            onClick={startCamera}
          >
            Start Camera
          </Button>
        )}

        {stream && !recording && !previewUrl && (
          <>
            <Button
              variant="contained"
              color="error"
              startIcon={<Videocam />}
              onClick={startRecording}
              disabled={!cameraReady}
            >
              Start Recording
            </Button>
            <Button
              variant="outlined"
              startIcon={<VideocamOff />}
              onClick={stopCamera}
            >
              Stop Camera
            </Button>
          </>
        )}

        {recording && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Stop />}
            onClick={stopRecording}
          >
            Stop Recording
          </Button>
        )}

        {previewUrl && !uploading && (
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Upload />}
              onClick={handleUpload}
            >
              Upload Video
            </Button>
            <Button
              variant="outlined"
              startIcon={<Replay />}
              onClick={resetRecording}
            >
              Record Again
            </Button>
          </>
        )}

        {uploading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Uploading...</Typography>
          </Box>
        )}
      </Box>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </Paper>
  );
};

export default VideoRecorder;
