"""
Feature extraction module for biomechanical analysis
"""
import numpy as np
import math
from typing import List, Tuple, Optional
from ..models.types import PoseKeypoints, BiomechanicalFeatures, JumpPhases, Point2D, Point3D


class FeatureExtractor:
    """Extracts biomechanical features from pose keypoint sequences"""
    
    def extract_from_pose(self, pose_sequence: List[PoseKeypoints]) -> BiomechanicalFeatures:
        """
        Extract all biomechanical features from a pose sequence
        
        Args:
            pose_sequence: List of pose keypoints over time
            
        Returns:
            BiomechanicalFeatures containing all measurements
        """
        if not pose_sequence:
            raise ValueError("Empty pose sequence")
        
        # Detect jump phases first
        phases = self.detect_phases(pose_sequence)
        
        # Extract features at key moments
        setup_frame = pose_sequence[phases.setup[0]]
        takeoff_frame = pose_sequence[phases.takeoff[1]]
        peak_frame = pose_sequence[phases.peak[0]]
        landing_frame = pose_sequence[phases.landing[0]]
        
        # Angular measurements at setup (deepest crouch)
        knee_flex_left = self.calculate_knee_angle(setup_frame, 'left')
        knee_flex_right = self.calculate_knee_angle(setup_frame, 'right')
        hip_depth = self.calculate_hip_angle(setup_frame)
        ankle_left = self.calculate_ankle_angle(setup_frame, 'left')
        ankle_right = self.calculate_ankle_angle(setup_frame, 'right')
        torso_align = self.calculate_torso_alignment(setup_frame)
        
        # Temporal measurements
        arm_timing = self._calculate_arm_swing_timing(pose_sequence, phases)
        ground_time = self._calculate_ground_contact_time(pose_sequence, phases)
        
        # Kinematic measurements
        com_trajectory = self._calculate_com_trajectory(pose_sequence)
        takeoff_vel = self._calculate_takeoff_velocity(pose_sequence, phases)
        
        # Symmetry
        symmetry = self._calculate_symmetry(pose_sequence)
        
        return BiomechanicalFeatures(
            knee_flexion_left=knee_flex_left,
            knee_flexion_right=knee_flex_right,
            hip_hinge_depth=hip_depth,
            ankle_flexion_left=ankle_left,
            ankle_flexion_right=ankle_right,
            torso_alignment=torso_align,
            arm_swing_timing=arm_timing,
            ground_contact_time=ground_time,
            center_of_mass_trajectory=com_trajectory,
            takeoff_velocity=takeoff_vel,
            left_right_symmetry=symmetry
        )
    
    def calculate_angle(self, p1: Point3D, p2: Point3D, p3: Point3D) -> float:
        """
        Calculate angle between three points (p1-p2-p3)
        
        Returns angle in degrees
        """
        # Create vectors
        v1 = np.array([p1.x - p2.x, p1.y - p2.y])
        v2 = np.array([p3.x - p2.x, p3.y - p2.y])
        
        # Calculate angle
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        angle = np.arccos(cos_angle)
        
        return math.degrees(angle)
    
    def calculate_knee_angle(self, pose: PoseKeypoints, side: str) -> float:
        """Calculate knee flexion angle"""
        if side == 'left':
            return self.calculate_angle(pose.left_hip, pose.left_knee, pose.left_ankle)
        else:
            return self.calculate_angle(pose.right_hip, pose.right_knee, pose.right_ankle)
    
    def calculate_hip_angle(self, pose: PoseKeypoints) -> float:
        """Calculate hip hinge depth (average of both sides)"""
        left_hip_angle = self.calculate_angle(pose.left_shoulder, pose.left_hip, pose.left_knee)
        right_hip_angle = self.calculate_angle(pose.right_shoulder, pose.right_hip, pose.right_knee)
        return (left_hip_angle + right_hip_angle) / 2.0
    
    def calculate_ankle_angle(self, pose: PoseKeypoints, side: str) -> float:
        """Calculate ankle plantar flexion"""
        # Simplified: use knee-ankle-toe angle (toe approximated from ankle position)
        if side == 'left':
            knee, ankle = pose.left_knee, pose.left_ankle
        else:
            knee, ankle = pose.right_knee, pose.right_ankle
        
        # Create virtual toe point below ankle
        toe = Point3D(ankle.x, ankle.y + 0.1, ankle.z, ankle.confidence)
        return self.calculate_angle(knee, ankle, toe)
    
    def calculate_torso_alignment(self, pose: PoseKeypoints) -> float:
        """Calculate torso angle from vertical (0 = perfectly vertical)"""
        # Use shoulder to hip vector
        shoulder_center_x = (pose.left_shoulder.x + pose.right_shoulder.x) / 2
        shoulder_center_y = (pose.left_shoulder.y + pose.right_shoulder.y) / 2
        hip_center_x = (pose.left_hip.x + pose.right_hip.x) / 2
        hip_center_y = (pose.left_hip.y + pose.right_hip.y) / 2
        
        # Calculate angle from vertical
        dx = shoulder_center_x - hip_center_x
        dy = shoulder_center_y - hip_center_y
        
        angle_from_horizontal = math.degrees(math.atan2(abs(dx), abs(dy)))
        return angle_from_horizontal
    
    def compute_center_of_mass(self, pose: PoseKeypoints) -> Point2D:
        """Compute approximate center of mass"""
        # Simplified: average of hip positions
        com_x = (pose.left_hip.x + pose.right_hip.x) / 2
        com_y = (pose.left_hip.y + pose.right_hip.y) / 2
        return Point2D(com_x, com_y)
    
    def detect_phases(self, pose_sequence: List[PoseKeypoints]) -> JumpPhases:
        """
        Detect jump phases from pose sequence
        
        Returns frame ranges for each phase
        """
        if len(pose_sequence) < 10:
            # Too short, return simple split
            n = len(pose_sequence)
            return JumpPhases(
                setup=(0, n // 4),
                takeoff=(n // 4, n // 2),
                peak=(n // 2, 3 * n // 4),
                landing=(3 * n // 4, n - 1)
            )
        
        # Calculate COM height over time
        com_heights = []
        for pose in pose_sequence:
            com = self.compute_center_of_mass(pose)
            com_heights.append(com.y)
        
        com_heights = np.array(com_heights)
        
        # Find peak (lowest y value, since y increases downward in image coords)
        peak_frame = np.argmin(com_heights)
        
        # Find takeoff (last local minimum before peak)
        takeoff_frame = 0
        for i in range(1, peak_frame):
            if com_heights[i] > com_heights[i-1] and com_heights[i] > com_heights[i+1]:
                takeoff_frame = i
                break
        
        # Setup is before takeoff
        setup_start = 0
        setup_end = takeoff_frame
        
        # Landing is after peak
        landing_frame = peak_frame + 1
        for i in range(peak_frame + 1, len(pose_sequence) - 1):
            if com_heights[i] > com_heights[peak_frame] + 0.1:  # Significant descent
                landing_frame = i
                break
        
        return JumpPhases(
            setup=(setup_start, setup_end),
            takeoff=(setup_end, peak_frame),
            peak=(peak_frame, landing_frame),
            landing=(landing_frame, len(pose_sequence) - 1)
        )
    
    def _calculate_arm_swing_timing(self, pose_sequence: List[PoseKeypoints], phases: JumpPhases) -> float:
        """Calculate arm swing timing in milliseconds"""
        # Simplified: time from setup to peak arm position
        if not pose_sequence:
            return 0.0
        
        setup_frame = pose_sequence[phases.setup[0]]
        takeoff_frame = pose_sequence[phases.takeoff[1]]
        
        time_diff = takeoff_frame.timestamp - setup_frame.timestamp
        return max(0.0, time_diff)
    
    def _calculate_ground_contact_time(self, pose_sequence: List[PoseKeypoints], phases: JumpPhases) -> float:
        """Calculate ground contact time"""
        if not pose_sequence:
            return 0.0
        
        landing_start = pose_sequence[phases.landing[0]]
        landing_end = pose_sequence[min(phases.landing[1], len(pose_sequence) - 1)]
        
        return landing_end.timestamp - landing_start.timestamp
    
    def _calculate_com_trajectory(self, pose_sequence: List[PoseKeypoints]) -> List[Point2D]:
        """Calculate center of mass trajectory"""
        trajectory = []
        for pose in pose_sequence:
            com = self.compute_center_of_mass(pose)
            trajectory.append(com)
        return trajectory
    
    def _calculate_takeoff_velocity(self, pose_sequence: List[PoseKeypoints], phases: JumpPhases) -> float:
        """Calculate takeoff velocity in m/s"""
        if len(pose_sequence) < 2:
            return 0.0
        
        # Get COM positions at takeoff and shortly after
        takeoff_idx = phases.takeoff[1]
        if takeoff_idx >= len(pose_sequence) - 1:
            return 0.0
        
        com1 = self.compute_center_of_mass(pose_sequence[takeoff_idx])
        com2 = self.compute_center_of_mass(pose_sequence[takeoff_idx + 1])
        
        # Calculate velocity (simplified, assumes normalized coordinates)
        dy = com1.y - com2.y  # Negative because y increases downward
        dt = (pose_sequence[takeoff_idx + 1].timestamp - pose_sequence[takeoff_idx].timestamp) / 1000.0
        
        if dt > 0:
            velocity = abs(dy) / dt * 2.0  # Scale factor for realistic m/s
            return velocity
        return 0.0
    
    def _calculate_symmetry(self, pose_sequence: List[PoseKeypoints]) -> float:
        """Calculate left-right symmetry score (0-1, 1 = perfect symmetry)"""
        if not pose_sequence:
            return 1.0
        
        # Compare knee angles throughout jump
        left_angles = []
        right_angles = []
        
        for pose in pose_sequence:
            left_angles.append(self.calculate_knee_angle(pose, 'left'))
            right_angles.append(self.calculate_knee_angle(pose, 'right'))
        
        # Calculate correlation
        left_angles = np.array(left_angles)
        right_angles = np.array(right_angles)
        
        # Symmetry based on angle difference
        diff = np.abs(left_angles - right_angles)
        avg_diff = np.mean(diff)
        
        # Convert to 0-1 score (smaller diff = higher symmetry)
        symmetry = max(0.0, 1.0 - (avg_diff / 90.0))  # Normalize by 90 degrees
        return symmetry
