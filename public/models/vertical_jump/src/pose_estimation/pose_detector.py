"""
Pose estimation module using MediaPipe
"""
import cv2
import numpy as np
from typing import List, Optional
from ..models.types import PoseKeypoints, Point3D

# Import MediaPipe with error handling
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: MediaPipe import failed: {e}")
    MEDIAPIPE_AVAILABLE = False
    mp = None


class PoseDetector:
    """Detects human pose keypoints from video frames using MediaPipe"""
    
    def __init__(self):
        if not MEDIAPIPE_AVAILABLE or mp is None:
            raise RuntimeError("MediaPipe is not available. Please install it with: pip install mediapipe")
        
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def process_video(self, video_path: str) -> List[PoseKeypoints]:
        """
        Process a video file and extract pose keypoints for each frame
        
        Args:
            video_path: Path to the video file
            
        Returns:
            List of PoseKeypoints for each frame
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video file: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_time_ms = 1000.0 / fps if fps > 0 else 33.33  # Default to ~30fps
        
        pose_sequence = []
        frame_number = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                keypoints = self._extract_keypoints(
                    results.pose_landmarks,
                    frame_number,
                    frame_number * frame_time_ms
                )
                pose_sequence.append(keypoints)
            
            frame_number += 1
        
        cap.release()
        return pose_sequence
    
    def process_frame(self, frame: np.ndarray, frame_number: int = 0, timestamp: float = 0.0) -> Optional[PoseKeypoints]:
        """
        Process a single frame and extract pose keypoints
        
        Args:
            frame: Image frame (BGR format)
            frame_number: Frame index
            timestamp: Timestamp in milliseconds
            
        Returns:
            PoseKeypoints if pose detected, None otherwise
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)
        
        if results.pose_landmarks:
            return self._extract_keypoints(results.pose_landmarks, frame_number, timestamp)
        return None
    
    def _extract_keypoints(self, landmarks, frame_number: int, timestamp: float) -> PoseKeypoints:
        """Extract keypoints from MediaPipe landmarks"""
        
        def get_point(idx: int) -> Point3D:
            lm = landmarks.landmark[idx]
            return Point3D(
                x=lm.x,
                y=lm.y,
                z=lm.z,
                confidence=lm.visibility
            )
        
        # MediaPipe pose landmark indices
        return PoseKeypoints(
            frame_number=frame_number,
            timestamp=timestamp,
            nose=get_point(0),
            left_shoulder=get_point(11),
            right_shoulder=get_point(12),
            left_elbow=get_point(13),
            right_elbow=get_point(14),
            left_wrist=get_point(15),
            right_wrist=get_point(16),
            left_hip=get_point(23),
            right_hip=get_point(24),
            left_knee=get_point(25),
            right_knee=get_point(26),
            left_ankle=get_point(27),
            right_ankle=get_point(28),
            confidence=np.mean([lm.visibility for lm in landmarks.landmark])
        )
    
    def get_confidence(self) -> float:
        """Get overall confidence of last detection"""
        return 0.85  # Placeholder
    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'pose'):
            self.pose.close()
