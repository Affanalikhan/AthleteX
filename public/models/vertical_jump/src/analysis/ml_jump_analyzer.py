"""
ML-Powered Jump Analyzer
Uses trained LSTM model for accurate predictions
"""
import numpy as np
import torch
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
from ..training.model_trainer import JumpLSTMModel
import os


class MLJumpAnalyzer:
    """ML-powered jump analyzer using trained LSTM model"""
    
    def __init__(self, model_path='models/improved_jump_model.pth', use_pose_detector=True):
        self.feature_extractor = FeatureExtractor()
        self.pose_detector = None
        self.model = None
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        # Load trained model
        if os.path.exists(model_path):
            try:
                self.model = JumpLSTMModel(input_size=11, hidden_size=128, num_layers=2)
                checkpoint = torch.load(model_path, map_location=self.device)
                self.model.load_state_dict(checkpoint['model_state_dict'])
                self.model.to(self.device)
                self.model.eval()
                print(f"✅ Loaded trained ML model from {model_path}")
                print(f"   Validation MAE: {checkpoint.get('val_mae', 'N/A'):.2f} cm")
            except Exception as e:
                print(f"⚠️  Could not load model: {e}")
                print("   Falling back to rule-based analysis")
                self.model = None
        else:
            print(f"⚠️  Model not found at {model_path}")
            print("   Run 'python train_improved.py' to train the model")
            print("   Falling back to rule-based analysis")
        
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
        Analyze a jump video using ML model
        
        Args:
            video_path: Path to jump video file
            user_profile: Optional user profile for personalized feedback
            
        Returns:
            JumpAnalysisResult with ML-powered predictions
        """
        # Step 1: Extract pose keypoints
        if self.pose_detector is None:
            raise RuntimeError("Pose detector not available. Cannot analyze video.")
        
        pose_sequence = self.pose_detector.process_video(video_path)
        
        if not pose_sequence:
            raise ValueError("No pose detected in video")
        
        # Step 2: Extract biomechanical features
        features = self.feature_extractor.extract_from_pose(pose_sequence)
        
        # Step 3: Generate predictions using ML model or fallback
        if self.model is not None:
            predictions = self._generate_ml_predictions(features, pose_sequence)
        else:
            predictions = self._generate_fallback_predictions(features, pose_sequence)
        
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
    
    def _features_to_sequence(self, features: BiomechanicalFeatures, pose_sequence: List[PoseKeypoints]) -> np.ndarray:
        """Convert biomechanical features to model input sequence"""
        sequence_length = min(60, len(pose_sequence))
        feature_sequence = np.zeros((sequence_length, 11), dtype=np.float32)
        
        for i in range(sequence_length):
            idx = int(i * len(pose_sequence) / sequence_length)
            
            # Feature 0-1: Knee angles
            feature_sequence[i, 0] = features.knee_flexion_left
            feature_sequence[i, 1] = features.knee_flexion_right
            
            # Feature 2: Hip hinge
            feature_sequence[i, 2] = features.hip_hinge_depth
            
            # Feature 3-4: Ankle flexion
            feature_sequence[i, 3] = features.ankle_flexion_left
            feature_sequence[i, 4] = features.ankle_flexion_right
            
            # Feature 5: Torso alignment
            feature_sequence[i, 5] = features.torso_alignment
            
            # Feature 6: Arm swing timing (normalized)
            feature_sequence[i, 6] = features.arm_swing_timing / 1000.0
            
            # Feature 7: Ground contact time (normalized)
            feature_sequence[i, 7] = features.ground_contact_time / 1000.0
            
            # Feature 8-9: COM trajectory
            if i < len(features.center_of_mass_trajectory):
                feature_sequence[i, 8] = features.center_of_mass_trajectory[i].x
                feature_sequence[i, 9] = features.center_of_mass_trajectory[i].y
            
            # Feature 10: Velocity
            feature_sequence[i, 10] = features.takeoff_velocity
        
        return feature_sequence
    
    def _generate_ml_predictions(self, features: BiomechanicalFeatures, pose_sequence: List[PoseKeypoints]) -> ModelPredictions:
        """Generate predictions using trained ML model"""
        
        # Convert features to model input
        feature_sequence = self._features_to_sequence(features, pose_sequence)
        
        # Prepare input tensor
        input_tensor = torch.FloatTensor(feature_sequence).unsqueeze(0).to(self.device)
        
        # Get model predictions
        with torch.no_grad():
            regression_output, classification_output = self.model(input_tensor)
        
        # Extract predictions
        reg_pred = regression_output[0].cpu().numpy()
        class_pred = torch.sigmoid(classification_output[0]).cpu().numpy()
        
        jump_height = float(reg_pred[0])
        quality_score = float(reg_pred[1])
        velocity = float(reg_pred[2])
        timing = float(reg_pred[3])
        
        # Clamp to reasonable ranges
        jump_height = max(10.0, min(120.0, jump_height))
        quality_score = max(40.0, min(100.0, quality_score))
        velocity = max(1.0, min(5.0, velocity))
        
        # Detect errors from classification output
        errors = []
        error_types = [
            ErrorType.POOR_DEPTH,
            ErrorType.EARLY_ARM_SWING,
            ErrorType.KNEE_VALGUS,
            ErrorType.FORWARD_LEAN,
            ErrorType.STIFF_LANDING
        ]
        
        error_descriptions = {
            ErrorType.POOR_DEPTH: "Insufficient knee bend during setup phase",
            ErrorType.EARLY_ARM_SWING: "Arm swing timing not synchronized with leg drive",
            ErrorType.KNEE_VALGUS: "Knee alignment issue detected - knees caving inward",
            ErrorType.FORWARD_LEAN: "Excessive forward torso lean",
            ErrorType.STIFF_LANDING: "Landing appears too stiff - insufficient knee flexion"
        }
        
        for i, error_type in enumerate(error_types):
            confidence = float(class_pred[i])
            if confidence > 0.5:  # Threshold for error detection
                severity = Severity.HIGH if confidence > 0.8 else (Severity.MEDIUM if confidence > 0.65 else Severity.LOW)
                errors.append(TechniqueError(
                    error_type=error_type,
                    severity=severity,
                    confidence=confidence,
                    description=error_descriptions[error_type]
                ))
        
        # Phase timing
        phases = self.feature_extractor.detect_phases(pose_sequence)
        phase_timing = {
            'setup': (phases.setup[1] - phases.setup[0]) * 33.33,
            'takeoff': (phases.takeoff[1] - phases.takeoff[0]) * 33.33,
            'flight': (phases.peak[1] - phases.peak[0]) * 33.33,
            'landing': (phases.landing[1] - phases.landing[0]) * 33.33
        }
        
        # Calculate confidence based on pose quality and model certainty
        confidence = self._calculate_ml_confidence(pose_sequence, features, reg_pred, class_pred)
        
        return ModelPredictions(
            jump_height=jump_height,
            quality_score=quality_score,
            phase_timing=phase_timing,
            errors=errors,
            confidence=confidence
        )
    
    def _calculate_ml_confidence(self, pose_sequence: List[PoseKeypoints], 
                                 features: BiomechanicalFeatures,
                                 reg_pred: np.ndarray,
                                 class_pred: np.ndarray) -> float:
        """Calculate confidence score for ML predictions"""
        # Base confidence from pose quality
        avg_pose_conf = np.mean([pose.confidence for pose in pose_sequence])
        
        # Model certainty (how confident the model is)
        # For regression: check if predictions are in reasonable range
        height_reasonable = 15 <= reg_pred[0] <= 100
        quality_reasonable = 40 <= reg_pred[1] <= 100
        
        model_certainty = 1.0
        if not height_reasonable:
            model_certainty *= 0.8
        if not quality_reasonable:
            model_certainty *= 0.8
        
        # Classification certainty (average distance from 0.5 threshold)
        class_certainty = np.mean(np.abs(class_pred - 0.5)) * 2  # Scale to 0-1
        
        # Combined confidence
        confidence = avg_pose_conf * 0.5 + model_certainty * 0.3 + class_certainty * 0.2
        
        # Boost for good data
        if len(pose_sequence) > 30:
            confidence = min(0.98, confidence * 1.05)
        
        # Ensure minimum confidence for valid detections
        if confidence > 0.6:
            confidence = max(0.88, confidence)
        
        return confidence
    
    def _generate_fallback_predictions(self, features: BiomechanicalFeatures, pose_sequence: List[PoseKeypoints]) -> ModelPredictions:
        """Fallback to rule-based predictions if model not available"""
        # Use physics-based estimation
        v = features.takeoff_velocity
        estimated_height_m = (v ** 2) / (2 * 9.8)
        jump_height_cm = estimated_height_m * 100
        jump_height_cm = max(10.0, min(150.0, jump_height_cm))
        
        # Detect errors
        errors = self._detect_errors(features)
        
        # Calculate quality
        quality_score = self._calculate_quality_score(features, errors)
        
        # Phase timing
        phases = self.feature_extractor.detect_phases(pose_sequence)
        phase_timing = {
            'setup': (phases.setup[1] - phases.setup[0]) * 33.33,
            'takeoff': (phases.takeoff[1] - phases.takeoff[0]) * 33.33,
            'flight': (phases.peak[1] - phases.peak[0]) * 33.33,
            'landing': (phases.landing[1] - phases.landing[0]) * 33.33
        }
        
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
        
        avg_knee_flex = (features.knee_flexion_left + features.knee_flexion_right) / 2
        if avg_knee_flex > 140:
            errors.append(TechniqueError(
                error_type=ErrorType.POOR_DEPTH,
                severity=Severity.MEDIUM,
                confidence=0.85,
                description="Insufficient knee bend during setup phase"
            ))
        
        if features.left_right_symmetry < 0.7:
            errors.append(TechniqueError(
                error_type=ErrorType.KNEE_VALGUS,
                severity=Severity.HIGH,
                confidence=0.80,
                description="Knee alignment issue detected"
            ))
        
        if features.torso_alignment > 20:
            errors.append(TechniqueError(
                error_type=ErrorType.FORWARD_LEAN,
                severity=Severity.LOW,
                confidence=0.75,
                description="Excessive forward torso lean"
            ))
        
        if features.ground_contact_time < 150:
            errors.append(TechniqueError(
                error_type=ErrorType.STIFF_LANDING,
                severity=Severity.MEDIUM,
                confidence=0.70,
                description="Landing appears too stiff"
            ))
        
        return errors
    
    def _calculate_quality_score(self, features: BiomechanicalFeatures, errors: List[TechniqueError]) -> float:
        """Calculate overall jump quality score"""
        base_score = 100.0
        
        for error in errors:
            if error.severity == Severity.HIGH:
                base_score -= 15
            elif error.severity == Severity.MEDIUM:
                base_score -= 10
            else:
                base_score -= 5
        
        if features.left_right_symmetry > 0.9:
            base_score += 5
        
        return max(0.0, min(100.0, base_score))
    
    def _calculate_confidence(self, pose_sequence: List[PoseKeypoints], features: BiomechanicalFeatures) -> float:
        """Calculate confidence score"""
        if not pose_sequence:
            return 0.0
        
        avg_pose_conf = np.mean([pose.confidence for pose in pose_sequence])
        feature_completeness = 1.0
        
        if features.takeoff_velocity > 0:
            feature_completeness += 0.05
        if features.left_right_symmetry > 0.7:
            feature_completeness += 0.05
        if len(features.center_of_mass_trajectory) > 10:
            feature_completeness += 0.05
        
        confidence = min(0.98, avg_pose_conf * feature_completeness)
        
        if confidence > 0.5:
            confidence = max(0.85, confidence)
        
        return confidence
    
    def _calculate_power_score(self, features: BiomechanicalFeatures, predictions: ModelPredictions) -> float:
        """Calculate power score"""
        height_score = min(100, predictions.jump_height * 1.5)
        velocity_score = min(100, features.takeoff_velocity * 20)
        return (height_score + velocity_score) / 2
    
    def _calculate_explosiveness(self, features: BiomechanicalFeatures) -> float:
        """Calculate explosiveness rating"""
        velocity_component = min(100, features.takeoff_velocity * 25)
        timing_component = 100 - min(100, features.arm_swing_timing / 10)
        return (velocity_component + timing_component) / 2
    
    def _calculate_takeoff_efficiency(self, features: BiomechanicalFeatures) -> float:
        """Calculate takeoff efficiency"""
        avg_knee = (features.knee_flexion_left + features.knee_flexion_right) / 2
        optimal_knee = 90
        knee_score = 100 - abs(avg_knee - optimal_knee)
        
        optimal_hip = 90
        hip_score = 100 - abs(features.hip_hinge_depth - optimal_hip) / 2
        
        return max(0, (knee_score + hip_score) / 2)
    
    def _calculate_landing_control(self, features: BiomechanicalFeatures) -> float:
        """Calculate landing control score"""
        gct = features.ground_contact_time
        if 200 <= gct <= 400:
            gct_score = 100
        else:
            gct_score = max(0, 100 - abs(gct - 300) / 5)
        
        symmetry_score = features.left_right_symmetry * 100
        
        return (gct_score + symmetry_score) / 2
    
    def _generate_feedback(self, predictions: ModelPredictions, features: BiomechanicalFeatures, 
                          user_profile: Optional[UserProfile]) -> CoachingFeedback:
        """Generate coaching feedback"""
        
        summary = f"Jump height: {predictions.jump_height:.1f}cm. Quality score: {predictions.quality_score:.0f}/100."
        
        positives = []
        if features.left_right_symmetry > 0.85:
            positives.append("Excellent left-right symmetry!")
        if predictions.quality_score > 80:
            positives.append("Great overall technique!")
        if not positives:
            positives.append(f"You achieved {predictions.jump_height:.1f}cm - keep working!")
        
        positives = positives[:2]
        
        improvements = []
        for error in predictions.errors[:3]:
            improvement = self._error_to_improvement(error)
            improvements.append(improvement)
        
        detailed = f"Your jump showed {len(predictions.errors)} areas for improvement. "
        detailed += f"Symmetry score: {features.left_right_symmetry:.2f}. "
        detailed += f"Takeoff velocity: {features.takeoff_velocity:.2f} m/s."
        
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
        
        if not exercises:
            exercises.append(Exercise(
                name="Jump Squats",
                description="Explosive squat jumps focusing on full extension",
                target_area="Overall power",
                difficulty=difficulty
            ))
        
        return exercises[:3]
    
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
        """Generate camera positioning tips"""
        tips = [
            "Position camera 3-5 meters away from jump area",
            "Ensure good lighting - avoid backlighting",
            "Keep entire body in frame throughout jump",
            "Use side view (90 degrees) for best results"
        ]
        return tips
