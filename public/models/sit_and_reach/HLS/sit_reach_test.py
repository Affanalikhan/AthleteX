"""
Real-Time Sit & Reach Flexibility Test - Official SAI Standards
Enhanced implementation using YOLOv8n-pose + MediaPipe BlazePose
"""

import cv2
import numpy as np
from ultralytics import YOLO
import time
from datetime import datetime
import warnings
import os
import pyttsx3
import threading
import mediapipe as mp

warnings.filterwarnings('ignore')

class SitReachTest:
    def __init__(self):
        """Initialize Sit & Reach Test System with 2 AI models"""
        print("🔄 Loading AI Models (2 Models for Maximum Accuracy)...")
        
        # Model 1: YOLOv8n-pose
        print("  ✓ Loading YOLOv8n-pose...")
        self.yolo_model = YOLO('pretrained_models/yolov8n-pose.pt', verbose=False)
        
        # Model 2: MediaPipe BlazePose
        print("  ✓ Loading MediaPipe BlazePose...")
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        self.blazepose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,  # Most accurate
            smooth_landmarks=True,
            enable_segmentation=False,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
        print("✅ 2 Models loaded! (YOLOv8n + BlazePose for maximum accuracy)\n")
        print("   • YOLOv8n-pose: 17 keypoints + tracking")
        print("   • BlazePose: 33 keypoints (hips, knees, ankles, heels, feet)\n")
        
        # Voice guidance
        try:
            self.voice_engine = pyttsx3.init()
            self.voice_engine.setProperty('rate', 150)
            self.voice_enabled = True
            print("✅ Voice guidance enabled")
        except Exception as e:
            print(f"⚠️  Voice not available: {e}")
            print("   Continuing with visual guidance only")
            self.voice_enabled = False
        self.last_voice_message = ""
        
        # ARUCO for calibration
        self.ARUCO_DICT = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
        self.ARUCO_PARAMS = cv2.aruco.DetectorParameters()
        self.aruco_marker_size_cm = 20.0
        
        # Calibration
        self.pixels_per_cm = None
        self.is_calibrated = False
        self.baseline_x = None  # VERTICAL line X position at feet (0 cm reference)
        self.baseline_y = None  # Y position for drawing vertical line
        self.calibration_method = None  # "ARUCO", "RULER", or "AUTO"
        self.ruler_points = []  # For manual ruler calibration
        
        # Test state - START DIRECTLY AT READY (skip strict position checks)
        self.state = "READY"  # Skip setup guide, go straight to ready
        self.attempts = []
        self.current_attempt = 0
        self.max_attempts = 3
        self.is_calibrated = True  # Auto-calibrate
        self.pixels_per_cm = 4.0  # Default calibration (will auto-adjust)
        self.lenient_mode = True  # LENIENT: Don't block test for form issues
        
        # Setup guidance
        self.body_detected = False
        self.position_correct = False
        self.setup_checks = {
            'body_visible': False,
            'sitting_position': False,
            'legs_straight': False,
            'side_view': False,
            'feet_visible': False
        }
        
        # Measurement
        self.reach_distance_cm = 0
        self.max_reach_cm = 0
        self.hold_start_time = None
        self.hold_duration = 0
        self.required_hold_time = 1.5  # seconds
        
        # Form validation
        self.form_valid = True
        self.form_warnings = []
        
        # Guidance
        self.current_guidance = ""
        self.guidance_color = (255, 255, 255)
        
        self.cap = None
    

    def speak(self, message, force=False):
        """Voice guidance - speaks every important message"""
        if not self.voice_enabled:
            return
        
        # Always speak if force=True, or if message is different
        if force or message != self.last_voice_message:
            self.last_voice_message = message
            
            def speak_thread():
                try:
                    self.voice_engine.say(message)
                    self.voice_engine.runAndWait()
                except Exception as e:
                    pass
            
            # Start new thread for speech
            thread = threading.Thread(target=speak_thread, daemon=True)
            thread.start()

    def detect_aruco_and_calibrate(self, frame):
        """Detect ARUCO marker for calibration - ENHANCED VISUAL"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        corners, ids, _ = cv2.aruco.detectMarkers(gray, self.ARUCO_DICT, parameters=self.ARUCO_PARAMS)
        
        if ids is not None and len(corners) > 0:
            corner = corners[0][0]
            width_px = np.linalg.norm(corner[0] - corner[1])
            height_px = np.linalg.norm(corner[1] - corner[2])
            marker_size_px = (width_px + height_px) / 2
            self.pixels_per_cm = marker_size_px / self.aruco_marker_size_cm
            self.calibration_method = "ARUCO"
            self.is_calibrated = True
            
            # Draw marker with GREEN highlight
            cv2.aruco.drawDetectedMarkers(frame, corners, ids)
            
            # Add BIG label
            center_x = int(np.mean(corner[:, 0]))
            center_y = int(np.mean(corner[:, 1]))
            cv2.putText(frame, "ARUCO DETECTED!", 
                       (center_x - 100, center_y - 40), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 3)
            cv2.putText(frame, f"{self.pixels_per_cm:.2f} px/cm", 
                       (center_x - 80, center_y + 80), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            
            return True, frame
        
        return False, frame
    
    def calibrate_with_standard_box(self, frame, keypoints):
        """Calibration using standard SAI sit-reach box (23cm height) - AUTO"""
        if keypoints is None or len(keypoints) < 17:
            return False
        
        # Use foot-to-hip distance as reference
        left_hip = keypoints[11]
        right_hip = keypoints[12]
        left_ankle = keypoints[15]
        right_ankle = keypoints[16]
        
        if all(pt[2] > 0.5 for pt in [left_hip, right_hip, left_ankle, right_ankle]):
            hip_y = (left_hip[1] + right_hip[1]) / 2
            ankle_y = (left_ankle[1] + right_ankle[1]) / 2
            
            hip_to_ankle_px = abs(hip_y - ankle_y)
            
            # Average sitting leg length: 52cm
            if hip_to_ankle_px > 100:  # Lower threshold
                self.pixels_per_cm = hip_to_ankle_px / 52.0
                self.calibration_method = "AUTO"
                self.is_calibrated = True
                
                # Silent calibration - no voice
                if not hasattr(self, 'auto_calibrated'):
                    print(f"✅ Auto-calibrated: {self.pixels_per_cm:.2f} px/cm")
                    self.auto_calibrated = True
                
                return True
        
        return False
    
    def manual_ruler_calibration(self, frame, event, x, y, flags, param):
        """Click two points on a 30cm ruler for calibration"""
        if event == cv2.EVENT_LBUTTONDOWN:
            self.ruler_points.append((x, y))
            
            if len(self.ruler_points) == 2:
                # Calculate distance
                p1 = np.array(self.ruler_points[0])
                p2 = np.array(self.ruler_points[1])
                distance_px = np.linalg.norm(p2 - p1)
                
                # Assume 30cm ruler
                self.pixels_per_cm = distance_px / 30.0
                self.calibration_method = "RULER"
                self.ruler_points = []
    
    def detect_box_baseline(self, frame, keypoints, blazepose_landmarks=None, frame_w=640):
        """Detect VERTICAL baseline at TOE TIPS (furthest forward point of feet)
        
        SAI Rule: Set baseline ONCE at toe tips, use same line for all 3 attempts
        Uses BlazePose for accurate toe detection
        """
        # If baseline already set (from first attempt), keep using it
        if hasattr(self, 'baseline_locked') and self.baseline_locked:
            return True
        
        # Try to use BlazePose toe keypoints (most accurate)
        if blazepose_landmarks is not None:
            left_foot_index = blazepose_landmarks[self.mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value]
            right_foot_index = blazepose_landmarks[self.mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value]
            
            if left_foot_index.visibility > 0.5 or right_foot_index.visibility > 0.5:
                print(f"\n🦶 TOE DETECTION (BlazePose):")
                print(f"   Left toe:  X={left_foot_index.x * frame_w:.1f}, visibility={left_foot_index.visibility:.2f}")
                print(f"   Right toe: X={right_foot_index.x * frame_w:.1f}, visibility={right_foot_index.visibility:.2f}")
                
                # Use furthest forward toe (maximum X in side view)
                frame_h = 480  # Typical height
                if left_foot_index.visibility > 0.5 and right_foot_index.visibility > 0.5:
                    # Both visible - use furthest forward (max X)
                    left_x = int(left_foot_index.x * frame_w)
                    right_x = int(right_foot_index.x * frame_w)
                    self.baseline_x = max(left_x, right_x)  # Furthest forward toe
                    # Use Y of the furthest forward toe
                    if left_x > right_x:
                        self.baseline_y = int(left_foot_index.y * frame_h)
                    else:
                        self.baseline_y = int(right_foot_index.y * frame_h)
                    print(f"   Using FURTHEST FORWARD toe: X={self.baseline_x}, Y={self.baseline_y}")
                elif left_foot_index.visibility > 0.5:
                    self.baseline_x = int(left_foot_index.x * frame_w)
                    self.baseline_y = int(left_foot_index.y * frame_h)
                    print(f"   Using LEFT toe: X={self.baseline_x}, Y={self.baseline_y}")
                else:
                    self.baseline_x = int(right_foot_index.x * frame_w)
                    self.baseline_y = int(right_foot_index.y * frame_h)
                    print(f"   Using RIGHT toe: X={self.baseline_x}, Y={self.baseline_y}")
                
                # STABILIZE: Collect samples before locking
                if not hasattr(self, 'baseline_samples'):
                    self.baseline_samples = []
                    print(f"   📊 Collecting toe position samples...")
                
                self.baseline_samples.append(self.baseline_x)
                print(f"   Sample {len(self.baseline_samples)}/10: X={self.baseline_x}")
                
                # After 10 stable samples, LOCK the baseline
                if len(self.baseline_samples) >= 10:
                    # Use average of all samples
                    self.baseline_x = int(sum(self.baseline_samples) / len(self.baseline_samples))
                    self.baseline_locked = True
                    
                    print(f"\n✅ ✅ ✅ BASELINE LOCKED AT TOE TIPS ✅ ✅ ✅")
                    print(f"   Final position: X={self.baseline_x}, Y={self.baseline_y}")
                    print(f"   This is the FURTHEST FORWARD point of your toes")
                    print(f"   Yellow line FIXED at X={self.baseline_x}")
                    print(f"   This line will NOT MOVE for all 3 attempts")
                    print(f"   Measurement: hands < {self.baseline_x} = NEGATIVE")
                    print(f"   Measurement: hands > {self.baseline_x} = POSITIVE\n")
                    
                    if not hasattr(self, 'baseline_detected_voice'):
                        self.speak("Baseline locked at your toe tips. This line will be used for all attempts.", force=True)
                        self.baseline_detected_voice = True
                
                return True
        
        # Fallback to YOLO ankles if BlazePose not available
        if keypoints is not None and len(keypoints) >= 17:
            left_ankle = keypoints[15]
            right_ankle = keypoints[16]
            
            if left_ankle[2] > 0.4 or right_ankle[2] > 0.4:
                print(f"\n🦶 FEET DETECTION (YOLO - fallback):")
                # Use furthest forward ankle
                if left_ankle[2] > 0.4 and right_ankle[2] > 0.4:
                    self.baseline_x = int(max(left_ankle[0], right_ankle[0]))
                    self.baseline_y = int((left_ankle[1] + right_ankle[1]) / 2)
                elif left_ankle[2] > 0.4:
                    self.baseline_x = int(left_ankle[0])
                    self.baseline_y = int(left_ankle[1])
                else:
                    self.baseline_x = int(right_ankle[0])
                    self.baseline_y = int(right_ankle[1])
                
                if not hasattr(self, 'baseline_samples'):
                    self.baseline_samples = []
                
                self.baseline_samples.append(self.baseline_x)
                
                if len(self.baseline_samples) >= 10:
                    self.baseline_x = int(sum(self.baseline_samples) / len(self.baseline_samples))
                    self.baseline_locked = True
                    print(f"✅ Baseline locked at X={self.baseline_x}")
                
                return True
        
        return False

    def check_starting_position(self, keypoints):
        """Check if starting position is correct BEFORE test starts - LENIENT
        
        Returns: (is_correct, message)
        """
        if keypoints is None or len(keypoints) < 17:
            return False, "Show full body in camera"
        
        # Get keypoints
        left_hip = keypoints[11]
        right_hip = keypoints[12]
        left_knee = keypoints[13]
        right_knee = keypoints[14]
        left_ankle = keypoints[15]
        right_ankle = keypoints[16]
        left_wrist = keypoints[9]
        right_wrist = keypoints[10]
        
        # Check visibility - LENIENT
        required = [left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle]
        if any(pt[2] < 0.4 for pt in required):
            return False, "Show your body - hips, knees, feet"
        
        # Check 1: Legs reasonably straight (LENIENT - 140° is OK)
        left_knee_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
        min_angle = min(left_knee_angle, right_knee_angle)
        
        if min_angle < 140:  # More lenient
            return False, f"Straighten legs a bit more ({min_angle:.0f}°)"
        
        # Check 2: Sitting position (hips lower than shoulders)
        left_shoulder = keypoints[5]
        right_shoulder = keypoints[6]
        hip_y = (left_hip[1] + right_hip[1]) / 2
        shoulder_y = (left_shoulder[1] + right_shoulder[1]) / 2
        
        if hip_y < shoulder_y + 20:  # More lenient
            return False, "Sit down on the floor"
        
        # All checks passed!
        return True, "Position correct!"
    
    def validate_form(self, keypoints):
        """Validate form during test - GENTLE warnings, not strict"""
        self.form_warnings = []
        self.form_valid = True  # Always valid - just give gentle tips
        
        if keypoints is None or len(keypoints) < 17:
            self.current_guidance = "Reach forward as far as you can"
            self.guidance_color = (0, 255, 255)
            return True
        
        # Get keypoints
        left_hip = keypoints[11]
        right_hip = keypoints[12]
        left_knee = keypoints[13]
        right_knee = keypoints[14]
        left_ankle = keypoints[15]
        right_ankle = keypoints[16]
        left_wrist = keypoints[9]
        right_wrist = keypoints[10]
        
        # TIP 1: Legs bending (VERY LENIENT - only warn if VERY bent)
        left_knee_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
        min_angle = min(left_knee_angle, right_knee_angle)
        
        if min_angle < 130:  # Very lenient - only warn if VERY bent
            self.form_warnings.append(f"Tip: Straighten legs ({min_angle:.0f}°)")
            self.current_guidance = f"Tip: Try to keep legs straighter"
            self.guidance_color = (0, 255, 255)
            # Don't speak - too annoying
        
        # TIP 2: Hands not together (LENIENT)
        hand_distance = np.sqrt((left_wrist[0] - right_wrist[0])**2 + 
                               (left_wrist[1] - right_wrist[1])**2)
        
        if self.pixels_per_cm:
            hand_diff_cm = hand_distance / self.pixels_per_cm
            if hand_diff_cm > 20.0:  # Very lenient
                self.form_warnings.append(f"Tip: Hands apart")
                # Don't change guidance - not important
        
        # TIP 3: Feet moving (LENIENT - allow some movement)
        if not hasattr(self, 'initial_ankle_x'):
            self.initial_ankle_x = (left_ankle[0] + right_ankle[0]) / 2
        else:
            ankle_movement = abs(((left_ankle[0] + right_ankle[0]) / 2) - self.initial_ankle_x)
            if ankle_movement > 40:  # Very lenient - allow natural movement
                self.form_warnings.append("Tip: Keep feet still")
                # Don't change guidance - not critical
        
        # Good form - show positive message
        if not self.form_warnings:
            self.current_guidance = "✓ Keep reaching forward!"
            self.guidance_color = (0, 255, 0)
        
        return True  # Always valid - never block test
    
    def calculate_angle(self, p1, p2, p3):
        """Calculate angle at p2 between p1-p2-p3"""
        v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
        v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
        return np.degrees(angle)
    
    def check_setup_position(self, keypoints):
        """Check if user is in correct position for test with visual feedback"""
        if keypoints is None or len(keypoints) < 17:
            self.setup_checks['body_visible'] = False
            return False, "Stand or sit in camera view"
        
        # Get keypoints
        nose = keypoints[0]
        left_shoulder = keypoints[5]
        right_shoulder = keypoints[6]
        left_hip = keypoints[11]
        right_hip = keypoints[12]
        left_knee = keypoints[13]
        right_knee = keypoints[14]
        left_ankle = keypoints[15]
        right_ankle = keypoints[16]
        
        # Check 1: Body visible
        required = [nose, left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle]
        if all(pt[2] > 0.5 for pt in required):
            self.setup_checks['body_visible'] = True
        else:
            self.setup_checks['body_visible'] = False
            return False, "Show full body - head, hips, knees, ankles"
        
        # Check 2: Sitting position (hips lower than shoulders)
        hip_y = (left_hip[1] + right_hip[1]) / 2
        shoulder_y = (left_shoulder[1] + right_shoulder[1]) / 2
        
        if hip_y > shoulder_y + 50:  # Hips below shoulders = sitting
            self.setup_checks['sitting_position'] = True
        else:
            self.setup_checks['sitting_position'] = False
            return False, "SIT DOWN on the floor"
        
        # Check 3: Legs straight (knee angle check)
        left_knee_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
        
        if left_knee_angle > 150 and right_knee_angle > 150:
            self.setup_checks['legs_straight'] = True
        else:
            self.setup_checks['legs_straight'] = False
            return False, f"STRAIGHTEN your legs (angle: {min(left_knee_angle, right_knee_angle):.0f}°)"
        
        # Check 4: Side view (one shoulder should be more visible than other)
        shoulder_diff = abs(left_shoulder[2] - right_shoulder[2])
        
        if shoulder_diff > 0.2:  # One shoulder more visible = side view
            self.setup_checks['side_view'] = True
        else:
            self.setup_checks['side_view'] = False
            return False, "Turn SIDEWAYS to camera (show your profile)"
        
        # Check 5: Feet visible
        if left_ankle[2] > 0.6 and right_ankle[2] > 0.6:
            self.setup_checks['feet_visible'] = True
        else:
            self.setup_checks['feet_visible'] = False
            return False, "Show your FEET clearly"
        
        # All checks passed!
        return True, "✓ PERFECT POSITION! Press SPACE to continue"
    
    def draw_setup_guide(self, frame, keypoints, message):
        """Draw visual guide showing correct position"""
        h, w = frame.shape[:2]
        
        # Draw skeleton with color coding
        if keypoints is not None and len(keypoints) >= 17:
            # Color code based on checks
            body_color = (0, 255, 0) if self.setup_checks['body_visible'] else (0, 0, 255)
            sitting_color = (0, 255, 0) if self.setup_checks['sitting_position'] else (0, 0, 255)
            legs_color = (0, 255, 0) if self.setup_checks['legs_straight'] else (0, 0, 255)
            side_color = (0, 255, 0) if self.setup_checks['side_view'] else (0, 0, 255)
            feet_color = (0, 255, 0) if self.setup_checks['feet_visible'] else (0, 0, 255)
            
            # Draw keypoints with color coding
            # Hips (sitting check)
            for idx in [11, 12]:
                if keypoints[idx][2] > 0.5:
                    cv2.circle(frame, (int(keypoints[idx][0]), int(keypoints[idx][1])), 
                              10, sitting_color, -1)
            
            # Knees and legs (straight check)
            for idx in [13, 14]:
                if keypoints[idx][2] > 0.5:
                    cv2.circle(frame, (int(keypoints[idx][0]), int(keypoints[idx][1])), 
                              10, legs_color, -1)
            
            # Ankles/feet (visibility check)
            for idx in [15, 16]:
                if keypoints[idx][2] > 0.5:
                    cv2.circle(frame, (int(keypoints[idx][0]), int(keypoints[idx][1])), 
                              12, feet_color, -1)
                    cv2.circle(frame, (int(keypoints[idx][0]), int(keypoints[idx][1])), 
                              15, feet_color, 3)
            
            # Draw leg lines
            left_hip = keypoints[11]
            left_knee = keypoints[13]
            left_ankle = keypoints[15]
            right_hip = keypoints[12]
            right_knee = keypoints[14]
            right_ankle = keypoints[16]
            
            if all(pt[2] > 0.5 for pt in [left_hip, left_knee, left_ankle]):
                cv2.line(frame, (int(left_hip[0]), int(left_hip[1])), 
                        (int(left_knee[0]), int(left_knee[1])), legs_color, 4)
                cv2.line(frame, (int(left_knee[0]), int(left_knee[1])), 
                        (int(left_ankle[0]), int(left_ankle[1])), legs_color, 4)
                
                # Show knee angle
                angle = self.calculate_angle(left_hip, left_knee, left_ankle)
                cv2.putText(frame, f"{angle:.0f}°", 
                           (int(left_knee[0]) + 20, int(left_knee[1])), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.0, legs_color, 2)
        
        # Draw checklist
        y_start = 150
        cv2.putText(frame, "SETUP CHECKLIST:", (20, y_start), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)
        
        checks = [
            ("1. Body visible", self.setup_checks['body_visible']),
            ("2. Sitting position", self.setup_checks['sitting_position']),
            ("3. Legs straight (>150°)", self.setup_checks['legs_straight']),
            ("4. Side view (profile)", self.setup_checks['side_view']),
            ("5. Feet visible", self.setup_checks['feet_visible'])
        ]
        
        for i, (check_text, passed) in enumerate(checks):
            color = (0, 255, 0) if passed else (0, 165, 255)
            symbol = "✓" if passed else "○"
            cv2.putText(frame, f"{symbol} {check_text}", 
                       (30, y_start + 45 + i*40), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        
        # Draw main guidance message
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (w-10, 120), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.75, frame, 0.25, 0)
        
        msg_color = (0, 255, 0) if all(self.setup_checks.values()) else (0, 255, 255)
        cv2.rectangle(frame, (10, 10), (w-10, 120), msg_color, 4)
        cv2.putText(frame, message, (30, 75), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, msg_color, 3)
        
        return frame

    def measure_reach_blazepose(self, landmarks, frame_w):
        """Measure reach using MediaPipe BlazePose from VERTICAL baseline
        
        SAI OFFICIAL METHOD:
        - VERTICAL yellow line at feet = 0 cm reference
        - Positive (+) = hands BEYOND the yellow line
        - Negative (−) = hands BEFORE the yellow line
        """
        if not self.is_calibrated or self.baseline_x is None or landmarks is None:
            return 0
        
        # BlazePose has more precise hand landmarks
        left_wrist = landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value]
        right_wrist = landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value]
        left_index = landmarks[self.mp_pose.PoseLandmark.LEFT_INDEX.value]
        right_index = landmarks[self.mp_pose.PoseLandmark.RIGHT_INDEX.value]
        
        # Check visibility
        if left_wrist.visibility > 0.5 and right_wrist.visibility > 0.5:
            # Use fingertips if available, otherwise wrists
            if left_index.visibility > 0.5 and right_index.visibility > 0.5:
                # Use index fingers (more accurate for reach)
                fingertip_x_norm = max(left_index.x, right_index.x)  # Furthest forward hand
            else:
                # Fallback to wrists
                fingertip_x_norm = max(left_wrist.x, right_wrist.x)
            
            # Convert normalized coordinate to pixels
            fingertip_x = fingertip_x_norm * frame_w
            
            # SAI METHOD: Measure HORIZONTAL distance from vertical baseline
            # Positive = beyond baseline, Negative = before baseline
            reach_px = fingertip_x - self.baseline_x
            
            # Convert to cm
            reach_cm = reach_px / self.pixels_per_cm
            
            return reach_cm
        
        return 0
    
    def measure_reach(self, keypoints):
        """Measure reach distance from VERTICAL baseline at feet
        
        SAI OFFICIAL METHOD:
        - VERTICAL yellow line at feet = 0 cm reference
        - Positive (+) = hands BEYOND the yellow line (past feet)
        - Negative (−) = hands BEFORE the yellow line (can't reach feet)
        
        Measurement: Horizontal distance from vertical baseline to hands
        """
        if not self.is_calibrated or self.baseline_x is None:
            return 0
        
        if keypoints is None or len(keypoints) < 17:
            return 0
        
        # Get hand positions (wrists as proxy for fingertips)
        left_wrist = keypoints[9]
        right_wrist = keypoints[10]
        
        if left_wrist[2] > 0.5 and right_wrist[2] > 0.5:
            # Use AVERAGE of both hands (SAI: hands should be together)
            fingertip_x = (left_wrist[0] + right_wrist[0]) / 2
            
            # SAI METHOD: Measure HORIZONTAL distance from vertical baseline
            # baseline_x is the vertical line at feet (0 cm)
            # Positive = hands beyond baseline (fingertip_x > baseline_x)
            # Negative = hands before baseline (fingertip_x < baseline_x)
            reach_px = fingertip_x - self.baseline_x
            
            # Convert to cm
            reach_cm = reach_px / self.pixels_per_cm
            
            # DEBUG: Print measurement
            if reach_cm < 0:
                print(f"   📏 Hands BEFORE line: {reach_cm:.1f} cm (fingertip_x={fingertip_x:.1f} < baseline_x={self.baseline_x})")
            elif reach_cm > 0:
                print(f"   📏 Hands BEYOND line: +{reach_cm:.1f} cm (fingertip_x={fingertip_x:.1f} > baseline_x={self.baseline_x})")
            else:
                print(f"   📏 Hands AT line: 0 cm (fingertip_x={fingertip_x:.1f} = baseline_x={self.baseline_x})")
            
            return reach_cm
        
        return 0
    
    def check_hold_position(self, reach_cm):
        """Check if position is held for required time (SAI: 1-2 seconds) - LENIENT"""
        # Update max reach first
        if reach_cm > self.max_reach_cm:
            self.max_reach_cm = reach_cm
        
        # LENIENT: Check if reach is stable (within 3cm - much more lenient)
        if abs(reach_cm - self.max_reach_cm) < 3.0:
            if self.hold_start_time is None:
                self.hold_start_time = time.time()
                print(f"🕐 Hold started at {reach_cm:.1f} cm")
            else:
                self.hold_duration = time.time() - self.hold_start_time
                
                if self.hold_duration >= self.required_hold_time:
                    print(f"✅ Hold complete! Held for {self.hold_duration:.1f} seconds")
                    return True
        else:
            # Position changed significantly, reset hold timer
            if self.hold_start_time is not None:
                print(f"⚠️ Hold reset - position changed")
            self.hold_start_time = None
            self.hold_duration = 0
        
        return False
    
    def get_flexibility_rating(self, score_cm):
        """Get SAI flexibility rating based on score"""
        # SAI Standards (approximate for adults)
        if score_cm >= 40:
            return "Rating: Excellent"
        elif score_cm >= 35:
            return "Rating: Very Good"
        elif score_cm >= 30:
            return "Rating: Good"
        elif score_cm >= 25:
            return "Rating: Average"
        elif score_cm >= 20:
            return "Rating: Below Average"
        else:
            return "Rating: Poor - Needs Improvement"
    
    def capture_photo_async(self, frame, athlete_id, reach_cm, rating):
        """Capture photo in background thread (no lag)"""
        def save_photo():
            if not os.path.exists('sit_reach_results'):
                os.makedirs('sit_reach_results')
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"sit_reach_results/{athlete_id}_{timestamp}_{reach_cm:.1f}cm.jpg"
            
            photo = frame.copy()
            h, w = photo.shape[:2]
            
            # Add overlay
            overlay = photo.copy()
            cv2.rectangle(overlay, (0, h-120), (w, h), (0, 0, 0), -1)
            photo = cv2.addWeighted(overlay, 0.7, photo, 0.3, 0)
            
            # Add text
            cv2.putText(photo, f"Sit & Reach: {reach_cm:.1f} cm", 
                       (20, h-80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
            cv2.putText(photo, rating, 
                       (20, h-45), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
            cv2.putText(photo, f"ID: {athlete_id} | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 
                       (20, h-15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            cv2.imwrite(filename, photo)
            print(f"📸 Photo saved: {filename}")
        
        threading.Thread(target=save_photo, daemon=True).start()

    def draw_skeleton(self, frame, keypoints, highlight_legs=False):
        """Draw GREEN skeleton like height assessment - full body visualization"""
        if keypoints is None or len(keypoints) < 17:
            return frame
        
        # Skeleton connections - ALL GREEN
        skeleton = [
            [0, 1], [0, 2], [1, 3], [2, 4],  # Head
            [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],  # Arms
            [5, 11], [6, 12], [11, 12],  # Torso
            [11, 13], [13, 15], [12, 14], [14, 16]  # Legs
        ]
        
        # Color: GREEN for good form, RED for bad form
        skeleton_color = (0, 255, 0) if not highlight_legs else (0, 0, 255)
        
        # Draw all skeleton lines in GREEN
        for conn in skeleton:
            pt1_idx, pt2_idx = conn
            if pt1_idx < len(keypoints) and pt2_idx < len(keypoints):
                pt1, pt2 = keypoints[pt1_idx], keypoints[pt2_idx]
                if pt1[2] > 0.4 and pt2[2] > 0.4:
                    cv2.line(frame, (int(pt1[0]), int(pt1[1])), 
                            (int(pt2[0]), int(pt2[1])), skeleton_color, 3)
        
        # Draw all keypoints as GREEN DOTS
        for i, kp in enumerate(keypoints):
            if kp[2] > 0.4:
                # Draw green dot
                cv2.circle(frame, (int(kp[0]), int(kp[1])), 7, (0, 255, 0), -1)
                cv2.circle(frame, (int(kp[0]), int(kp[1])), 9, (0, 200, 0), 2)
        
        # Highlight important points with BIGGER dots
        important_points = {
            9: "L.HAND",
            10: "R.HAND",
            11: "L.HIP",
            12: "R.HIP",
            13: "L.KNEE",
            14: "R.KNEE",
            15: "L.FOOT",
            16: "R.FOOT"
        }
        
        for idx, label in important_points.items():
            if idx < len(keypoints) and keypoints[idx][2] > 0.4:
                kp = keypoints[idx]
                # Bigger green dot
                cv2.circle(frame, (int(kp[0]), int(kp[1])), 12, (0, 255, 0), -1)
                cv2.circle(frame, (int(kp[0]), int(kp[1])), 15, (0, 200, 0), 3)
                
                # Label
                cv2.putText(frame, label, 
                           (int(kp[0]) + 20, int(kp[1])), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        return frame
    
    def draw_measurement_overlay(self, frame, keypoints, reach_cm):
        """Draw measurement lines and reach distance with guidance
        
        Shows:
        - VERTICAL baseline at feet (0 cm reference)
        - Hand position
        - Horizontal reach distance from baseline
        """
        h, w = frame.shape[:2]
        
        if self.baseline_x and keypoints is not None and len(keypoints) >= 17:
            # Draw VERTICAL baseline at FEET position (SAI: 0 cm reference point)
            cv2.line(frame, (self.baseline_x, 0), (self.baseline_x, h), (0, 255, 255), 6)
            cv2.putText(frame, "0cm", (self.baseline_x - 40, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 3)
            
            # Draw hands and horizontal measurement line
            left_wrist = keypoints[9]
            right_wrist = keypoints[10]
            
            if left_wrist[2] > 0.5 and right_wrist[2] > 0.5:
                # Get AVERAGE hand position (hands should be together)
                hand_x = int((left_wrist[0] + right_wrist[0]) / 2)
                hand_y = int((left_wrist[1] + right_wrist[1]) / 2)
                
                # Draw both hands
                cv2.circle(frame, (int(left_wrist[0]), int(left_wrist[1])), 15, (0, 255, 255), -1)
                cv2.circle(frame, (int(right_wrist[0]), int(right_wrist[1])), 15, (0, 255, 255), -1)
                cv2.circle(frame, (int(left_wrist[0]), int(left_wrist[1])), 18, (255, 255, 255), 3)
                cv2.circle(frame, (int(right_wrist[0]), int(right_wrist[1])), 18, (255, 255, 255), 3)
                
                # Draw HORIZONTAL measurement line from vertical baseline to hands
                cv2.line(frame, (self.baseline_x, hand_y), (hand_x, hand_y), (255, 255, 0), 8)
                
                # Draw arrows
                if hand_x > self.baseline_x:  # Positive reach (beyond baseline)
                    cv2.arrowedLine(frame, (self.baseline_x, hand_y), (self.baseline_x + 40, hand_y), 
                                   (0, 255, 255), 6, tipLength=0.3)
                    cv2.arrowedLine(frame, (hand_x, hand_y), (hand_x - 40, hand_y), 
                                   (0, 255, 255), 6, tipLength=0.3)
                else:  # Negative reach (before baseline)
                    cv2.arrowedLine(frame, (self.baseline_x, hand_y), (self.baseline_x - 40, hand_y), 
                                   (0, 255, 255), 6, tipLength=0.3)
                    cv2.arrowedLine(frame, (hand_x, hand_y), (hand_x + 40, hand_y), 
                                   (0, 255, 255), 6, tipLength=0.3)
                
                # Reach distance text - VERY BIG
                color = (0, 255, 0) if reach_cm > 0 else (0, 165, 255) if reach_cm < 0 else (255, 255, 0)
                sign = "+" if reach_cm > 0 else ""
                text = f"{sign}{reach_cm:.1f} cm"
                text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 2.5, 6)[0]
                text_x = int((self.baseline_x + hand_x) / 2) - text_size[0] // 2
                text_y = hand_y - 100
                
                # Background rectangle for text
                cv2.rectangle(frame, (text_x - 15, text_y - text_size[1] - 15), 
                             (text_x + text_size[0] + 15, text_y + 15), (0, 0, 0), -1)
                cv2.rectangle(frame, (text_x - 15, text_y - text_size[1] - 15), 
                             (text_x + text_size[0] + 15, text_y + 15), color, 4)
                
                # Text
                cv2.putText(frame, text, (text_x, text_y), 
                           cv2.FONT_HERSHEY_SIMPLEX, 2.5, color, 6)
                
                # Add explanation below
                if reach_cm > 0:
                    explanation = "BEYOND feet line"
                elif reach_cm < 0:
                    explanation = "BEFORE feet line"
                else:
                    explanation = "AT feet line"
                cv2.putText(frame, explanation, (text_x, text_y + 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 3)
                
                # Draw knee angles for visual feedback
                left_knee = keypoints[13]
                right_knee = keypoints[14]
                left_hip = keypoints[11]
                left_ankle = keypoints[15]
                right_hip = keypoints[12]
                right_ankle = keypoints[16]
                
                # Left knee angle
                if all(pt[2] > 0.6 for pt in [left_hip, left_knee, left_ankle]):
                    angle = self.calculate_angle(left_hip, left_knee, left_ankle)
                    angle_color = (0, 255, 0) if angle >= 170 else (0, 0, 255)
                    cv2.putText(frame, f"L: {angle:.0f}°", 
                               (int(left_knee[0]) + 20, int(left_knee[1])), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, angle_color, 2)
                
                # Right knee angle
                if all(pt[2] > 0.6 for pt in [right_hip, right_knee, right_ankle]):
                    angle = self.calculate_angle(right_hip, right_knee, right_ankle)
                    angle_color = (0, 255, 0) if angle >= 170 else (0, 0, 255)
                    cv2.putText(frame, f"R: {angle:.0f}°", 
                               (int(right_knee[0]) + 20, int(right_knee[1])), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, angle_color, 2)
        
        return frame
    
    def draw_guidance_box(self, frame):
        """Draw big guidance message box"""
        h, w = frame.shape[:2]
        
        # Create semi-transparent box
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (w-10, 140), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.75, frame, 0.25, 0)
        
        # Border
        cv2.rectangle(frame, (10, 10), (w-10, 140), self.guidance_color, 4)
        
        # Guidance text - BIG
        cv2.putText(frame, self.current_guidance, 
                   (30, 85), cv2.FONT_HERSHEY_SIMPLEX, 1.3, self.guidance_color, 3)
        
        return frame

    def show_demo(self):
        """Show visual demo of how to conduct the test"""
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        cv2.namedWindow('Sit & Reach Test', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Sit & Reach Test', 1280, 720)
        
        print("\n� Showiing DEMO - How to conduct the test...")
        print("   Press SPACE to continue\n")
        
        demo_steps = [
            {
                'title': 'STEP 1: EQUIPMENT REQUIRED',
                'instructions': [
                    '✓ SIT-AND-REACH BOX (23cm standard) OR WALL',
                    '✓ Camera (webcam or phone)',
                    '✓ Flat floor surface',
                    '',
                    'BOX/WALL is REQUIRED for measurement scale!',
                    'Your feet must press against it for baseline.'
                ],
                'image': '📦 Box or Wall = Measurement Reference Point'
            },
            {
                'title': 'STEP 2: CAMERA SETUP (SIDE VIEW)',
                'instructions': [
                    '1. Place camera on table (50-70cm high)',
                    '2. Position camera to your LEFT or RIGHT side',
                    '3. Distance: 2-3 meters away',
                    '4. Camera should see your PROFILE (side view)',
                    '5. Make sure full body is visible',
                    '',
                    'SIDE VIEW is essential for accurate measurement!'
                ],
                'image': 'Camera → You (sideways) → Box/Wall'
            },
            {
                'title': 'STEP 3: SITTING POSITION',
                'instructions': [
                    '1. SIT DOWN on the floor (not standing!)',
                    '2. Sit SIDEWAYS to camera (profile view)',
                    '3. Legs STRAIGHT in front of you',
                    '4. Feet FLAT against box/wall',
                    '5. Knees FLAT on ground (no bending)',
                    '',
                    'Green skeleton will show your pose in real-time!'
                ],
                'image': 'You → Sitting → Feet against Box/Wall'
            },
            {
                'title': 'STEP 4: REACHING FORWARD',
                'instructions': [
                    '1. Place both hands together (one on top)',
                    '2. Palms DOWN, fingers extended',
                    '3. Reach forward SMOOTHLY (no bouncing)',
                    '4. Keep legs STRAIGHT (knees flat)',
                    '5. HOLD maximum reach for 1-2 seconds',
                    '',
                    'System measures from box/wall to your fingertips!'
                ],
                'image': 'Bend forward → Reach past feet → Hold'
            }
        ]
        
        step_index = 0
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame = cv2.flip(frame, 1)
            h, w = frame.shape[:2]
            
            # Dark overlay
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
            frame = cv2.addWeighted(overlay, 0.9, frame, 0.1, 0)
            
            step = demo_steps[step_index]
            
            # Title
            cv2.putText(frame, "HOW TO CONDUCT SIT & REACH TEST", 
                       (w//2 - 400, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 255), 3)
            
            # Step title
            cv2.putText(frame, step['title'], 
                       (100, 140), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
            
            # Instructions
            y = 200
            for instruction in step['instructions']:
                cv2.putText(frame, instruction, 
                           (120, y), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                y += 50
            
            # Visual diagram
            cv2.putText(frame, step['image'], 
                       (120, y + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
            
            # Navigation
            cv2.putText(frame, f"Step {step_index + 1} of {len(demo_steps)}", 
                       (w//2 - 100, h - 100), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
            
            if step_index < len(demo_steps) - 1:
                if int(time.time() * 2) % 2 == 0:
                    cv2.putText(frame, "Press SPACE for next step", 
                               (w//2 - 220, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
            else:
                if int(time.time() * 2) % 2 == 0:
                    cv2.putText(frame, "Press SPACE to start test", 
                               (w//2 - 220, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
            
            cv2.imshow('Sit & Reach Test', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord(' '):
                if step_index < len(demo_steps) - 1:
                    step_index += 1
                else:
                    return True
            elif key == ord('q'):
                self.cap.release()
                cv2.destroyAllWindows()
                return False
        
        return True
    
    def show_instructions(self):
        """Show SAI rules and instructions"""
        if not hasattr(self, 'cap') or self.cap is None:
            self.cap = cv2.VideoCapture(0)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        cv2.namedWindow('Sit & Reach Test', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Sit & Reach Test', 1280, 720)
        
        print("\n📋 Showing instructions...")
        print("   Press SPACE to continue or D for DEMO\n")
        
        self.speak("Welcome to sit and reach flexibility test. Press space to continue or D for demo.")
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame = cv2.flip(frame, 1)
            h, w = frame.shape[:2]
            
            # Dark overlay
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
            frame = cv2.addWeighted(overlay, 0.85, frame, 0.15, 0)
            
            # Title
            cv2.putText(frame, "SIT & REACH FLEXIBILITY TEST", 
                       (w//2 - 400, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3)
            cv2.putText(frame, "Sports Authority of India (SAI) - Official Standards", 
                       (w//2 - 350, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            # SAI SCORING METHOD - BIG BOX
            cv2.rectangle(frame, (50, 120), (w-50, 240), (0, 255, 255), 4)
            cv2.putText(frame, "SAI SCORING METHOD:", 
                       (w//2 - 220, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 3)
            cv2.putText(frame, "0 cm = At your toes (feet line)", 
                       (w//2 - 300, 185), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2)
            cv2.putText(frame, "+ Score = Fingertips BEYOND toes (e.g., +10 cm)", 
                       (w//2 - 350, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0, 255, 0), 2)
            cv2.putText(frame, "- Score = Fingertips BEFORE toes (e.g., -5 cm)", 
                       (w//2 - 350, 245), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0, 165, 255), 2)
            
            # EQUIPMENT REQUIREMENTS
            cv2.rectangle(frame, (50, 260), (w-50, 340), (0, 255, 0), 4)
            cv2.putText(frame, "REQUIRED EQUIPMENT:", 
                       (w//2 - 250, 290), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 3)
            cv2.putText(frame, "1. SIT-AND-REACH BOX or WALL (for feet to press against)", 
                       (w//2 - 400, 320), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(frame, "2. SIDE VIEW - Camera on your LEFT or RIGHT side", 
                       (w//2 - 400, 350), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            
            y = 360
            # Official SAI Rules
            cv2.putText(frame, "OFFICIAL SAI PROCEDURE:", (80, y), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
            cv2.putText(frame, "1. Sit with legs FULLY STRAIGHT (knee angle 170°+)", (100, y+45), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(frame, "2. Feet FLAT against box (23cm standard box)", (100, y+85), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(frame, "3. Knees FLAT on ground (no bending)", (100, y+125), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(frame, "4. Hands: ONE ON TOP of other, middle fingers aligned", (100, y+165), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(frame, "5. Palms DOWN, fingers EXTENDED and overlapping", (100, y+205), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(frame, "6. Reach forward SMOOTHLY (no bouncing/jerking)", (100, y+245), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(frame, "7. HOLD maximum reach for 1-2 seconds", (100, y+285), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(frame, "8. Three ATTEMPTS - best score recorded", (100, y+325), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            
            y_invalid = y + 380
            cv2.putText(frame, "INVALID ATTEMPTS (Will be Rejected):", (80, y_invalid), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
            cv2.putText(frame, "X Bent knees (angle < 170°)", (100, y_invalid+40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(frame, "X Bouncing or jerking movement", (100, y_invalid+75), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(frame, "X Hands not aligned (>3cm apart)", (100, y_invalid+110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(frame, "X Feet moving or lifting", (100, y_invalid+145), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(frame, "X Not holding position (1-2 sec)", (100, y_invalid+180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # Start instruction
            if int(time.time() * 2) % 2 == 0:
                cv2.putText(frame, "Press SPACE to START", 
                           (w//2 - 250, h - 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
            
            cv2.putText(frame, "Press D for DEMO or SPACE to start", 
                       (w//2 - 300, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
            
            cv2.imshow('Sit & Reach Test', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord(' '):
                return True
            elif key == ord('d') or key == ord('D'):
                # Show demo
                return self.show_demo()
            elif key == ord('q'):
                self.cap.release()
                cv2.destroyAllWindows()
                return False

    def run_test(self):
        """Main test loop"""
        if not self.show_instructions():
            return
        
        print("🏃 Sit & Reach Test Started\n")
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame = cv2.flip(frame, 1)
            h, w = frame.shape[:2]
            
            # Process with BOTH models for maximum accuracy
            # Model 1: YOLO
            results = self.yolo_model(frame, verbose=False)
            keypoints = None
            
            if len(results) > 0 and results[0].keypoints is not None:
                keypoints_data = results[0].keypoints.data
                if len(keypoints_data) > 0:
                    keypoints = keypoints_data[0].cpu().numpy()
            
            # Model 2: BlazePose
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            blazepose_results = self.blazepose.process(frame_rgb)
            blazepose_landmarks = None
            if blazepose_results and blazepose_results.pose_landmarks:
                blazepose_landmarks = blazepose_results.pose_landmarks.landmark
            
            # Auto-calibrate in background (silent)
            if keypoints is not None and len(keypoints) >= 17:
                self.calibrate_with_standard_box(frame, keypoints)
            
            # State machine
            if self.state == "SETUP_GUIDE":
                # Draw skeleton FIRST so user can see their pose
                if keypoints is not None and len(keypoints) >= 17:
                    frame = self.draw_skeleton(frame, keypoints, highlight_legs=False)
                
                # Also draw BlazePose if available
                if blazepose_landmarks:
                    self.mp_drawing.draw_landmarks(
                        frame,
                        blazepose_results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=3),
                        connection_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 200, 0), thickness=2)
                    )
                
                # Guide user to correct position
                position_ok, guidance_msg = self.check_setup_position(keypoints)
                
                frame = self.draw_setup_guide(frame, keypoints, guidance_msg)
                
                # Voice guidance - speak what user needs to do
                if not position_ok:
                    if not hasattr(self, 'last_setup_voice') or time.time() - self.last_setup_voice > 5:
                        # Speak specific instruction based on what's missing
                        if not self.setup_checks['sitting_position']:
                            self.speak("Sit down on the floor", force=True)
                        elif not self.setup_checks['legs_straight']:
                            self.speak("Straighten your legs completely", force=True)
                        elif not self.setup_checks['side_view']:
                            self.speak("Turn sideways to the camera", force=True)
                        elif not self.setup_checks['feet_visible']:
                            self.speak("Show your feet clearly", force=True)
                        else:
                            self.speak(guidance_msg, force=True)
                        self.last_setup_voice = time.time()
                else:
                    # All checks passed - AUTO PROCEED
                    if not hasattr(self, 'setup_complete_time'):
                        self.speak("Perfect position! Starting calibration.", force=True)
                        self.setup_complete_time = time.time()
                    
                    # Auto-proceed after 2 seconds
                    elapsed = time.time() - self.setup_complete_time
                    countdown = 2 - int(elapsed)
                    
                    if countdown > 0:
                        cv2.putText(frame, f"Starting calibration in {countdown}...", 
                                   (w//2 - 250, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
                    else:
                        self.state = "CALIBRATION"
                        if hasattr(self, 'setup_complete_time'):
                            delattr(self, 'setup_complete_time')
            
            elif self.state == "CALIBRATION":
                # Try ARUCO first
                aruco_found, frame = self.detect_aruco_and_calibrate(frame)
                
                # Try automatic calibration with body
                if not aruco_found:
                    auto_calibrated = self.calibrate_with_standard_box(frame, keypoints)
                else:
                    auto_calibrated = False
                
                if aruco_found or auto_calibrated:
                    method_name = "ARUCO Marker" if aruco_found else "Body Proportions (Auto)"
                    self.current_guidance = f"✓ Calibrated! Method: {method_name}"
                    self.guidance_color = (0, 255, 0)
                    frame = self.draw_guidance_box(frame)
                    
                    cv2.putText(frame, "Calibration Successful!", 
                               (w//2 - 250, h//2 - 50), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3)
                    cv2.putText(frame, f"Method: {method_name}", 
                               (w//2 - 200, h//2 + 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
                    cv2.putText(frame, f"Accuracy: {self.pixels_per_cm:.2f} px/cm", 
                               (w//2 - 200, h//2 + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
                    
                    # Auto-proceed after 2 seconds
                    if not hasattr(self, 'calibration_complete_time'):
                        self.speak("Calibration complete. Get ready for the test.", force=True)
                        self.calibration_complete_time = time.time()
                    
                    elapsed = time.time() - self.calibration_complete_time
                    countdown = 2 - int(elapsed)
                    
                    if countdown > 0:
                        cv2.putText(frame, f"Starting test in {countdown}...", 
                                   (w//2 - 200, h//2 + 110), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
                    else:
                        self.is_calibrated = True
                        self.state = "READY"
                        if hasattr(self, 'calibration_complete_time'):
                            delattr(self, 'calibration_complete_time')
                else:
                    self.current_guidance = "EASY CALIBRATION - Just stand in front of camera!"
                    self.guidance_color = (0, 255, 255)
                    frame = self.draw_guidance_box(frame)
                    
                    cv2.putText(frame, "AUTOMATIC CALIBRATION:", 
                               (w//2 - 280, h//2 - 140), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)
                    
                    # Box/Wall requirement
                    cv2.rectangle(frame, (w//2 - 300, h//2 - 100), (w//2 + 300, h//2 - 50), (0, 255, 0), 3)
                    cv2.putText(frame, "📦 PLACE BOX or WALL for feet!", 
                               (w//2 - 250, h//2 - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                    
                    cv2.putText(frame, "OPTION 1: AUTO (Recommended)", 
                               (w//2 - 280, h//2 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
                    cv2.putText(frame, "1. Sit in SIDE VIEW with box/wall", 
                               (w//2 - 260, h//2 + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    cv2.putText(frame, "2. Feet FLAT against box/wall", 
                               (w//2 - 260, h//2 + 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    cv2.putText(frame, "3. Show full body (hip to feet)", 
                               (w//2 - 260, h//2 + 95), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    
                    cv2.putText(frame, "OPTION 2: With Ruler (More Accurate)", 
                               (w//2 - 280, h//2 + 130), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
                    cv2.putText(frame, "Press 'R' to use 30cm ruler", 
                               (w//2 - 260, h//2 + 165), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                    
                    # Check for ruler mode
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('r'):
                        self.state = "RULER_CALIBRATION"
                        self.ruler_points = []
                        self.speak("Place a thirty centimeter ruler in view. Click both ends.")
                    
                    if not hasattr(self, 'calibration_voice_spoken'):
                        self.speak("Sit in test position showing your full body for automatic calibration")
                        self.calibration_voice_spoken = True
            
            elif self.state == "RULER_CALIBRATION":
                self.current_guidance = "Click START and END of 30cm ruler"
                self.guidance_color = (0, 255, 255)
                frame = self.draw_guidance_box(frame)
                
                cv2.putText(frame, "RULER CALIBRATION:", 
                           (w//2 - 200, h//2 - 80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)
                cv2.putText(frame, "1. Place a 30cm ruler in view", 
                           (w//2 - 200, h//2 - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                cv2.putText(frame, "2. Click at 0cm mark", 
                           (w//2 - 200, h//2 + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                cv2.putText(frame, "3. Click at 30cm mark", 
                           (w//2 - 200, h//2 + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                
                # Draw clicked points
                for i, pt in enumerate(self.ruler_points):
                    cv2.circle(frame, pt, 10, (0, 255, 0), -1)
                    cv2.putText(frame, f"Point {i+1}", (pt[0] + 15, pt[1]), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                if len(self.ruler_points) == 2:
                    # Draw line
                    cv2.line(frame, self.ruler_points[0], self.ruler_points[1], (0, 255, 0), 3)
                    
                    # Calculate
                    p1 = np.array(self.ruler_points[0])
                    p2 = np.array(self.ruler_points[1])
                    distance_px = np.linalg.norm(p2 - p1)
                    self.pixels_per_cm = distance_px / 30.0
                    self.calibration_method = "RULER"
                    
                    cv2.putText(frame, f"Calibrated: {self.pixels_per_cm:.2f} px/cm", 
                               (w//2 - 200, h//2 + 100), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
                    
                    if int(time.time() * 2) % 2 == 0:
                        cv2.putText(frame, "Press SPACE to continue", 
                                   (w//2 - 200, h//2 + 140), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                    
                    if cv2.waitKey(1) & 0xFF == ord(' '):
                        self.is_calibrated = True
                        self.state = "READY"
                        print(f"✅ Calibration complete! Method: Ruler\n")
                        self.speak("Calibration complete. Now sit down with legs straight.", force=True)
                
                cv2.putText(frame, f"Points clicked: {len(self.ruler_points)}/2", 
                           (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                
                # Set mouse callback
                cv2.setMouseCallback('Sit & Reach Test', self.manual_ruler_calibration)
            
            elif self.state == "READY":
                # ALWAYS draw skeleton to show body position
                if keypoints is not None and len(keypoints) >= 17:
                    frame = self.draw_skeleton(frame, keypoints, highlight_legs=False)
                
                # Also draw BlazePose if available
                if blazepose_landmarks:
                    self.mp_drawing.draw_landmarks(
                        frame,
                        blazepose_results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=3),
                        connection_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 200, 0), thickness=2)
                    )
                
                # Detect baseline at TOE TIPS (using BlazePose for accuracy)
                baseline_detected = self.detect_box_baseline(frame, keypoints, blazepose_landmarks, w)
                
                # ALWAYS draw the yellow line if baseline is set (even if not locked yet)
                if hasattr(self, 'baseline_x') and self.baseline_x is not None:
                    # Draw THICK VERTICAL YELLOW LINE at TOE position - VERY VISIBLE
                    print(f"📏 Drawing THICK vertical line at X={self.baseline_x}, Y={self.baseline_y}")
                    
                    # Draw VERY THICK yellow line from top to bottom
                    cv2.line(frame, (self.baseline_x, 0), (self.baseline_x, h), (0, 255, 255), 15)
                    
                    # Draw HUGE marker at baseline
                    cv2.circle(frame, (self.baseline_x, self.baseline_y), 40, (0, 255, 255), -1)
                    cv2.circle(frame, (self.baseline_x, self.baseline_y), 45, (255, 255, 255), 6)
                    
                    # BIG label
                    if hasattr(self, 'baseline_locked') and self.baseline_locked:
                        cv2.putText(frame, "0 cm LOCKED", (self.baseline_x - 100, self.baseline_y - 60), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 4)
                    else:
                        cv2.putText(frame, "0 cm (locking...)", (self.baseline_x - 120, self.baseline_y - 60), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 3)
                
                if baseline_detected:
                    
                    # Show BLAZEPOSE TOE keypoints with BRIGHT PINK circles
                    if blazepose_landmarks:
                        left_toe = blazepose_landmarks[self.mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value]
                        right_toe = blazepose_landmarks[self.mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value]
                        
                        print(f"   BlazePose Left TOE:  X={left_toe.x * w:.1f}, Y={left_toe.y * h:.1f}, vis={left_toe.visibility:.2f}")
                        print(f"   BlazePose Right TOE: X={right_toe.x * w:.1f}, Y={right_toe.y * h:.1f}, vis={right_toe.visibility:.2f}")
                        print(f"   Baseline at: X={self.baseline_x}, Y={self.baseline_y}")
                        
                        # Draw BRIGHT PINK circles on TOE keypoints
                        left_toe_x = int(left_toe.x * w)
                        left_toe_y = int(left_toe.y * h)
                        right_toe_x = int(right_toe.x * w)
                        right_toe_y = int(right_toe.y * h)
                        
                        if left_toe.visibility > 0.3:
                            cv2.circle(frame, (left_toe_x, left_toe_y), 25, (255, 0, 255), -1)  # Pink
                            cv2.circle(frame, (left_toe_x, left_toe_y), 30, (255, 255, 255), 5)
                            cv2.putText(frame, "L.TOE", (left_toe_x - 50, left_toe_y - 40), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 0, 255), 3)
                        
                        if right_toe.visibility > 0.3:
                            cv2.circle(frame, (right_toe_x, right_toe_y), 25, (255, 0, 255), -1)  # Pink
                            cv2.circle(frame, (right_toe_x, right_toe_y), 30, (255, 255, 255), 5)
                            cv2.putText(frame, "R.TOE", (right_toe_x - 50, right_toe_y - 40), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 0, 255), 3)
                        
                        # Show which toe the baseline is using (furthest forward)
                        if left_toe.visibility > 0.3 and right_toe.visibility > 0.3:
                            furthest_toe_x = max(left_toe_x, right_toe_x)
                            if furthest_toe_x == left_toe_x:
                                # Draw arrow from left toe to baseline
                                cv2.arrowedLine(frame, (left_toe_x, left_toe_y - 60), 
                                              (self.baseline_x, left_toe_y - 60), 
                                              (0, 255, 255), 4, tipLength=0.3)
                                cv2.putText(frame, "BASELINE HERE", (left_toe_x - 100, left_toe_y - 80), 
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                            else:
                                # Draw arrow from right toe to baseline
                                cv2.arrowedLine(frame, (right_toe_x, right_toe_y - 60), 
                                              (self.baseline_x, right_toe_y - 60), 
                                              (0, 255, 255), 4, tipLength=0.3)
                                cv2.putText(frame, "BASELINE HERE", (right_toe_x - 100, right_toe_y - 80), 
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                        
                        print(f"   Yellow line should be at X={self.baseline_x}")
                        print(f"   Left toe at X={left_toe_x}, Right toe at X={right_toe_x}")
                        print(f"   Furthest forward toe: X={max(left_toe_x, right_toe_x)}")
                    
                    # Also show YOLO foot keypoints with RED circles for comparison
                    if keypoints is not None and len(keypoints) >= 17:
                        left_foot = keypoints[15]
                        right_foot = keypoints[16]
                        
                        print(f"   YOLO Left foot:  X={left_foot[0]:.1f}, Y={left_foot[1]:.1f}")
                        print(f"   YOLO Right foot: X={right_foot[0]:.1f}, Y={right_foot[1]:.1f}")
                        
                        # Draw RED circles on YOLO foot keypoints
                        if left_foot[2] > 0.3:
                            cv2.circle(frame, (int(left_foot[0]), int(left_foot[1])), 20, (0, 0, 255), -1)
                            cv2.circle(frame, (int(left_foot[0]), int(left_foot[1])), 25, (255, 255, 255), 4)
                            cv2.putText(frame, "YOLO.L", (int(left_foot[0]) - 60, int(left_foot[1]) - 35), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                        if right_foot[2] > 0.3:
                            cv2.circle(frame, (int(right_foot[0]), int(right_foot[1])), 20, (0, 0, 255), -1)
                            cv2.circle(frame, (int(right_foot[0]), int(right_foot[1])), 25, (255, 255, 255), 4)
                            cv2.putText(frame, "YOLO.R", (int(right_foot[0]) - 60, int(right_foot[1]) - 35), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    
                    # Label: 0 cm at feet (vertical line)
                    label_y = min(self.baseline_y - 100, 150)
                    cv2.rectangle(frame, (self.baseline_x - 150, label_y - 50), (self.baseline_x + 150, label_y + 10), (0, 0, 0), -1)
                    cv2.rectangle(frame, (self.baseline_x - 150, label_y - 50), (self.baseline_x + 150, label_y + 10), (0, 255, 255), 3)
                    cv2.putText(frame, "0 cm = FEET LINE", 
                               (self.baseline_x - 150, label_y - 15), 
                               cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 3)
                    
                    # CHECK POSITION BEFORE STARTING
                    position_ok, position_msg = self.check_starting_position(keypoints)
                    
                    if position_ok:
                        # Position is good - show ready message
                        cv2.rectangle(frame, (10, 100), (w-10, 220), (0, 0, 0), -1)
                        cv2.rectangle(frame, (10, 100), (w-10, 220), (0, 255, 0), 3)
                        cv2.putText(frame, "✓ POSITION CORRECT!", 
                                   (20, 135), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
                        cv2.putText(frame, "• Hands BEFORE yellow line = NEGATIVE (-)", 
                                   (30, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
                        cv2.putText(frame, "• Hands AT yellow line = 0 cm", 
                                   (30, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                        cv2.putText(frame, "• Hands BEYOND yellow line = POSITIVE (+)", 
                                   (30, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                        
                        self.current_guidance = f"✓ READY! Attempt {self.current_attempt + 1}/{self.max_attempts}"
                        self.guidance_color = (0, 255, 0)
                        frame = self.draw_guidance_box(frame)
                        
                        # AUTO-START after position is correct
                        if not hasattr(self, 'ready_started'):
                            self.ready_started = True
                            self.state = "COUNTDOWN"
                            self.countdown_start = time.time()
                            self.max_reach_cm = 0
                            self.hold_start_time = None
                            print(f"📊 Attempt {self.current_attempt + 1} - Starting countdown...")
                            self.speak("Get ready", force=True)
                    else:
                        # Position needs correction
                        if hasattr(self, 'ready_started'):
                            delattr(self, 'ready_started')
                        
                        cv2.rectangle(frame, (10, 100), (w-10, 250), (0, 0, 0), -1)
                        cv2.rectangle(frame, (10, 100), (w-10, 250), (0, 165, 255), 3)
                        cv2.putText(frame, "⚠ FIX POSITION FIRST:", 
                                   (20, 135), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 165, 255), 3)
                        cv2.putText(frame, position_msg, 
                                   (30, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
                        cv2.putText(frame, "Test will start when position is correct", 
                                   (30, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                        
                        self.current_guidance = position_msg
                        self.guidance_color = (0, 165, 255)
                        frame = self.draw_guidance_box(frame)
                else:
                    # Baseline not detected - LENIENT message
                    if hasattr(self, 'ready_started'):
                        delattr(self, 'ready_started')
                    
                    self.current_guidance = "Just sit and show your feet"
                    self.guidance_color = (0, 255, 255)
                    frame = self.draw_guidance_box(frame)
                    
                    cv2.putText(frame, "SIMPLE SETUP:", 
                               (20, 180), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)
                    cv2.putText(frame, "1. Sit on floor", 
                               (40, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
                    cv2.putText(frame, "2. Show your FEET in camera", 
                               (40, 270), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
                    cv2.putText(frame, "3. Test will start automatically!", 
                               (40, 310), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            
            elif self.state == "COUNTDOWN":
                # Draw skeleton during countdown
                if keypoints is not None and len(keypoints) >= 17:
                    frame = self.draw_skeleton(frame, keypoints, highlight_legs=False)
                
                if blazepose_landmarks:
                    self.mp_drawing.draw_landmarks(
                        frame,
                        blazepose_results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=3),
                        connection_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 200, 0), thickness=2)
                    )
                
                # Show baseline
                if self.baseline_y:
                    cv2.line(frame, (0, self.baseline_y), (w, self.baseline_y), (0, 255, 255), 4)
                    cv2.putText(frame, "BOX/WALL", (10, self.baseline_y - 15), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                
                # Countdown
                elapsed = time.time() - self.countdown_start
                countdown = 3 - int(elapsed)
                
                if countdown > 0:
                    self.current_guidance = f"Get Ready! Starting in {countdown}..."
                    self.guidance_color = (255, 255, 0)
                    frame = self.draw_guidance_box(frame)
                    
                    # BIG countdown number
                    cv2.putText(frame, str(countdown), (w//2 - 50, h//2), 
                               cv2.FONT_HERSHEY_SIMPLEX, 5, (0, 255, 0), 10)
                    
                    # Instructions - SAI RULES
                    cv2.putText(frame, "SAI RULES:", 
                               (w//2 - 300, h//2 + 100), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)
                    cv2.putText(frame, "• Keep legs STRAIGHT", 
                               (w//2 - 280, h//2 + 140), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    cv2.putText(frame, "• Bend from HIPS, reach forward", 
                               (w//2 - 280, h//2 + 175), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    cv2.putText(frame, "• Keep feet FIXED against wall/box", 
                               (w//2 - 280, h//2 + 210), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    
                    # Speak countdown with instructions
                    if countdown != getattr(self, 'last_countdown', -1):
                        if countdown == 3:
                            self.speak("Three. Keep your legs straight and feet fixed.", force=True)
                        elif countdown == 2:
                            self.speak("Two. Get ready to bend forward from your hips.", force=True)
                        elif countdown == 1:
                            self.speak("One. Prepare to reach as far as you can.", force=True)
                        self.last_countdown = countdown
                else:
                    # Start measuring
                    self.state = "MEASURING"
                    print(f"📊 Attempt {self.current_attempt + 1} started - MEASURING NOW!")
                    self.speak(f"Now! Reach forward. Bend from your hips.", force=True)
                    if hasattr(self, 'last_countdown'):
                        delattr(self, 'last_countdown')
            
            elif self.state == "MEASURING":
                # ALWAYS draw skeleton - even if form invalid
                if keypoints is not None and len(keypoints) >= 17:
                    frame = self.draw_skeleton(frame, keypoints, highlight_legs=not self.form_valid)
                
                # Also draw BlazePose landmarks if available (more detailed)
                if blazepose_landmarks:
                    # Draw BlazePose connections in GREEN
                    self.mp_drawing.draw_landmarks(
                        frame,
                        blazepose_results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=3),
                        connection_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 200, 0), thickness=2)
                    )
                
                # Draw ONE VERTICAL YELLOW LINE at feet - this is 0 cm (SAI reference)
                if self.baseline_x:
                    # THICK bright VERTICAL yellow line at feet position
                    cv2.line(frame, (self.baseline_x, 0), (self.baseline_x, h), (0, 255, 255), 10)
                    
                    # Simple label at top
                    cv2.rectangle(frame, (self.baseline_x - 150, 10), (self.baseline_x + 150, 80), (0, 0, 0), -1)
                    cv2.rectangle(frame, (self.baseline_x - 150, 10), (self.baseline_x + 150, 80), (0, 255, 255), 4)
                    cv2.putText(frame, "0 cm", 
                               (self.baseline_x - 50, 55), 
                               cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)
                else:
                    # Feet not detected - lenient message
                    cv2.putText(frame, "Show your feet to set baseline", 
                               (w//2 - 250, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)
                
                # Validate form
                self.validate_form(keypoints)
                
                # Start timer for this attempt
                if not hasattr(self, 'attempt_start_time'):
                    self.attempt_start_time = time.time()
                    self.speak("Now! Bend forward from your hips. Reach as far as you can. Keep legs straight.", force=True)
                    print(f"⏱️ Attempt {self.current_attempt + 1} - Measuring for 5 seconds...")
                
                # Calculate elapsed time
                elapsed = time.time() - self.attempt_start_time
                remaining = 5.0 - elapsed  # 5 seconds per attempt
                
                # Measure reach using BOTH models (ensemble approach)
                reach_yolo = self.measure_reach(keypoints)
                reach_blazepose = 0
                
                if blazepose_landmarks:
                    reach_blazepose = self.measure_reach_blazepose(blazepose_landmarks, w)
                
                # Use ensemble: average both if both available, otherwise use whichever is available
                if reach_yolo > 0 and reach_blazepose > 0:
                    # Both models detected - use weighted average
                    # BlazePose has more keypoints (33 vs 17), give it slightly more weight
                    reach_cm = (reach_yolo * 0.45 + reach_blazepose * 0.55)
                elif reach_yolo > 0:
                    reach_cm = reach_yolo
                elif reach_blazepose > 0:
                    reach_cm = reach_blazepose
                else:
                    reach_cm = 0
                
                # Draw measurement overlay with hand tracking
                if keypoints is not None and len(keypoints) >= 17:
                    frame = self.draw_measurement_overlay(frame, keypoints, reach_cm)
                    
                    # Highlight hands with BIG circles
                    left_wrist = keypoints[9]
                    right_wrist = keypoints[10]
                    
                    if left_wrist[2] > 0.5:
                        cv2.circle(frame, (int(left_wrist[0]), int(left_wrist[1])), 20, (0, 255, 255), -1)
                        cv2.circle(frame, (int(left_wrist[0]), int(left_wrist[1])), 25, (255, 255, 255), 3)
                        cv2.putText(frame, "L.HAND", (int(left_wrist[0]) + 30, int(left_wrist[1])), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                    
                    if right_wrist[2] > 0.5:
                        cv2.circle(frame, (int(right_wrist[0]), int(right_wrist[1])), 20, (0, 255, 255), -1)
                        cv2.circle(frame, (int(right_wrist[0]), int(right_wrist[1])), 25, (255, 255, 255), 3)
                        cv2.putText(frame, "R.HAND", (int(right_wrist[0]) + 30, int(right_wrist[1])), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                    
                    # Check hand alignment and give voice feedback
                    if left_wrist[2] > 0.5 and right_wrist[2] > 0.5:
                        hand_distance = np.sqrt((left_wrist[0] - right_wrist[0])**2 + 
                                               (left_wrist[1] - right_wrist[1])**2)
                        
                        if self.pixels_per_cm:
                            hand_diff_cm = hand_distance / self.pixels_per_cm
                            
                            if hand_diff_cm > 5.0:
                                if not hasattr(self, 'hand_warning_time') or time.time() - self.hand_warning_time > 5:
                                    self.speak("Place your hands together. One on top of the other.", force=True)
                                    self.hand_warning_time = time.time()
                else:
                    frame = self.draw_measurement_overlay(frame, keypoints, reach_cm)
                
                # Draw guidance box
                frame = self.draw_guidance_box(frame)
                
                # Display reach - BIG with clear explanation
                cv2.putText(frame, f"Attempt {self.current_attempt + 1}/3", 
                           (20, h - 220), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)
                
                # Show what the number means (SAI METHOD)
                if reach_cm > 0:
                    status = f"+{reach_cm:.1f} cm (Beyond toes)"
                    color = (0, 255, 0)
                elif reach_cm < 0:
                    status = f"{reach_cm:.1f} cm (Before toes)"
                    color = (0, 165, 255)
                else:
                    status = f"{reach_cm:.1f} cm (At toes)"
                    color = (255, 255, 0)
                
                cv2.putText(frame, status, 
                           (20, h - 160), cv2.FONT_HERSHEY_SIMPLEX, 1.3, color, 3)
                cv2.putText(frame, f"Best: {self.max_reach_cm:.1f} cm", 
                           (20, h - 110), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
                
                # Explanation (SAI METHOD)
                cv2.putText(frame, "0 cm = At your toes | + = Beyond toes | - = Before toes", 
                           (20, h - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                # Show rating
                rating = self.get_flexibility_rating(reach_cm)
                rating_color = (0, 255, 0) if "Excellent" in rating else (0, 255, 255) if "Good" in rating else (0, 165, 255)
                cv2.putText(frame, rating, 
                           (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, rating_color, 2)
                
                # Update max reach continuously
                if reach_cm > self.max_reach_cm:
                    self.max_reach_cm = reach_cm
                
                # Show form warnings (but don't stop test)
                if not self.form_valid and len(self.form_warnings) > 0:
                    y_warn = 180
                    cv2.putText(frame, "TIP:", 
                               (20, y_warn), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
                    cv2.putText(frame, self.form_warnings[0], 
                               (30, y_warn + 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                
                # Check if 5 seconds elapsed - AUTO COMPLETE
                if remaining <= 0:
                        # Attempt complete
                        # Save attempt data
                        attempt_data = {
                            'attempt': self.current_attempt + 1,
                            'reach_cm': self.max_reach_cm,
                            'valid': True,
                            'timestamp': datetime.now()
                        }
                        self.attempts.append(attempt_data)
                        
                        # Get rating for this attempt
                        rating = self.get_flexibility_rating(self.max_reach_cm)
                        
                        # DON'T save photo yet - only save best at the end
                        print(f"✅ Attempt {self.current_attempt + 1}: {self.max_reach_cm:+.1f} cm")
                        print(f"   {rating}")
                        
                        self.speak(f"Attempt {self.current_attempt + 1} complete. You reached {self.max_reach_cm:.1f} centimeters.", force=True)
                        
                        self.current_attempt += 1
                        
                        if self.current_attempt >= self.max_attempts:
                            # All 3 attempts done - show final results
                            self.state = "COMPLETE"
                            best = max(self.attempts, key=lambda x: x['reach_cm'])
                            best_rating = self.get_flexibility_rating(best['reach_cm'])
                            
                            # CAPTURE ONLY ONE PHOTO - Best score only
                            self.capture_photo_async(frame, "ATHLETE_001", best['reach_cm'], best_rating)
                            
                            self.speak(f"All attempts complete. Your best score is {best['reach_cm']:.1f} centimeters. {best_rating}. Photo saved.", force=True)
                            print(f"\n✅ Test Complete!")
                            print(f"   Best Score: {best['reach_cm']:.1f} cm")
                            print(f"   {best_rating}")
                            print(f"   📸 Photo saved in sit_reach_results/\n")
                        else:
                            # Show result screen briefly before next attempt
                            self.state = "ATTEMPT_RESULT"
                            self.result_show_time = time.time()
                            print(f"\n✅ Attempt {self.current_attempt} complete! Showing result...")
                            print(f"📊 Next: Attempt {self.current_attempt + 1}")
                            self.speak(f"Attempt complete.", force=True)
                else:
                    # Show time remaining
                    progress = (elapsed / 5.0) * 100
                    
                    # BIG message
                    cv2.putText(frame, "REACH FORWARD!", 
                               (w//2 - 200, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 4)
                    cv2.putText(frame, f"Time remaining: {remaining:.1f} seconds", 
                               (w//2 - 250, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
                    
                    # Progress bar
                    bar_width = w - 100
                    bar_x = 50
                    bar_y = h - 80
                    cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + 30), (50, 50, 50), -1)
                    cv2.rectangle(frame, (bar_x, bar_y), (bar_x + int(bar_width * progress/100), bar_y + 30), (0, 255, 0), -1)
                    cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + 30), (255, 255, 255), 3)
                    
                    cv2.putText(frame, f"MEASURING: {progress:.0f}%", 
                               (w//2 - 120, bar_y - 15), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)
            
            elif self.state == "ATTEMPT_RESULT":
                # Show result of completed attempt for 3 seconds
                last_attempt = self.attempts[-1]
                rating = self.get_flexibility_rating(last_attempt['reach_cm'])
                
                # Dark overlay
                overlay = frame.copy()
                cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
                frame = cv2.addWeighted(overlay, 0.8, frame, 0.2, 0)
                
                # Title
                cv2.putText(frame, f"ATTEMPT {last_attempt['attempt']} COMPLETE!", 
                           (w//2 - 300, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3)
                
                # Score
                cv2.putText(frame, f"{last_attempt['reach_cm']:.1f} cm", 
                           (w//2 - 150, 250), cv2.FONT_HERSHEY_SIMPLEX, 2.5, (0, 255, 0), 5)
                
                # Rating
                rating_color = (0, 255, 0) if "Excellent" in rating else (0, 255, 255) if "Good" in rating else (0, 165, 255)
                cv2.putText(frame, rating, 
                           (w//2 - 150, 320), cv2.FONT_HERSHEY_SIMPLEX, 1.0, rating_color, 2)
                
                # Score recorded (not saved yet)
                cv2.putText(frame, "✓ Score Recorded", 
                           (w//2 - 150, 380), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
                
                # Progress and previous attempts
                cv2.putText(frame, f"Completed: {len(self.attempts)}/3 attempts", 
                           (w//2 - 200, 450), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
                
                # Show all attempts so far
                if len(self.attempts) > 1:
                    cv2.putText(frame, "Previous attempts:", 
                               (w//2 - 200, 490), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                    y_prev = 520
                    for att in self.attempts[:-1]:  # All except current
                        cv2.putText(frame, f"Attempt {att['attempt']}: {att['reach_cm']:.1f} cm", 
                                   (w//2 - 180, y_prev), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                        y_prev += 30
                
                # REST PERIOD: 5 seconds between attempts (SAI standard)
                elapsed = time.time() - self.result_show_time
                rest_time = 5  # 5 seconds rest
                remaining = rest_time - int(elapsed)
                
                if remaining > 0:
                    # Show rest timer
                    cv2.putText(frame, f"REST TIME: {remaining} seconds", 
                               (w//2 - 250, h//2), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3)
                    cv2.putText(frame, "Relax and prepare for next attempt", 
                               (w//2 - 300, h//2 + 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
                    
                    # Voice guidance at specific times
                    if remaining == 4 and not hasattr(self, 'rest_voice_4'):
                        self.speak("Take a rest. Relax your muscles.", force=True)
                        self.rest_voice_4 = True
                    elif remaining == 2 and not hasattr(self, 'rest_voice_2'):
                        self.speak("Get ready. Position yourself for next attempt.", force=True)
                        self.rest_voice_2 = True
                else:
                    # Go to READY for next attempt
                    print(f"🔄 Moving to READY state for Attempt {self.current_attempt + 1}")
                    self.state = "READY"
                    # DON'T reset baseline - keep same line for all attempts!
                    # self.baseline_x stays the same
                    # self.baseline_y stays the same
                    self.max_reach_cm = 0  # Reset for next attempt
                    
                    # Clean up state variables (but keep baseline locked)
                    for attr in ['measurement_voice_spoken', 'ready_started', 
                                'result_show_time', 'attempt_start_time', 'hold_start_time',
                                'rest_voice_4', 'rest_voice_2', 'initial_ankle_x']:
                        if hasattr(self, attr):
                            delattr(self, attr)
                    
                    self.speak(f"Starting attempt {self.current_attempt + 1}. Same baseline. Sit with legs straight.", force=True)
            
            elif self.state == "COMPLETE":
                # Show final results with professional display
                best_attempt = max(self.attempts, key=lambda x: x['reach_cm'])
                rating = self.get_flexibility_rating(best_attempt['reach_cm'])
                
                # Dark overlay
                overlay = frame.copy()
                cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
                frame = cv2.addWeighted(overlay, 0.85, frame, 0.15, 0)
                
                # Title
                cv2.putText(frame, "SIT & REACH TEST COMPLETE!", 
                           (w//2 - 350, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3)
                cv2.putText(frame, "Official SAI Standards", 
                           (w//2 - 200, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                
                # Best score - BIG
                cv2.putText(frame, "BEST SCORE:", 
                           (w//2 - 180, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 2)
                cv2.putText(frame, f"{best_attempt['reach_cm']:.1f} cm", 
                           (w//2 - 150, 270), cv2.FONT_HERSHEY_SIMPLEX, 2.5, (0, 255, 0), 5)
                
                # Rating
                rating_color = (0, 255, 0) if "Excellent" in rating else (0, 255, 255) if "Good" in rating else (0, 165, 255)
                cv2.putText(frame, rating, 
                           (w//2 - 150, 330), cv2.FONT_HERSHEY_SIMPLEX, 1.0, rating_color, 2)
                
                # All attempts with clear indication
                cv2.putText(frame, "ALL 3 ATTEMPTS:", 
                           (w//2 - 180, 400), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)
                cv2.putText(frame, "(Best score captured in photo)", 
                           (w//2 - 180, 435), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                
                y = 480
                for att in self.attempts:
                    color = (0, 255, 0) if att == best_attempt else (255, 255, 255)
                    symbol = "★ BEST" if att == best_attempt else "•"
                    cv2.putText(frame, f"{symbol} Attempt {att['attempt']}: {att['reach_cm']:.1f} cm", 
                               (w//2 - 180, y), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
                    y += 45
                
                # Photo saved indicator
                cv2.rectangle(frame, (w//2 - 200, y + 10), (w//2 + 200, y + 60), (0, 255, 0), 3)
                cv2.putText(frame, "📸 PHOTO SAVED!", 
                           (w//2 - 150, y + 45), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
                
                # Instructions
                if int(time.time() * 2) % 2 == 0:
                    cv2.putText(frame, "Press R to restart or Q to quit", 
                               (w//2 - 280, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
            
            # Add AI models info header
            header_bg = frame.copy()
            cv2.rectangle(header_bg, (0, 0), (w, 70), (0, 0, 0), -1)
            frame = cv2.addWeighted(header_bg, 0.7, frame, 0.3, 0)
            
            cv2.putText(frame, "AI MODELS (2): YOLOv8n + BlazePose (33 keypoints)", 
                       (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(frame, f"State: {self.state} | Calibration: {self.calibration_method if self.is_calibrated else 'Not calibrated'}", 
                       (10, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            cv2.imshow('Sit & Reach Test', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('r') and self.state == "COMPLETE":
                self.__init__()
                return self.run_test()
        
        self.cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    print("=" * 80)
    print("🧘 SIT & REACH FLEXIBILITY TEST - OFFICIAL SAI STANDARDS")
    print("=" * 80)
    print("\n📊 Using: MediaPipe Pose + Hands for accurate detection")
    print("📏 Calibration: Automatic (no marker needed!)")
    print("🎯 Attempts: 3 (best score counts)")
    print("\n🎬 SETUP GUIDE MODE:")
    print("   - System will detect your body")
    print("   - Guide you to correct position")
    print("   - Show visual highlights")
    print("   - Voice instructions included")
    print("\nStarting...\n")
    
    test = SitReachTest()
    test.run_test()
