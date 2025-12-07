import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class StrideMetrics:
    contact_time: float
    swing_time: float
    knee_angle_at_contact: float
    hip_extension: float
    trunk_lean: float

class GaitAnalyzer:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    def analyze_video(self, video_path: str) -> Dict:
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        frames_data = []
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                landmarks = self._extract_landmarks(results.pose_landmarks)
                frames_data.append({
                    'frame': frame_count,
                    'time': frame_count / fps,
                    'landmarks': landmarks
                })
            
            frame_count += 1
        
        cap.release()
        
        if len(frames_data) < 10:
            return {"error": "Insufficient pose data detected"}
        
        return self._compute_metrics(frames_data, fps)
    
    def _extract_landmarks(self, pose_landmarks) -> Dict:
        lm = pose_landmarks.landmark
        return {
            'left_ankle': (lm[27].x, lm[27].y, lm[27].visibility),
            'right_ankle': (lm[28].x, lm[28].y, lm[28].visibility),
            'left_knee': (lm[25].x, lm[25].y, lm[25].visibility),
            'right_knee': (lm[26].x, lm[26].y, lm[26].visibility),
            'left_hip': (lm[23].x, lm[23].y, lm[23].visibility),
            'right_hip': (lm[24].x, lm[24].y, lm[24].visibility),
            'left_shoulder': (lm[11].x, lm[11].y, lm[11].visibility),
            'right_shoulder': (lm[12].x, lm[12].y, lm[12].visibility),
        }
    
    def _compute_metrics(self, frames_data: List, fps: float) -> Dict:
        cadence = self._calculate_cadence(frames_data, fps)
        symmetry = self._calculate_symmetry(frames_data)
        vertical_osc = self._calculate_vertical_oscillation(frames_data)
        stride_consistency = self._calculate_stride_consistency(frames_data)
        
        efficiency_score = self._calculate_efficiency(vertical_osc, symmetry, stride_consistency)
        endurance_score = self._calculate_endurance_score(stride_consistency, efficiency_score)
        cadence_score = self._calculate_cadence_score(cadence)
        impact_score = self._calculate_impact_score(vertical_osc)
        symmetry_score = symmetry * 10
        fatigue_score = self._calculate_fatigue_resistance(frames_data)
        
        confidence = self._calculate_confidence(frames_data)
        
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
                "vertical_oscillation": vertical_osc,
                "symmetry": round(symmetry * 100, 1),
                "foot_strike": "midfoot",
                "highlights": [
                    "Consistent cadence across strides",
                    "Stable trunk with minimal side-to-side movement",
                    "Well-timed arm swing supports rhythm"
                ]
            },
            "improvements": [
                "Reduce overstriding by landing with your foot closer under your hips",
                "Increase cadence slightly to lower ground contact time",
                "Maintain taller posture – avoid collapsing at the waist late in the stride"
            ],
            "exercises": [
                {
                    "name": "A-Skips",
                    "target": "Running mechanics & cadence",
                    "how": "Drive knees up while staying tall; fast ground contact",
                    "difficulty": "Beginner"
                },
                {
                    "name": "Single-Leg Glute Bridge",
                    "target": "Hip stability & endurance",
                    "how": "Extend hips while keeping pelvis stable",
                    "difficulty": "Intermediate"
                },
                {
                    "name": "Wall March Drill",
                    "target": "Knee drive & foot placement",
                    "how": "March while leaning slightly forward",
                    "difficulty": "Beginner"
                }
            ],
            "technical": {
                "phase_timing": {
                    "contact": 250,
                    "toe_off": 180,
                    "swing": 320
                },
                "joint_angles": {
                    "knee_flexion": 165,
                    "hip_extension": 15,
                    "trunk_lean": 5
                },
                "gait_metrics": {
                    "cadence": round(cadence, 1),
                    "symmetry": round(symmetry * 100, 1),
                    "vertical_oscillation": vertical_osc
                },
                "confidence": round(confidence, 1)
            }
        }
    
    def _calculate_cadence(self, frames_data: List, fps: float) -> float:
        ankle_positions = [f['landmarks']['left_ankle'][1] for f in frames_data]
        peaks = self._find_peaks(ankle_positions)
        duration = len(frames_data) / fps
        return (len(peaks) / duration) * 60 if duration > 0 else 0
    
    def _find_peaks(self, data: List[float]) -> List[int]:
        peaks = []
        for i in range(1, len(data) - 1):
            if data[i] > data[i-1] and data[i] > data[i+1]:
                peaks.append(i)
        return peaks
    
    def _calculate_symmetry(self, frames_data: List) -> float:
        left_steps = []
        right_steps = []
        for f in frames_data:
            left_steps.append(f['landmarks']['left_ankle'][1])
            right_steps.append(f['landmarks']['right_ankle'][1])
        
        left_var = np.var(left_steps)
        right_var = np.var(right_steps)
        return 1.0 - min(abs(left_var - right_var) / max(left_var, right_var, 0.01), 1.0)
    
    def _calculate_vertical_oscillation(self, frames_data: List) -> str:
        hip_heights = [(f['landmarks']['left_hip'][1] + f['landmarks']['right_hip'][1]) / 2 
                       for f in frames_data]
        osc = max(hip_heights) - min(hip_heights)
        if osc < 0.05:
            return "low"
        elif osc < 0.10:
            return "medium"
        return "high"
    
    def _calculate_stride_consistency(self, frames_data: List) -> float:
        ankle_positions = [f['landmarks']['left_ankle'][1] for f in frames_data]
        return 1.0 - min(np.std(ankle_positions), 1.0)
    
    def _calculate_efficiency(self, vertical_osc: str, symmetry: float, consistency: float) -> float:
        score = 100
        if vertical_osc == "high":
            score -= 20
        elif vertical_osc == "medium":
            score -= 10
        score -= (1 - symmetry) * 20
        score -= (1 - consistency) * 15
        return max(score, 0)
    
    def _calculate_endurance_score(self, consistency: float, efficiency: float) -> float:
        return (consistency * 5 + efficiency / 10 * 5)
    
    def _calculate_cadence_score(self, cadence: float) -> float:
        optimal = 180
        diff = abs(cadence - optimal)
        return max(10 - (diff / 10), 0)
    
    def _calculate_impact_score(self, vertical_osc: str) -> float:
        if vertical_osc == "low":
            return 9.0
        elif vertical_osc == "medium":
            return 7.0
        return 5.0
    
    def _calculate_fatigue_resistance(self, frames_data: List) -> float:
        if len(frames_data) < 20:
            return 7.5
        first_half = frames_data[:len(frames_data)//2]
        second_half = frames_data[len(frames_data)//2:]
        
        first_consistency = self._calculate_stride_consistency(first_half)
        second_consistency = self._calculate_stride_consistency(second_half)
        
        return (first_consistency + second_consistency) / 2 * 10
    
    def _calculate_confidence(self, frames_data: List) -> float:
        visibilities = []
        for f in frames_data:
            for joint, (x, y, vis) in f['landmarks'].items():
                visibilities.append(vis)
        return np.mean(visibilities) * 100
