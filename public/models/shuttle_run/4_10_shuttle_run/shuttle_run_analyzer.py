"""
Shuttle Run Analyzer - Complete System in One File
Video-based 4×10m shuttle-run assessment platform

INSTALLATION:
pip install fastapi uvicorn sqlalchemy psycopg2-binary redis celery
pip install opencv-python mediapipe google-cloud-storage hypothesis pytest

RUN:
python shuttle_run_analyzer.py

CELERY WORKER (separate terminal):
celery -A shuttle_run_analyzer:celery_app worker --loglevel=info
"""

import os
import uuid
import json
from dataclasses import dataclass, asdict
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
from enum import Enum

# FastAPI and Web
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings

# Database
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func

# Computer Vision
import cv2
import numpy as np
import mediapipe as mp

# Google Cloud
from google.cloud import storage
from google.cloud.exceptions import GoogleCloudError

# Task Queue
from celery import Celery

# Testing
from hypothesis import given, strategies as st


# ============================================================================
# CONFIGURATION
# ============================================================================

class Settings(BaseSettings):
    """Application settings from environment variables."""
    
    # GCP
    gcp_project_id: str = "shuttle-run-analyzer"
    gcp_region: str = "us-central1"
    gcs_bucket_name: str = "shuttle-run-videos"
    gcs_credentials_path: str = ""
    
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/shuttle_run_db"
    
    # Redis/Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    # Processing
    min_fps: int = 25
    min_resolution_width: int = 1280
    min_resolution_height: int = 720
    touch_distance_threshold_m: float = 0.3
    early_turn_distance_threshold_m: float = 1.5
    lane_deviation_threshold_m: float = 1.0
    calibration_confidence_threshold: float = 0.8
    
    # Security
    secret_key: str = "change-in-production"
    algorithm: str = "HS256"
    
    class Config:
        env_file = ".env"


settings = Settings()


# ============================================================================
# DATABASE MODELS
# ============================================================================

Base = declarative_base()
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Benchmark(Base):
    """Performance benchmarks table."""
    __tablename__ = "benchmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    age_group = Column(String(20), nullable=False, index=True)
    gender = Column(String(10), nullable=False, index=True)
    excellent_max_s = Column(Float, nullable=False)
    good_max_s = Column(Float, nullable=False)
    average_max_s = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AnalysisJob(Base):
    """Analysis job tracking table."""
    __tablename__ = "analysis_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=True, index=True)
    status = Column(String(20), nullable=False, default="pending")
    video_filename = Column(String(255), nullable=False)
    video_gcs_key = Column(String(500), nullable=True)
    athlete_metadata = Column(JSON, nullable=False)
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)


def get_db():
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class AthleteMetadata:
    """Athlete information."""
    age: int
    gender: str
    name: Optional[str] = None
    athlete_id: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None


@dataclass
class PreflightResult:
    """Preflight validation result."""
    valid: bool
    lines_visible: bool
    camera_stable: bool
    athlete_in_frame: bool
    fps: int
    resolution: Tuple[int, int]
    comments: List[str]


@dataclass
class CalibrationResult:
    """Calibration result."""
    px_to_m: float
    confidence: float
    line_a_px: Tuple[float, float]
    line_b_px: Tuple[float, float]
    distance_verified_m: float


@dataclass
class PoseKeypoints:
    """Pose keypoints for one frame."""
    left_ankle: Tuple[float, float, float]
    right_ankle: Tuple[float, float, float]
    left_foot: Tuple[float, float, float]
    right_foot: Tuple[float, float, float]
    left_hip: Tuple[float, float, float]
    right_hip: Tuple[float, float, float]


@dataclass
class TouchEvent:
    """Touch event detection."""
    event_name: str
    time_s: float
    frame_idx: int
    foot: str
    line: str
    distance_to_line_m: float
    confidence: float


@dataclass
class Foul:
    """Foul detection."""
    type: str
    time_s: float
    frame_idx: int
    confidence: float
    explanation: str


@dataclass
class AnalysisResult:
    """Complete analysis result."""
    session_id: str
    athlete: AthleteMetadata
    total_time_s: float
    touches_detected: int
    fouls: List[Foul]
    cheat_detected: bool
    age_group: str
    rating: str
    agility_score: float
    confidence: float
    suggestions: List[Dict[str, str]]


# ============================================================================
# STORAGE CLIENT (GCS)
# ============================================================================

