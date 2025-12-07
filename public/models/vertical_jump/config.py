"""
Configuration settings for Vertical Jump Coach
"""
from dataclasses import dataclass
from typing import Dict


@dataclass
class AnalysisConfig:
    """Configuration for jump analysis"""
    
    # Pose detection settings
    pose_detection_confidence: float = 0.5
    pose_tracking_confidence: float = 0.5
    pose_model_complexity: int = 2  # 0, 1, or 2 (higher = more accurate but slower)
    
    # Feature extraction thresholds
    min_knee_angle_good: float = 90.0  # Optimal knee bend
    max_knee_angle_poor: float = 140.0  # Insufficient bend threshold
    max_torso_lean: float = 20.0  # Degrees from vertical
    min_symmetry_good: float = 0.85  # Good left-right symmetry
    min_symmetry_acceptable: float = 0.70  # Acceptable symmetry
    
    # Landing thresholds
    min_ground_contact_time: float = 150.0  # ms - too stiff
    optimal_ground_contact_min: float = 200.0  # ms
    optimal_ground_contact_max: float = 400.0  # ms
    
    # Confidence scoring
    min_confidence_for_tips: float = 0.80  # Show camera tips below this
    min_pose_confidence: float = 0.50  # Minimum acceptable pose confidence
    
    # Feedback limits
    max_corrections: int = 3
    max_positives: int = 2
    max_exercises: int = 3
    
    # Video constraints
    min_video_duration: float = 1.0  # seconds
    max_video_duration: float = 5.0  # seconds
    expected_fps: float = 30.0


@dataclass
class SafetyModeConfig:
    """Configuration for different safety modes"""
    
    # Standard mode
    standard: Dict[str, any] = None
    
    # Knee-safe mode (prioritize joint protection)
    knee_safe: Dict[str, any] = None
    
    # Rehab mode (conservative recommendations)
    rehab: Dict[str, any] = None
    
    def __post_init__(self):
        self.standard = {
            "max_recommended_height": 100.0,  # cm
            "allow_plyometrics": True,
            "focus": "performance"
        }
        
        self.knee_safe = {
            "max_recommended_height": 60.0,  # cm
            "allow_plyometrics": False,
            "focus": "joint_protection",
            "extra_warnings": True
        }
        
        self.rehab = {
            "max_recommended_height": 40.0,  # cm
            "allow_plyometrics": False,
            "focus": "safe_progression",
            "extra_warnings": True,
            "require_clearance": True
        }


@dataclass
class ExerciseDatabase:
    """Exercise recommendations database"""
    
    # Exercises for poor depth
    depth_exercises = [
        {
            "name": "Goblet Squats",
            "description": "Hold weight at chest, squat to full depth, focusing on knee bend",
            "target": "Knee flexion and depth",
            "difficulty": {"beginner": "5kg", "intermediate": "10kg", "advanced": "20kg"}
        },
        {
            "name": "Box Squats",
            "description": "Squat down to box, pause, then explode up",
            "target": "Depth control",
            "difficulty": {"beginner": "bodyweight", "intermediate": "light weight", "advanced": "heavy weight"}
        }
    ]
    
    # Exercises for knee valgus
    knee_stability_exercises = [
        {
            "name": "Banded Lateral Walks",
            "description": "Walk sideways with resistance band around knees",
            "target": "Hip abductors and knee stability",
            "difficulty": {"beginner": "light band", "intermediate": "medium band", "advanced": "heavy band"}
        },
        {
            "name": "Single-Leg Balance",
            "description": "Stand on one leg, maintain knee alignment",
            "target": "Knee control",
            "difficulty": {"beginner": "30 sec", "intermediate": "60 sec", "advanced": "90 sec + perturbations"}
        }
    ]
    
    # Exercises for landing
    landing_exercises = [
        {
            "name": "Box Drops",
            "description": "Step off box and practice soft landings",
            "target": "Landing mechanics",
            "difficulty": {"beginner": "12 inch", "intermediate": "18 inch", "advanced": "24 inch"}
        },
        {
            "name": "Depth Jumps",
            "description": "Drop from box and immediately jump up",
            "target": "Reactive strength",
            "difficulty": {"beginner": "12 inch", "intermediate": "18 inch", "advanced": "24+ inch"}
        }
    ]
    
    # General power exercises
    power_exercises = [
        {
            "name": "Jump Squats",
            "description": "Explosive squat jumps focusing on full extension",
            "target": "Overall power",
            "difficulty": {"beginner": "bodyweight", "intermediate": "light weight", "advanced": "weighted vest"}
        },
        {
            "name": "Broad Jumps",
            "description": "Jump forward for maximum distance",
            "target": "Horizontal power",
            "difficulty": {"beginner": "3 reps", "intermediate": "5 reps", "advanced": "8 reps"}
        }
    ]


# Default configuration instance
DEFAULT_CONFIG = AnalysisConfig()
SAFETY_MODES = SafetyModeConfig()
EXERCISE_DB = ExerciseDatabase()


# Benchmark data (example values)
AGE_GROUP_BENCHMARKS = {
    "15-18": {"average": 45, "top10": 65, "elite": 75},
    "19-25": {"average": 50, "top10": 70, "elite": 80},
    "26-35": {"average": 45, "top10": 65, "elite": 75},
    "36-45": {"average": 40, "top10": 60, "elite": 70},
    "46+": {"average": 35, "top10": 55, "elite": 65}
}


SPORT_BENCHMARKS = {
    "basketball": {"average": 60, "elite": 85},
    "volleyball": {"average": 65, "elite": 90},
    "football": {"average": 55, "elite": 75},
    "soccer": {"average": 50, "elite": 70},
    "general": {"average": 45, "elite": 70}
}


def get_age_group(age: int) -> str:
    """Get age group category"""
    if age < 19:
        return "15-18"
    elif age < 26:
        return "19-25"
    elif age < 36:
        return "26-35"
    elif age < 46:
        return "36-45"
    else:
        return "46+"


def get_benchmark(age: int, sport: str = "general") -> Dict[str, float]:
    """Get benchmark values for age and sport"""
    age_group = get_age_group(age)
    age_bench = AGE_GROUP_BENCHMARKS.get(age_group, AGE_GROUP_BENCHMARKS["19-25"])
    sport_bench = SPORT_BENCHMARKS.get(sport.lower(), SPORT_BENCHMARKS["general"])
    
    return {
        "age_average": age_bench["average"],
        "age_top10": age_bench["top10"],
        "age_elite": age_bench["elite"],
        "sport_average": sport_bench["average"],
        "sport_elite": sport_bench["elite"]
    }
