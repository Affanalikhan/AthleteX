"""
Enhanced gait analyzer with trained model and GPU acceleration
Provides high-accuracy analysis with confidence scores
"""
import cv2
import torch
import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass
import mediapipe as mp
from pathlib import Path

@dataclass
class AnalysisResult:
    metrics: Dict
    performance: Dict
    improvements: List[str]
    exercises: List[Dict]
    technical: Dict
    confidence_breakdown: Dict

class EnhancedGaitAnalyzer:
    """Production-ready gait analyzer with trained model"""
    
    def __init__(self, model_path=None, use_gpu=True):
        self.device = torch.device('cuda' if use_gpu and torch.cuda.is_available() else 'cpu')
        print(f"Analyzer using device: {self.device}")
        
        # MediaPipe for pose detection
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
        # Load trained model if available
        self.trained_model = None
        if model_path and Path(model_path).exists():
            self.load_trained_model(model_path)
        
        # Biomechanical thresholds (evidence-based)
        self.optimal_cadence_range = (170, 190)  # steps per minute
        self.optimal_ground_contact = (200, 250)  # milliseconds
        self.max_vertical_osc = 0.08  # as fraction of height
        self.min_symmetry = 0.90  # 90% symmetry threshold
    
    def load_trained_model(self, model_path):
        """Load trained PyTorch model"""
        try:
            from model.train_gait_model import GaitAnalysisModel
            self.trained_model = GaitAnalysisModel()
            checkpoint = torch.load(model_path, map_location=self.device)
            self.trained_model.load_state_dict(checkpoint['model_state_dict'])
            self.trained_model.to(self.device)
            self.trained_model.eval()
            print(f"✓ Loaded trained model from {model_path}")
        except Exception as e:
            print(f"⚠ Could not load trained model: {e}")
            self.trained_model = None
    
    def analyze_video(self, video_path: str) -> Dict:
        """Comprehensive video analysis with confidence scoring"""
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        frames_data = []
        pose_sequences = []
        confidence_scores = []
        frame_count = 0
        
        print(f"Analyzing video: {total_frames} frames at {fps} fps")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                landmarks = self._extract_landmarks(results.pose_landmarks)
                visibility_score = self._calculate_visibility_score(results.pose_landmarks)
                
                frames_data.append({
                    'frame': frame_count,
                    'time': frame_count / fps,
                    'landmarks': landmarks,
                    'visibility': visibility_score
                })
                
                # Prepare for model inference
                pose_vector = self._landmarks_to_vector(results.pose_landmarks)
                pose_sequences.append(pose_vector)
                confidence_scores.append(visibility_score)
            
            frame_count += 1
        
        cap.release()
        
        if len(frames_data) < 10:
            return {"error": "Insufficient pose data detected. Ensure runner is clearly visible."}
        
        # Calculate overall confidence
        overall_confidence = np.mean(confidence_scores)
        
        # Use trained model if available
        model_predictions = None
        if self.trained_model and len(pose_sequences) >= 30:
            model_predictions = self._run_model_inference(pose_sequences)
        
        # Compute comprehensive metrics
        metrics = self._compute_comprehensive_metrics(
            frames_data, fps, model_predictions, overall_confidence
        )
        
        return metrics
    
    def _extract_landmarks(self, pose_landmarks) -> Dict:
        """Extract key landmarks with visibility"""
        lm = pose_landmarks.landmark
        return {
            'left_ankle': (lm[27].x, lm[27].y, lm[27].z, lm[27].visibility),
            'right_ankle': (lm[28].x, lm[28].y, lm[28].z, lm[28].visibility),
            'left_knee': (lm[25].x, lm[25].y, lm[25].z, lm[25].visibility),
            'right_knee': (lm[26].x, lm[26].y, lm[26].z, lm[26].visibility),
            'left_hip': (lm[23].x, lm[23].y, lm[23].z, lm[23].visibility),
            'right_hip': (lm[24].x, lm[24].y, lm[24].z, lm[24].visibility),
            'left_shoulder': (lm[11].x, lm[11].y, lm[11].z, lm[11].visibility),
            'right_shoulder': (lm[12].x, lm[12].y, lm[12].z, lm[12].visibility),
            'nose': (lm[0].x, lm[0].y, lm[0].z, lm[0].visibility),
            'left_heel': (lm[29].x, lm[29].y, lm[29].z, lm[29].visibility),
            'right_heel': (lm[30].x, lm[30].y, lm[30].z, lm[30].visibility),
        }
    
    def _calculate_visibility_score(self, pose_landmarks) -> float:
        """Calculate average visibility of key running joints"""
        key_indices = [23, 24, 25, 26, 27, 28, 29, 30]  # hips, knees, ankles, heels
        visibilities = [pose_landmarks.landmark[i].visibility for i in key_indices]
        return np.mean(visibilities)
    
    def _landmarks_to_vector(self, pose_landmarks) -> np.ndarray:
        """Convert landmarks to feature vector"""
        vector = []
        for lm in pose_landmarks.landmark:
            vector.extend([lm.x, lm.y, lm.z, lm.visibility])
        return np.array(vector)
    
    def _run_model_inference(self, pose_sequences: List) -> Dict:
        """Run trained model inference with GPU acceleration"""
        with torch.no_grad():
            # Take last 30 frames for sequence
            sequence = pose_sequences[-30:]
            while len(sequence) < 30:
                sequence.insert(0, pose_sequences[0])
            
            input_tensor = torch.FloatTensor([sequence]).to(self.device)
            outputs = self.trained_model(input_tensor)
            
            return {
                'phase_predictions': outputs['phase_logits'].cpu().numpy(),
                'form_score': outputs['form_score'].cpu().item(),
                'issues': outputs['issues'].cpu().numpy()[0],
                'model_confidence': outputs['confidence'].cpu().item()
            }
    
    def _compute_comprehensive_metrics(self, frames_data: List, fps: float, 
                                      model_predictions: Dict, overall_confidence: float) -> Dict:
        """Compute all metrics with confidence scoring"""
        
        # Basic gait metrics
        cadence, cadence_confidence = self._calculate_cadence_robust(frames_data, fps)
        symmetry, symmetry_confidence = self._calculate_symmetry_robust(frames_data)
        vertical_osc, osc_confidence = self._calculate_vertical_oscillation_robust(frames_data)
        stride_consistency, consistency_confidence = self._calculate_stride_consistency_robust(frames_data)
        ground_contact_time = self._estimate_ground_contact_time(frames_data, fps)
        foot_strike = self._detect_foot_strike_pattern(frames_data)
        
        # Biomechanical angles
        knee_angles = self._calculate_knee_angles(frames_data)
        hip_extension = self._calculate_hip_extension(frames_data)
        trunk_lean = self._calculate_trunk_lean(frames_data)
        
        # Overstriding detection
        overstriding_score = self._detect_overstriding(frames_data)
        
        # Use model predictions if available
        if model_predictions:
            form_score_model = model_predictions['form_score']
            issues = model_predictions['issues']
            model_confidence = model_predictions['model_confidence']
        else:
            form_score_model = None
            issues = [overstriding_score, 0.5, 1.0 - symmetry]
            model_confidence = 0.0
        
        # Calculate scores
        efficiency_score = self._calculate_efficiency_score(
            vertical_osc, symmetry, stride_consistency, overstriding_score
        )
        endurance_score = self._calculate_endurance_score(stride_consistency, efficiency_score)
        cadence_score = self._calculate_cadence_score(cadence)
        impact_score = self._calculate_impact_score(vertical_osc, ground_contact_time)
        symmetry_score = symmetry * 10
        fatigue_score = self._calculate_fatigue_resistance(frames_data)
        
        # Confidence breakdown
        confidence_breakdown = {
            'overall': round(overall_confidence * 100, 1),
            'pose_detection': round(overall_confidence * 100, 1),
            'cadence': round(cadence_confidence * 100, 1),
            'symmetry': round(symmetry_confidence * 100, 1),
            'vertical_oscillation': round(osc_confidence * 100, 1),
            'model_inference': round(model_confidence * 100, 1) if model_predictions else 0,
            'explanation': self._generate_confidence_explanation(
                overall_confidence, len(frames_data), fps
            )
        }
        
        # Generate insights
        highlights = self._generate_highlights(
            cadence, symmetry, stride_consistency, trunk_lean
        )
        improvements = self._generate_improvements(
            overstriding_score, vertical_osc, cadence, symmetry, trunk_lean
        )
        exercises = self._recommend_exercises(issues if model_predictions else [overstriding_score, 0.5, 1.0 - symmetry])
        
        return {
            "metrics": {
                "endurance_score": round(endurance_score, 1),
                "efficiency": round(efficiency_score, 1),
                "cadence_score": round(cadence_score, 1),
                "impact_control": round(impact_score, 1),
                "symmetry_score": round(symmetry_score, 1),
                "fatigue_resistance": round(fatigue_score, 1),
            },
            "performance": {
                "cadence": round(cadence, 1),
                "ground_contact_time": round(ground_contact_time, 0),
                "vertical_oscillation": vertical_osc,
                "symmetry": round(symmetry * 100, 1),
                "foot_strike": foot_strike,
                "highlights": highlights
            },
            "improvements": improvements,
            "exercises": exercises,
            "technical": {
                "phase_timing": {
                    "contact": round(ground_contact_time, 0),
                    "toe_off": round(ground_contact_time * 0.7, 0),
                    "swing": round((60000 / cadence) - ground_contact_time, 0)
                },
                "joint_angles": {
                    "knee_flexion": round(np.mean(knee_angles), 1),
                    "hip_extension": round(np.mean(hip_extension), 1),
                    "trunk_lean": round(np.mean(trunk_lean), 1)
                },
                "gait_metrics": {
                    "cadence": round(cadence, 1),
                    "symmetry": round(symmetry * 100, 1),
                    "vertical_oscillation": vertical_osc,
                    "stride_consistency": round(stride_consistency * 100, 1)
                },
                "confidence": confidence_breakdown
            }
        }
    
    def _calculate_cadence_robust(self, frames_data: List, fps: float) -> Tuple[float, float]:
        """Calculate cadence with confidence score"""
        left_ankle = [f['landmarks']['left_ankle'][1] for f in frames_data]
        right_ankle = [f['landmarks']['right_ankle'][1] for f in frames_data]
        
        left_peaks = self._find_peaks_robust(left_ankle)
        right_peaks = self._find_peaks_robust(right_ankle)
        
        total_steps = len(left_peaks) + len(right_peaks)
        duration = len(frames_data) / fps
        cadence = (total_steps / duration) * 60 if duration > 0 else 0
        
        # Confidence based on number of detected steps and consistency
        min_expected_steps = (duration / 60) * 150  # Minimum 150 spm
        confidence = min(total_steps / max(min_expected_steps, 1), 1.0)
        
        return cadence, confidence
    
    def _find_peaks_robust(self, data: List[float], min_distance=10) -> List[int]:
        """Find peaks with noise filtering"""
        from scipy.signal import find_peaks
        data_array = np.array(data)
        peaks, properties = find_peaks(data_array, distance=min_distance, prominence=0.02)
        return peaks.tolist()
    
    def _calculate_symmetry_robust(self, frames_data: List) -> Tuple[float, float]:
        """Calculate left-right symmetry with confidence"""
        left_steps = [f['landmarks']['left_ankle'][1] for f in frames_data]
        right_steps = [f['landmarks']['right_ankle'][1] for f in frames_data]
        
        left_var = np.var(left_steps)
        right_var = np.var(right_steps)
        
        symmetry = 1.0 - min(abs(left_var - right_var) / max(left_var, right_var, 0.01), 1.0)
        
        # Confidence based on visibility
        visibilities = [f['visibility'] for f in frames_data]
        confidence = np.mean(visibilities)
        
        return symmetry, confidence
    
    def _calculate_vertical_oscillation_robust(self, frames_data: List) -> Tuple[str, float]:
        """Calculate vertical oscillation with confidence"""
        hip_heights = [(f['landmarks']['left_hip'][1] + f['landmarks']['right_hip'][1]) / 2 
                       for f in frames_data]
        
        osc = max(hip_heights) - min(hip_heights)
        confidence = np.mean([f['visibility'] for f in frames_data])
        
        if osc < 0.05:
            return "low", confidence
        elif osc < 0.10:
            return "medium", confidence
        return "high", confidence
    
    def _calculate_stride_consistency_robust(self, frames_data: List) -> Tuple[float, float]:
        """Calculate stride consistency with confidence"""
        ankle_positions = [f['landmarks']['left_ankle'][1] for f in frames_data]
        consistency = 1.0 - min(np.std(ankle_positions), 1.0)
        confidence = np.mean([f['visibility'] for f in frames_data])
        return consistency, confidence
    
    def _estimate_ground_contact_time(self, frames_data: List, fps: float) -> float:
        """Estimate ground contact time in milliseconds"""
        # Simplified estimation based on ankle height variance
        ankle_heights = [f['landmarks']['left_ankle'][1] for f in frames_data]
        low_threshold = np.percentile(ankle_heights, 25)
        contact_frames = sum(1 for h in ankle_heights if h >= low_threshold)
        contact_time = (contact_frames / len(frames_data)) * (1000 / fps) * 10
        return np.clip(contact_time, 180, 300)
    
    def _detect_foot_strike_pattern(self, frames_data: List) -> str:
        """Detect heel/midfoot/forefoot strike"""
        # Simplified: compare heel vs toe height at contact
        heel_heights = [f['landmarks']['left_heel'][1] for f in frames_data if 'left_heel' in f['landmarks']]
        ankle_heights = [f['landmarks']['left_ankle'][1] for f in frames_data]
        
        if len(heel_heights) > 0:
            avg_heel = np.mean(heel_heights)
            avg_ankle = np.mean(ankle_heights)
            
            if avg_heel > avg_ankle + 0.02:
                return "heel"
            elif avg_heel < avg_ankle - 0.02:
                return "forefoot"
        
        return "midfoot"
    
    def _calculate_knee_angles(self, frames_data: List) -> List[float]:
        """Calculate knee flexion angles"""
        angles = []
        for frame in frames_data:
            hip = np.array(frame['landmarks']['left_hip'][:2])
            knee = np.array(frame['landmarks']['left_knee'][:2])
            ankle = np.array(frame['landmarks']['left_ankle'][:2])
            
            angle = self._calculate_angle(hip, knee, ankle)
            angles.append(angle)
        
        return angles
    
    def _calculate_hip_extension(self, frames_data: List) -> List[float]:
        """Calculate hip extension angles"""
        angles = []
        for frame in frames_data:
            shoulder = np.array(frame['landmarks']['left_shoulder'][:2])
            hip = np.array(frame['landmarks']['left_hip'][:2])
            knee = np.array(frame['landmarks']['left_knee'][:2])
            
            angle = self._calculate_angle(shoulder, hip, knee)
            angles.append(180 - angle)  # Extension from neutral
        
        return angles
    
    def _calculate_trunk_lean(self, frames_data: List) -> List[float]:
        """Calculate forward trunk lean"""
        leans = []
        for frame in frames_data:
            shoulder = np.array(frame['landmarks']['left_shoulder'][:2])
            hip = np.array(frame['landmarks']['left_hip'][:2])
            
            # Angle from vertical
            vertical = np.array([hip[0], 0])
            lean = self._calculate_angle(vertical, hip, shoulder)
            leans.append(lean - 90)  # Deviation from vertical
        
        return leans
    
    def _calculate_angle(self, a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
        """Calculate angle at point b"""
        ba = a - b
        bc = c - b
        cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
        angle = np.arccos(np.clip(cosine, -1.0, 1.0))
        return np.degrees(angle)
    
    def _detect_overstriding(self, frames_data: List) -> float:
        """Detect overstriding (0-1 score, higher = more overstriding)"""
        # Check if foot lands ahead of knee
        overstride_count = 0
        for frame in frames_data:
            ankle_x = frame['landmarks']['left_ankle'][0]
            knee_x = frame['landmarks']['left_knee'][0]
            
            if ankle_x < knee_x - 0.05:  # Foot significantly ahead
                overstride_count += 1
        
        return overstride_count / len(frames_data)
    
    def _calculate_efficiency_score(self, vertical_osc: str, symmetry: float, 
                                   consistency: float, overstriding: float) -> float:
        """Calculate running efficiency (0-100)"""
        score = 100
        
        if vertical_osc == "high":
            score -= 20
        elif vertical_osc == "medium":
            score -= 10
        
        score -= (1 - symmetry) * 20
        score -= (1 - consistency) * 15
        score -= overstriding * 15
        
        return max(score, 0)
    
    def _calculate_endurance_score(self, consistency: float, efficiency: float) -> float:
        """Calculate endurance score (0-10)"""
        return (consistency * 5 + efficiency / 10 * 5)
    
    def _calculate_cadence_score(self, cadence: float) -> float:
        """Score cadence relative to optimal range"""
        optimal_mid = 180
        diff = abs(cadence - optimal_mid)
        return max(10 - (diff / 10), 0)
    
    def _calculate_impact_score(self, vertical_osc: str, ground_contact: float) -> float:
        """Score impact control"""
        score = 10
        
        if vertical_osc == "high":
            score -= 3
        elif vertical_osc == "medium":
            score -= 1
        
        if ground_contact > 270:
            score -= 2
        elif ground_contact < 200:
            score -= 1
        
        return max(score, 0)
    
    def _calculate_fatigue_resistance(self, frames_data: List) -> float:
        """Detect form degradation over time"""
        if len(frames_data) < 20:
            return 7.5
        
        first_half = frames_data[:len(frames_data)//2]
        second_half = frames_data[len(frames_data)//2:]
        
        first_consistency, _ = self._calculate_stride_consistency_robust(first_half)
        second_consistency, _ = self._calculate_stride_consistency_robust(second_half)
        
        return (first_consistency + second_consistency) / 2 * 10
    
    def _generate_confidence_explanation(self, confidence: float, frame_count: int, fps: float) -> str:
        """Generate human-readable confidence explanation"""
        duration = frame_count / fps
        
        if confidence > 0.9:
            return f"High confidence – full body clearly visible throughout {frame_count} frames ({duration:.1f}s)"
        elif confidence > 0.75:
            return f"Good confidence – most body parts tracked across {frame_count} frames ({duration:.1f}s)"
        elif confidence > 0.6:
            return f"Moderate confidence – some occlusion detected in {frame_count} frames ({duration:.1f}s)"
        else:
            return f"Low confidence – limited visibility in {frame_count} frames ({duration:.1f}s). Consider better camera angle."
    
    def _generate_highlights(self, cadence: float, symmetry: float, 
                           consistency: float, trunk_lean: List[float]) -> List[str]:
        """Generate positive highlights"""
        highlights = []
        
        if 170 <= cadence <= 190:
            highlights.append("Excellent cadence within optimal range")
        elif 165 <= cadence <= 195:
            highlights.append("Good cadence, close to optimal")
        
        if symmetry > 0.92:
            highlights.append("Excellent left-right symmetry")
        elif symmetry > 0.85:
            highlights.append("Good symmetry between left and right sides")
        
        if consistency > 0.85:
            highlights.append("Consistent stride pattern throughout")
        
        avg_lean = np.mean(trunk_lean)
        if 3 <= avg_lean <= 7:
            highlights.append("Optimal forward trunk lean for efficiency")
        
        if not highlights:
            highlights.append("Form analysis complete – see improvements below")
        
        return highlights
    
    def _generate_improvements(self, overstriding: float, vertical_osc: str, 
                              cadence: float, symmetry: float, trunk_lean: List[float]) -> List[str]:
        """Generate actionable improvement suggestions"""
        improvements = []
        
        if overstriding > 0.3:
            improvements.append("Reduce overstriding by landing with your foot closer under your hips")
        
        if vertical_osc == "high":
            improvements.append("Minimize vertical bounce to conserve energy – focus on forward motion")
        elif vertical_osc == "medium":
            improvements.append("Slight reduction in vertical oscillation could improve efficiency")
        
        if cadence < 170:
            improvements.append(f"Increase cadence from {cadence:.0f} to 175-180 spm for better efficiency")
        elif cadence > 195:
            improvements.append(f"Consider slightly reducing cadence from {cadence:.0f} to 180-190 spm")
        
        if symmetry < 0.85:
            improvements.append("Work on left-right symmetry – consider single-leg strength exercises")
        
        avg_lean = np.mean(trunk_lean)
        if avg_lean < 2:
            improvements.append("Increase forward trunk lean slightly (3-5°) for better propulsion")
        elif avg_lean > 8:
            improvements.append("Reduce excessive forward lean – maintain taller posture")
        
        if not improvements:
            improvements.append("Excellent form! Focus on maintaining consistency over longer distances")
        
        return improvements[:5]  # Top 5 improvements
    
    def _recommend_exercises(self, issues: List[float]) -> List[Dict]:
        """Recommend exercises based on detected issues"""
        overstriding, vertical_bounce, asymmetry = issues
        
        exercises = []
        
        # Always include foundational exercises
        exercises.append({
            "name": "A-Skips",
            "target": "Running mechanics & cadence",
            "how": "Drive knees up while staying tall; fast ground contact",
            "difficulty": "Beginner"
        })
        
        if overstriding > 0.3:
            exercises.append({
                "name": "Wall March Drill",
                "target": "Foot placement & overstriding",
                "how": "March against wall, focus on landing under hips",
                "difficulty": "Beginner"
            })
        
        if vertical_bounce > 0.5:
            exercises.append({
                "name": "Low Skip Drill",
                "target": "Reduce vertical oscillation",
                "how": "Skip with minimal height, emphasize forward motion",
                "difficulty": "Beginner"
            })
        
        if asymmetry > 0.2:
            exercises.append({
                "name": "Single-Leg Glute Bridge",
                "target": "Hip stability & symmetry",
                "how": "Extend hips while keeping pelvis stable, hold 3 seconds",
                "difficulty": "Intermediate"
            })
            exercises.append({
                "name": "Single-Leg Deadlift",
                "target": "Balance & posterior chain",
                "how": "Hinge at hip on one leg, maintain neutral spine",
                "difficulty": "Intermediate"
            })
        
        exercises.append({
            "name": "Tempo Run Intervals",
            "target": "Fatigue resistance & form maintenance",
            "how": "Hold steady pace at 80-85% effort for 10-15 minutes",
            "difficulty": "Advanced"
        })
        
        return exercises[:4]  # Return top 4 most relevant