class StorageClient:
    """Google Cloud Storage client."""
    
    def __init__(self):
        if settings.gcs_credentials_path:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.gcs_credentials_path
        self.client = storage.Client(project=settings.gcp_project_id)
        self.bucket = self.client.bucket(settings.gcs_bucket_name)
    
    def upload_file(self, file_path: str, object_key: str) -> bool:
        """Upload file to GCS."""
        try:
            blob = self.bucket.blob(object_key)
            blob.upload_from_filename(file_path)
            return True
        except GoogleCloudError as e:
            print(f"Upload error: {e}")
            return False
    
    def download_file(self, object_key: str, file_path: str) -> bool:
        """Download file from GCS."""
        try:
            blob = self.bucket.blob(object_key)
            blob.download_to_filename(file_path)
            return True
        except GoogleCloudError as e:
            print(f"Download error: {e}")
            return False


storage_client = StorageClient()


# ============================================================================
# UPLOAD & VALIDATION SERVICE
# ============================================================================

class UploadService:
    """Video upload and validation."""
    
    SUPPORTED_FORMATS = ['.mp4', '.mov', '.webm']
    
    @staticmethod
    def validate_format(filename: str) -> bool:
        """Validate video format."""
        ext = os.path.splitext(filename)[1].lower()
        return ext in UploadService.SUPPORTED_FORMATS
    
    @staticmethod
    def run_preflight_checks(video_path: str) -> PreflightResult:
        """Run preflight validation checks."""
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            return PreflightResult(
                valid=False, lines_visible=False, camera_stable=False,
                athlete_in_frame=False, fps=0, resolution=(0, 0),
                comments=["Cannot open video file"]
            )
        
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        comments = []
        valid = True
        
        # Check FPS
        if fps < settings.min_fps:
            comments.append(f"Frame rate {fps} below minimum {settings.min_fps} fps")
            valid = False
        
        # Check resolution
        if width < settings.min_resolution_width or height < settings.min_resolution_height:
            comments.append(f"Resolution {width}x{height} below minimum 720p")
            valid = False
        
        cap.release()
        
        return PreflightResult(
            valid=valid,
            lines_visible=True,  # TODO: Implement line detection
            camera_stable=True,  # TODO: Implement motion detection
            athlete_in_frame=True,  # TODO: Implement person detection
            fps=fps,
            resolution=(width, height),
            comments=comments
        )


# ============================================================================
# CALIBRATION ENGINE
# ============================================================================

class CalibrationEngine:
    """Pixel-to-meter calibration."""
    
    @staticmethod
    def calibrate_from_markers(frames: List[np.ndarray], known_distance_m: float = 10.0) -> CalibrationResult:
        """Calibrate using detected markers."""
        # Simplified: Assume markers at fixed positions
        # TODO: Implement actual line detection using edge detection/YOLO
        
        line_a_px = (100.0, 500.0)  # Placeholder
        line_b_px = (900.0, 500.0)  # Placeholder
        
        pixel_distance = np.sqrt(
            (line_b_px[0] - line_a_px[0])**2 + 
            (line_b_px[1] - line_a_px[1])**2
        )
        
        px_to_m = known_distance_m / pixel_distance if pixel_distance > 0 else 0.01
        confidence = 0.9  # TODO: Compute from variance across frames
        
        return CalibrationResult(
            px_to_m=px_to_m,
            confidence=confidence,
            line_a_px=line_a_px,
            line_b_px=line_b_px,
            distance_verified_m=known_distance_m
        )


# ============================================================================
# VISION PROCESSING PIPELINE
# ============================================================================

class VisionPipeline:
    """Pose detection and tracking."""
    
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    def extract_poses(self, video_path: str) -> List[PoseKeypoints]:
        """Extract pose keypoints from video."""
        cap = cv2.VideoCapture(video_path)
        poses = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(frame_rgb)
            
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                
                # Extract key points
                left_ankle = (landmarks[27].x, landmarks[27].y, landmarks[27].visibility)
                right_ankle = (landmarks[28].x, landmarks[28].y, landmarks[28].visibility)
                left_foot = (landmarks[31].x, landmarks[31].y, landmarks[31].visibility)
                right_foot = (landmarks[32].x, landmarks[32].y, landmarks[32].visibility)
                left_hip = (landmarks[23].x, landmarks[23].y, landmarks[23].visibility)
                right_hip = (landmarks[24].x, landmarks[24].y, landmarks[24].visibility)
                
                pose_kp = PoseKeypoints(
                    left_ankle=left_ankle,
                    right_ankle=right_ankle,
                    left_foot=left_foot,
                    right_foot=right_foot,
                    left_hip=left_hip,
                    right_hip=right_hip
                )
                poses.append(pose_kp)
        
        cap.release()
        return poses
    
    @staticmethod
    def compute_foot_center(pose: PoseKeypoints) -> Tuple[float, float]:
        """Compute foot center as midpoint of feet."""
        left_x, left_y, _ = pose.left_foot
        right_x, right_y, _ = pose.right_foot
        return ((left_x + right_x) / 2, (left_y + right_y) / 2)


