"""
Core data types for the Vertical Jump Coach system
"""
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from enum import Enum


class ErrorType(Enum):
    POOR_DEPTH = "poor_depth"
    EARLY_ARM_SWING = "early_arm_swing"
    KNEE_VALGUS = "knee_valgus"
    FORWARD_LEAN = "forward_lean"
    STIFF_LANDING = "stiff_landing"


class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TrainingGoal(Enum):
    INCREASE_HEIGHT = "increase_height"
    LANDING_SAFETY = "landing_safety"
    SPEED_REACTIVITY = "speed_reactivity"


class SafetyMode(Enum):
    STANDARD = "standard"
    KNEE_SAFE = "knee_safe"
    REHAB = "rehab"


@dataclass
class Point2D:
    x: float
    y: float


@dataclass
class Point3D:
    x: float
    y: float
    z: float
    confidence: float


@dataclass
class PoseKeypoints:
    frame_number: int
    timestamp: float  # milliseconds
    nose: Point3D
    left_shoulder: Point3D
    right_shoulder: Point3D
    left_elbow: Point3D
    right_elbow: Point3D
    left_wrist: Point3D
    right_wrist: Point3D
    left_hip: Point3D
    right_hip: Point3D
    left_knee: Point3D
    right_knee: Point3D
    left_ankle: Point3D
    right_ankle: Point3D
    confidence: float


@dataclass
class JumpPhases:
    setup: Tuple[int, int]  # (start_frame, end_frame)
    takeoff: Tuple[int, int]
    peak: Tuple[int, int]
    landing: Tuple[int, int]


@dataclass
class BiomechanicalFeatures:
    # Angular measurements (degrees)
    knee_flexion_left: float
    knee_flexion_right: float
    hip_hinge_depth: float
    ankle_flexion_left: float
    ankle_flexion_right: float
    torso_alignment: float
    
    # Temporal measurements (milliseconds)
    arm_swing_timing: float
    ground_contact_time: float
    
    # Kinematic measurements
    center_of_mass_trajectory: List[Point2D]
    takeoff_velocity: float  # m/s
    
    # Symmetry
    left_right_symmetry: float  # 0-1 score


@dataclass
class TechniqueError:
    error_type: ErrorType
    severity: Severity
    confidence: float
    description: str


@dataclass
class ModelPredictions:
    jump_height: float  # cm
    quality_score: float  # 0-100
    phase_timing: Dict[str, float]  # phase name -> duration in ms
    errors: List[TechniqueError]
    confidence: float  # 0-1


@dataclass
class Exercise:
    name: str
    description: str
    target_area: str
    difficulty: str  # beginner, intermediate, advanced


@dataclass
class CoachingFeedback:
    summary: str
    positives: List[str]
    improvements: List[str]
    detailed_explanation: str
    exercise_recommendations: List[Exercise]


@dataclass
class UserProfile:
    user_id: str
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    skill_level: str
    training_goal: TrainingGoal
    safety_mode: SafetyMode


@dataclass
class JumpAnalysisResult:
    predictions: ModelPredictions
    feedback: CoachingFeedback
    jump_height_cm: float
    jump_height_inches: float
    power_score: float
    explosiveness_rating: float
    takeoff_efficiency: float
    landing_control_score: float
    confidence_percentage: int
    confidence_explanation: str
    camera_tips: Optional[List[str]]
