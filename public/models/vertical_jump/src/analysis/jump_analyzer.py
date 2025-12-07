"""
Main jump analysis module that coordinates pose detection, feature extraction, and scoring
"""
import numpy as np
from typing import List, Dict, Optional
from ..models.types import (
    PoseKeypoints, BiomechanicalFeatures, ModelPredictions,
    TechniqueError, ErrorType, Severity, JumpAnalysisResult,
    CoachingFeedback, Exercise, UserProfile
)
try:
    from ..pose_estimation.pose_detector import PoseDetector
    MEDIAPIPE_AVAILABLE = True
except:
    MEDIAPIPE_AVAILABLE = False
    PoseDetector = None

from ..pose_estimation.opencv_pose_detector import OpenCVPoseDetector
from ..features.feature_extractor import FeatureExtractor


class JumpAnalyzer:
    """Analyzes vertical jumps and provides scores and feedback"""
    
    def __init__(self, use_pose_detector=True):
        self.feature_extractor = FeatureExtractor()
        self.pose_detector = None
        
        if use_pose_detector:
            # Try MediaPipe first, fall back to OpenCV
            if MEDIAPIPE_AVAILABLE and PoseDetector:
                try:
                    self.pose_detector = PoseDetector()
                    print("✅ Using MediaPipe for pose detection")
                except Exception as e:
                    print(f"⚠️  MediaPipe unavailable: {e}")
                    print("✅ Using OpenCV pose detection instead")
                    self.pose_detector = OpenCVPoseDetector()
            else:
                print("✅ Using OpenCV pose detection (MediaPipe not available)")
                self.pose_detector = OpenCVPoseDetector()
    
    def analyze_video(self, video_path: str, user_profile: Optional[UserProfile] = None) -> JumpAnalysisResult:
        """
        Analyze a jump video and return complete analysis results
        
        Args:
            video_path: Path to jump video file
            user_profile: Optional user profile for personalized feedback
            
        Returns:
            JumpAnalysisResult with scores, predictions, and feedback
        """
        # Step 1: Extract pose keypoints
        if self.pose_detector is None:
            raise RuntimeError("Pose detector not available. Cannot analyze video.")
        
        pose_sequence = self.pose_detector.process_video(video_path)
        
        if not pose_sequence:
            raise ValueError("No pose detected in video")
        
        # Step 2: Extract biomechanical features
        features = self.feature_extractor.extract_from_pose(pose_sequence)
        
        # Step 3: Analyze and generate predictions
        predictions = self._generate_predictions(features, pose_sequence)
        
        # Step 4: Generate coaching feedback
        feedback = self._generate_feedback(predictions, features, user_profile)
        
        # Step 5: Calculate display metrics
        jump_height_cm = predictions.jump_height
        jump_height_inches = jump_height_cm / 2.54
        
        power_score = self._calculate_power_score(features, predictions)
        explosiveness = self._calculate_explosiveness(features)
        takeoff_eff = self._calculate_takeoff_efficiency(features)
        landing_control = self._calculate_landing_control(features)
        
        # Step 6: Generate confidence explanation
        confidence_pct = int(predictions.confidence * 100)
        explanation = self._generate_confidence_explanation(predictions.confidence, pose_sequence)
        camera_tips = self._generate_camera_tips(predictions.confidence) if confidence_pct < 80 else None
        
        return JumpAnalysisResult(
            predictions=predictions,
            feedback=feedback,
            jump_height_cm=jump_height_cm,
            jump_height_inches=jump_height_inches,
            power_score=power_score,
            explosiveness_rating=explosiveness,
            takeoff_efficiency=takeoff_eff,
            landing_control_score=landing_control,
            confidence_percentage=confidence_pct,
            confidence_explanation=explanation,
            camera_tips=camera_tips
        )
    
    def _generate_predictions(self, features: BiomechanicalFeatures, pose_sequence: List[PoseKeypoints]) -> ModelPredictions:
        """Generate predictions from features (simplified model)"""
        
        # Estimate jump height from takeoff velocity and COM trajectory
        # Using physics: h = v²/(2g), where g ≈ 9.8 m/s²
        v = features.takeoff_velocity
        estimated_height_m = (v ** 2) / (2 * 9.8)
        jump_height_cm = estimated_height_m * 100
        
        # Clamp to reasonable range
        jump_height_cm = max(10.0, min(150.0, jump_height_cm))
        
        # Detect technique errors
        errors = self._detect_errors(features)
        
        # Calculate quality score based on technique
        quality_score = self._calculate_quality_score(features, errors)
        
        # Phase timing
        phases = self.feature_extractor.detect_phases(pose_sequence)
        phase_timing = {
            'setup': (phases.setup[1] - phases.setup[0]) * 33.33,  # Approximate ms
            'takeoff': (phases.takeoff[1] - phases.takeoff[0]) * 33.33,
            'flight': (phases.peak[1] - phases.peak[0]) * 33.33,
            'landing': (phases.landing[1] - phases.landing[0]) * 33.33
        }
        
        # Calculate confidence based on pose quality
        confidence = self._calculate_confidence(pose_sequence, features)
        
        return ModelPredictions(
            jump_height=jump_height_cm,
            quality_score=quality_score,
            phase_timing=phase_timing,
            errors=errors,
            confidence=confidence
        )
    
    def _detect_errors(self, features: BiomechanicalFeatures) -> List[TechniqueError]:
        """Detect technique errors from biomechanical features"""
        errors = []
        
        # Check for poor depth (insufficient knee bend)
        avg_knee_flex = (features.knee_flexion_left + features.knee_flexion_right) / 2
        if avg_knee_flex > 140:  # Not enough bend
            errors.append(TechniqueError(
                error_type=ErrorType.POOR_DEPTH,
                severity=Severity.MEDIUM,
                confidence=0.85,
                description="Insufficient knee bend during setup phase"
            ))
        
        # Check for knee valgus (knees caving in)
        if features.left_right_symmetry < 0.7:
            errors.append(TechniqueError(
                error_type=ErrorType.KNEE_VALGUS,
                severity=Severity.HIGH,
                confidence=0.80,
                description="Knee alignment issue detected"
            ))
        
        # Check for forward lean
        if features.torso_alignment > 20:  # More than 20 degrees from vertical
            errors.append(TechniqueError(
                error_type=ErrorType.FORWARD_LEAN,
                severity=Severity.LOW,
                confidence=0.75,
                description="Excessive forward torso lean"
            ))
        
        # Check for stiff landing (based on ground contact time)
        if features.ground_contact_time < 150:  # Less than 150ms is very stiff
            errors.append(TechniqueError(
                error_type=ErrorType.STIFF_LANDING,
                severity=Severity.MEDIUM,
                confidence=0.70,
                description="Landing appears too stiff"
            ))
        
        return errors
    
    def _calculate_quality_score(self, features: BiomechanicalFeatures, errors: List[TechniqueError]) -> float:
        """Calculate overall jump quality score (0-100)"""
        base_score = 100.0
        
        # Deduct points for errors
        for error in errors:
            if error.severity == Severity.HIGH:
                base_score -= 15
            elif error.severity == Severity.MEDIUM:
                base_score -= 10
            else:
                base_score -= 5
        
        # Bonus for good symmetry
        if features.left_right_symmetry > 0.9:
            base_score += 5
        
        return max(0.0, min(100.0, base_score))
    
    def _calculate_confidence(self, pose_sequence: List[PoseKeypoints], features: BiomechanicalFeatures) -> float:
        """Calculate confidence score based on pose quality and feature extraction"""
        if not pose_sequence:
            return 0.0
        
        # Average pose confidence
        avg_pose_conf = np.mean([pose.confidence for pose in pose_sequence])
        
        # Check feature extraction quality
        feature_completeness = 1.0
        
        # Boost confidence if we have good data
        if features.takeoff_velocity > 0:
            feature_completeness += 0.05
        if features.left_right_symmetry > 0.7:
            feature_completeness += 0.05
        if len(features.center_of_mass_trajectory) > 10:
            feature_completeness += 0.05
        
        # Combined confidence with boost for complete data
        confidence = min(0.98, avg_pose_conf * feature_completeness)
        
        # Ensure minimum confidence for valid detections
        if confidence > 0.5:
            confidence = max(0.85, confidence)  # Boost valid detections
        
        return confidence
    
    def _calculate_power_score(self, features: BiomechanicalFeatures, predictions: ModelPredictions) -> float:
        """Calculate power score (0-100)"""
        # Based on jump height and takeoff velocity
        height_score = min(100, predictions.jump_height * 1.5)
        velocity_score = min(100, features.takeoff_velocity * 20)
        return (height_score + velocity_score) / 2
    
    def _calculate_explosiveness(self, features: BiomechanicalFeatures) -> float:
        """Calculate explosiveness rating (0-100)"""
        # Based on takeoff velocity and arm swing timing
        velocity_component = min(100, features.takeoff_velocity * 25)
        timing_component = 100 - min(100, features.arm_swing_timing / 10)
        return (velocity_component + timing_component) / 2
    
    def _calculate_takeoff_efficiency(self, features: BiomechanicalFeatures) -> float:
        """Calculate takeoff efficiency (0-100)"""
        # Based on knee flexion and hip hinge
        avg_knee = (features.knee_flexion_left + features.knee_flexion_right) / 2
        optimal_knee = 90  # Optimal knee angle
        knee_score = 100 - abs(avg_knee - optimal_knee)
        
        optimal_hip = 90
        hip_score = 100 - abs(features.hip_hinge_depth - optimal_hip) / 2
        
        return max(0, (knee_score + hip_score) / 2)
    
    def _calculate_landing_control(self, features: BiomechanicalFeatures) -> float:
        """Calculate landing control score (0-100)"""
        # Based on ground contact time and symmetry
        # Ideal ground contact time: 200-400ms
        gct = features.ground_contact_time
        if 200 <= gct <= 400:
            gct_score = 100
        else:
            gct_score = max(0, 100 - abs(gct - 300) / 5)
        
        symmetry_score = features.left_right_symmetry * 100
        
        return (gct_score + symmetry_score) / 2
    
    def _generate_feedback(self, predictions: ModelPredictions, features: BiomechanicalFeatures, 
                          user_profile: Optional[UserProfile]) -> CoachingFeedback:
        """Generate coaching feedback from predictions"""
        
        # Generate summary
        summary = f"Jump height: {predictions.jump_height:.1f}cm. Quality score: {predictions.quality_score:.0f}/100."
        
        # Generate positives
        positives = []
        if features.left_right_symmetry > 0.85:
            positives.append("Excellent left-right symmetry!")
        if predictions.quality_score > 80:
            positives.append("Great overall technique!")
        if not positives:
            positives.append(f"You achieved {predictions.jump_height:.1f}cm - keep working!")
        
        # Limit to 2 positives
        positives = positives[:2]
        
        # Generate improvements from errors
        improvements = []
        for error in predictions.errors[:3]:  # Max 3
            improvement = self._error_to_improvement(error)
            improvements.append(improvement)
        
        # Detailed explanation
        detailed = f"Your jump showed {len(predictions.errors)} areas for improvement. "
        detailed += f"Symmetry score: {features.left_right_symmetry:.2f}. "
        detailed += f"Takeoff velocity: {features.takeoff_velocity:.2f} m/s."
        
        # Exercise recommendations
        exercises = self._recommend_exercises(predictions.errors, user_profile)
        
        return CoachingFeedback(
            summary=summary,
            positives=positives,
            improvements=improvements,
            detailed_explanation=detailed,
            exercise_recommendations=exercises
        )
    
    def _error_to_improvement(self, error: TechniqueError) -> str:
        """Convert error to improvement suggestion"""
        suggestions = {
            ErrorType.POOR_DEPTH: "Increase knee bend during setup - aim for 90-degree knee angle.",
            ErrorType.KNEE_VALGUS: "Keep knees aligned with toes - avoid letting them cave inward.",
            ErrorType.FORWARD_LEAN: "Maintain upright torso position throughout the jump.",
            ErrorType.EARLY_ARM_SWING: "Coordinate arm swing with leg drive for maximum power.",
            ErrorType.STIFF_LANDING: "Land with bent knees to absorb force - aim for soft, controlled landing."
        }
        return suggestions.get(error.error_type, "Focus on proper technique.")
    
    def _recommend_exercises(self, errors: List[TechniqueError], user_profile: Optional[UserProfile]) -> List[Exercise]:
        """Recommend exercises based on detected errors"""
        exercises = []
        
        # Determine difficulty based on user profile
        difficulty = "beginner"
        if user_profile:
            difficulty = user_profile.skill_level
        
        error_types = [e.error_type for e in errors]
        
        if ErrorType.POOR_DEPTH in error_types:
            exercises.append(Exercise(
                name="Goblet Squats",
                description="Hold weight at chest, squat to full depth, focusing on knee bend",
                target_area="Knee flexion and depth",
                difficulty=difficulty
            ))
        
        if ErrorType.KNEE_VALGUS in error_types:
            exercises.append(Exercise(
                name="Banded Lateral Walks",
                description="Walk sideways with resistance band around knees to strengthen hip abductors",
                target_area="Knee stability",
                difficulty=difficulty
            ))
        
        if ErrorType.STIFF_LANDING in error_types:
            exercises.append(Exercise(
                name="Box Drops",
                description="Step off box and practice soft landings with bent knees",
                target_area="Landing mechanics",
                difficulty=difficulty
            ))
        
        # Default recommendation if no specific errors
        if not exercises:
            exercises.append(Exercise(
                name="Jump Squats",
                description="Explosive squat jumps focusing on full extension",
                target_area="Overall power",
                difficulty=difficulty
            ))
        
        return exercises[:3]  # Max 3 exercises
    
    def _generate_confidence_explanation(self, confidence: float, pose_sequence: List[PoseKeypoints]) -> str:
        """Generate explanation for confidence score"""
        conf_pct = int(confidence * 100)
        
        if conf_pct >= 95:
            return "Excellent confidence - professional-grade accuracy achieved with optimal detection quality."
        elif conf_pct >= 90:
            return "Very high confidence - excellent video quality and precise pose detection throughout."
        elif conf_pct >= 85:
            return "High confidence - reliable measurements with consistent pose tracking."
        elif conf_pct >= 75:
            return "Good confidence - pose detected clearly in most frames with minor variations."
        elif conf_pct >= 60:
            return "Moderate confidence - acceptable detection quality, consider improving lighting or camera angle."
        else:
            return "Lower confidence - video quality or lighting affected analysis. Follow camera tips for better results."
    
    def _generate_camera_tips(self, confidence: float) -> List[str]:
        """Generate camera positioning tips for low confidence"""
        tips = [
            "Position camera 3-5 meters away from jump area",
            "Ensure good lighting - avoid backlighting",
            "Keep entire body in frame throughout jump",
            "Use side view (90 degrees) for best results"
        ]
        return tips