# ============================================================================
# EVENT DETECTION ENGINE
# ============================================================================

class EventDetector:
    """Touch event and timing detection."""
    
    @staticmethod
    def detect_touches(
        poses: List[PoseKeypoints],
        calibration: CalibrationResult,
        fps: int
    ) -> List[TouchEvent]:
        """Detect touch events."""
        touches = []
        
        for idx, pose in enumerate(poses):
            foot_center = VisionPipeline.compute_foot_center(pose)
            time_s = idx / fps
            
            # Convert to meters
            foot_center_m = (
                foot_center[0] * calibration.px_to_m,
                foot_center[1] * calibration.px_to_m
            )
            
            # Check distance to lines
            line_a_m = (
                calibration.line_a_px[0] * calibration.px_to_m,
                calibration.line_a_px[1] * calibration.px_to_m
            )
            line_b_m = (
                calibration.line_b_px[0] * calibration.px_to_m,
                calibration.line_b_px[1] * calibration.px_to_m
            )
            
            dist_a = np.sqrt(
                (foot_center_m[0] - line_a_m[0])**2 + 
                (foot_center_m[1] - line_a_m[1])**2
            )
            dist_b = np.sqrt(
                (foot_center_m[0] - line_b_m[0])**2 + 
                (foot_center_m[1] - line_b_m[1])**2
            )
            
            # Detect touch
            if dist_a <= settings.touch_distance_threshold_m:
                touches.append(TouchEvent(
                    event_name="touch_A",
                    time_s=time_s,
                    frame_idx=idx,
                    foot="center",
                    line="A",
                    distance_to_line_m=dist_a,
                    confidence=0.9
                ))
            elif dist_b <= settings.touch_distance_threshold_m:
                touches.append(TouchEvent(
                    event_name="touch_B",
                    time_s=time_s,
                    frame_idx=idx,
                    foot="center",
                    line="B",
                    distance_to_line_m=dist_b,
                    confidence=0.9
                ))
        
        return touches


# ============================================================================
# RULE VALIDATION ENGINE
# ============================================================================

class RuleValidator:
    """Foul and cheat detection."""
    
    @staticmethod
    def detect_fouls(touches: List[TouchEvent], poses: List[PoseKeypoints]) -> List[Foul]:
        """Detect rule violations."""
        fouls = []
        
        # Missing touches
        if len(touches) < 4:
            fouls.append(Foul(
                type="missing_touches",
                time_s=0.0,
                frame_idx=0,
                confidence=1.0,
                explanation=f"Only {len(touches)} touches detected, expected 4"
            ))
        
        # TODO: Implement other foul detections:
        # - Early turns
        # - Lane deviation
        # - Diagonal running
        # - False start
        
        return fouls
    
    @staticmethod
    def detect_cheating(video_path: str) -> Tuple[bool, List[str]]:
        """Detect video manipulation."""
        cheat_detected = False
        cheat_reasons = []
        
        # TODO: Implement cheat detection:
        # - Video editing (frame discontinuities)
        # - Slow motion (frame rate analysis)
        # - Camera manipulation (calibration variance)
        
        return cheat_detected, cheat_reasons


# ============================================================================
# SCORING & RATING ENGINE
# ============================================================================

class ScoringEngine:
    """Performance scoring and rating."""
    
    AGE_GROUPS = {
        (4, 5): "U6", (6, 7): "U8", (8, 9): "U10", (10, 11): "U12",
        (12, 13): "U14", (14, 15): "U16", (16, 17): "U18", (18, 19): "U20",
        (20, 34): "Senior", (35, 44): "Masters-35-44",
        (45, 54): "Masters-45-54", (55, 120): "Masters-55-plus"
    }
    
    @staticmethod
    def get_age_group(age: int) -> str:
        """Map age to age group."""
        for (min_age, max_age), group in ScoringEngine.AGE_GROUPS.items():
            if min_age <= age <= max_age:
                return group
        return "Senior"
    
    @staticmethod
    def get_benchmark(age_group: str, gender: str, db: Session) -> Optional[Benchmark]:
        """Retrieve benchmark from database."""
        return db.query(Benchmark).filter(
            Benchmark.age_group == age_group,
            Benchmark.gender == gender
        ).first()
    
    @staticmethod
    def compute_rating(total_time: float, benchmark: Benchmark) -> str:
        """Compute performance rating."""
        if total_time <= benchmark.excellent_max_s:
            return "Excellent"
        elif total_time <= benchmark.good_max_s:
            return "Good"
        elif total_time <= benchmark.average_max_s:
            return "Average"
        else:
            return "Poor"
    
    @staticmethod
    def compute_agility_score(total_time: float, benchmark: Benchmark) -> float:
        """Compute normalized agility score (0-100)."""
        # Simplified scoring
        time_score = max(0, min(50, 50 * (1 - (total_time - benchmark.excellent_max_s) / 
                                          (benchmark.average_max_s - benchmark.excellent_max_s))))
        return min(100, time_score + 30 + 20)  # Add turn and accel components


# ============================================================================
# SUGGESTION GENERATOR
# ============================================================================

class SuggestionGenerator:
    """Training suggestions."""
    
    @staticmethod
    def generate_suggestions(fouls: List[Foul], total_time: float) -> List[Dict[str, str]]:
        """Generate training recommendations."""
        suggestions = []
        
        # Check for lane deviation
        if any(f.type == "lane_deviation" for f in fouls):
            suggestions.append({
                "type": "lane_control",
                "advice": "Use cone drills to reduce lateral drift; keep body lean low through the turn"
            })
        
        # Check for slow time
        if total_time > 12.0:
            suggestions.append({
                "type": "turn_efficiency",
                "advice": "Practice 180° quick-turn drills; focus on faster decel + re-accel"
            })
        
        return suggestions


# ============================================================================
# CELERY TASKS
# ============================================================================

celery_app = Celery(
    "shuttle_run_analyzer",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend
)


@celery_app.task(bind=True)
def process_video_task(self, session_id: str, video_path: str, athlete_data: dict):
    """Process video through full pipeline."""
    try:
        # 1. Preflight
        preflight = UploadService.run_preflight_checks(video_path)
        if not preflight.valid:
            return {"error": "Preflight failed", "comments": preflight.comments}
        
        # 2. Calibration
        cap = cv2.VideoCapture(video_path)
        frames = []
        for _ in range(10):
            ret, frame = cap.read()
            if ret:
                frames.append(frame)
        cap.release()
        
        calibration = CalibrationEngine.calibrate_from_markers(frames)
        
        # 3. Vision processing
        vision = VisionPipeline()
        poses = vision.extract_poses(video_path)
        
        # 4. Event detection
        touches = EventDetector.detect_touches(poses, calibration, preflight.fps)
        
        # 5. Rule validation
        fouls = RuleValidator.detect_fouls(touches, poses)
        cheat_detected, cheat_reasons = RuleValidator.detect_cheating(video_path)
        
        # 6. Scoring
        athlete = AthleteMetadata(**athlete_data)
        age_group = ScoringEngine.get_age_group(athlete.age)
        
        # Calculate total time
        if len(touches) >= 4:
            total_time = touches[3].time_s - touches[0].time_s
        else:
            total_time = 0.0
        
        # 7. Generate result
        result = {
            "session_id": session_id,
            "athlete": asdict(athlete),
            "total_time_s": round(total_time, 2),
            "touches_detected": len(touches),
            "fouls": [asdict(f) for f in fouls],
            "cheat_detected": cheat_detected,
            "age_group": age_group,
            "rating": "Pending",
            "agility_score": 0.0,
            "confidence": calibration.confidence,
            "suggestions": SuggestionGenerator.generate_suggestions(fouls, total_time)
        }
        
        return result
        
    except Exception as e:
        return {"error": str(e)}


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(title="Shuttle Run Analyzer", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Shuttle Run Analyzer API", "version": "0.1.0"}


@app.post("/api/upload")
async def upload_video(
    video: UploadFile = File(...),
    age: int = 20,
    gender: str = "M",
    db: Session = Depends(get_db)
):
    """Upload video and start analysis."""
    
    # Validate format
    if not UploadService.validate_format(video.filename):
        raise HTTPException(400, "Unsupported video format")
    
    # Generate session ID
    session_id = str(uuid.uuid4())
    
    # Save video temporarily
    temp_path = f"/tmp/{session_id}_{video.filename}"
    with open(temp_path, "wb") as f:
        f.write(await video.read())
    
    # Upload to GCS
    gcs_key = f"videos/{session_id}/{video.filename}"
    storage_client.upload_file(temp_path, gcs_key)
    
    # Create job record
    job = AnalysisJob(
        session_id=session_id,
        video_filename=video.filename,
        video_gcs_key=gcs_key,
        athlete_metadata={"age": age, "gender": gender},
        status="pending"
    )
    db.add(job)
    db.commit()
    
    # Queue processing task
    athlete_data = {"age": age, "gender": gender}
    process_video_task.delay(session_id, temp_path, athlete_data)
    
    return {"session_id": session_id, "status": "queued"}


@app.get("/api/status/{session_id}")
async def get_status(session_id: str, db: Session = Depends(get_db)):
    """Get job status."""
    job = db.query(AnalysisJob).filter(AnalysisJob.session_id == session_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return {"session_id": session_id, "status": job.status}


@app.get("/api/result/{session_id}")
async def get_result(session_id: str, db: Session = Depends(get_db)):
    """Get analysis result."""
    job = db.query(AnalysisJob).filter(AnalysisJob.session_id == session_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.status != "completed":
        raise HTTPException(400, f"Job status: {job.status}")
    return job.result


# ============================================================================
# PROPERTY-BASED TESTS
# ============================================================================

# Property 1: Video format acceptance
@given(st.sampled_from(['.mp4', '.mov', '.webm', '.avi', '.mkv']))
def test_video_format_acceptance(extension: str):
    """Test video format validation."""
    filename = f"test{extension}"
    result = UploadService.validate_format(filename)
    expected = extension in ['.mp4', '.mov', '.webm']
    assert result == expected, f"Format {extension} validation failed"


# Property 9: Foot center midpoint computation
@given(
    st.tuples(st.floats(0, 1), st.floats(0, 1), st.floats(0, 1)),
    st.tuples(st.floats(0, 1), st.floats(0, 1), st.floats(0, 1))
)
def test_foot_center_computation(left_foot: Tuple, right_foot: Tuple):
    """Test foot center is midpoint of feet."""
    pose = PoseKeypoints(
        left_ankle=(0, 0, 1),
        right_ankle=(0, 0, 1),
        left_foot=left_foot,
        right_foot=right_foot,
        left_hip=(0, 0, 1),
        right_hip=(0, 0, 1)
    )
    center = VisionPipeline.compute_foot_center(pose)
    expected_x = (left_foot[0] + right_foot[0]) / 2
    expected_y = (left_foot[1] + right_foot[1]) / 2
    assert abs(center[0] - expected_x) < 0.001
    assert abs(center[1] - expected_y) < 0.001


# Property 23: Age group classification uniqueness
@given(st.integers(min_value=4, max_value=100))
def test_age_group_uniqueness(age: int):
    """Test each age maps to exactly one age group."""
    age_group = ScoringEngine.get_age_group(age)
    assert age_group in [
        "U6", "U8", "U10", "U12", "U14", "U16", "U18", "U20",
        "Senior", "Masters-35-44", "Masters-45-54", "Masters-55-plus"
    ]


# Property 25: Agility score bounds
@given(st.floats(min_value=5.0, max_value=20.0))
def test_agility_score_bounds(total_time: float):
    """Test agility score is in range [0, 100]."""
    benchmark = Benchmark(
        age_group="Senior",
        gender="M",
        excellent_max_s=9.0,
        good_max_s=11.0,
        average_max_s=13.0
    )
    score = ScoringEngine.compute_agility_score(total_time, benchmark)
    assert 0 <= score <= 100, f"Score {score} out of bounds"


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """Initialize database with tables and seed data."""
    Base.metadata.create_all(bind=engine)
    
    # Seed benchmarks
    db = SessionLocal()
    if db.query(Benchmark).count() == 0:
        benchmarks = [
            Benchmark(age_group="U6", gender="M", excellent_max_s=14.0, good_max_s=16.0, average_max_s=18.0),
            Benchmark(age_group="U6", gender="F", excellent_max_s=15.0, good_max_s=17.0, average_max_s=19.0),
            Benchmark(age_group="Senior", gender="M", excellent_max_s=8.5, good_max_s=10.0, average_max_s=12.0),
            Benchmark(age_group="Senior", gender="F", excellent_max_s=9.5, good_max_s=11.0, average_max_s=13.0),
        ]
        db.add_all(benchmarks)
        db.commit()
    db.close()


if __name__ == "__main__":
    import uvicorn
    init_db()
    uvicorn.run(app, host="0.0.0.0", port=8000)
