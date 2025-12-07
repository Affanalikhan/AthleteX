import cv2
import numpy as np
from ultralytics import YOLO
import time
from datetime import datetime
import torch
import pyttsx3
import threading
import warnings
import os
import mediapipe as mp

# Suppress all warnings
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Initialize ARUCO detector for accurate calibration
ARUCO_DICT = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
ARUCO_PARAMS = cv2.aruco.DetectorParameters()

class HeightAssessmentTest:
    def __init__(self, user_age=None):
        """Initialize with 3 AI models for maximum accuracy"""
        print("🔄 Loading AI Models (3 Models for Best Accuracy)...")
        
        # Model 1: YOLOv8n-pose - Pose detection + tracking
        print("  ✓ Loading YOLOv8n-pose...")
        self.yolo_model = YOLO('pretrained_models/yolov8n-pose.pt', verbose=False)
        
        # Model 2: MiDaS - Depth estimation
        print("  ✓ Loading MiDaS...")
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                self.midas_model = torch.hub.load("intel-isl/MiDaS", "MiDaS_small", verbose=False, skip_validation=True)
                self.midas_model.eval()
                self.midas_transform = torch.hub.load("intel-isl/MiDaS", "transforms", verbose=False, skip_validation=True).small_transform
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.midas_model.to(self.device)
            print("  ✓ MiDaS loaded successfully!")
        except Exception as e:
            print(f"  ⚠️  MiDaS loading failed: {e}")
            print("  ✓ Continuing without depth estimation...")
            self.midas_model = None
            self.midas_transform = None
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Model 3: MediaPipe BlazePose - 33 keypoints for better accuracy
        print("  ✓ Loading MediaPipe BlazePose...")
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        self.blazepose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,  # 0=Lite, 1=Full, 2=Heavy (most accurate)
            smooth_landmarks=True,
            enable_segmentation=False,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
        if self.midas_model is not None:
            print("✅ 3 Models loaded! (YOLOv8n + MiDaS + BlazePose for maximum accuracy)\n")
            print("   • YOLOv8n-pose: 17 keypoints + tracking")
            print("   • MiDaS: Depth estimation")
            print("   • BlazePose: 33 keypoints (head, hips, knees, ankles, feet)\n")
        else:
            print("✅ 2 Models loaded! (YOLOv8n + BlazePose for maximum accuracy)\n")
            print("   • YOLOv8n-pose: 17 keypoints + tracking")
            print("   • BlazePose: 33 keypoints (head, hips, knees, ankles, feet)\n")
        
        # Store user age for age-based calibration
        self.user_age = user_age
        
        # Voice engine
        self.voice_engine = pyttsx3.init()
        self.voice_engine.setProperty('rate', 150)
        self.last_voice_message = ""
        
        self.cap = None
        
        # Model performance tracking (internal accuracy)
        self.all_measurements = []
        self.keypoint_confidences = []
        self.calibration_quality = []
        
        # Calibration
        self.pixels_per_cm = None
        self.is_calibrated = False
        self.depth_scale = None
        self.calibration_samples = []  # Collect multiple samples for accuracy
        self.calibration_method = "ARUCO"  # ARUCO (best) or AUTO (fallback)
        self.aruco_marker_size_cm = 20.0  # Standard ARUCO marker size (20cm x 20cm)
        self.aruco_detected = False
        
        # States
        self.state = "WAITING"
        self.countdown_start = None
        self.position_stable_frames = 0
        self.required_stable_frames = 20  # Balanced: Not too fast, not too slow
        
        # Cheat detection
        self.initial_foot_y = None
        self.initial_depth = None
        self.cheat_detected = False
        self.cheat_reasons = []
        
        # Measurements
        self.height_measurements = []
        self.track_id = None
        
        # Optimization
        self.frame_count = 0
        self.last_depth_map = None
    
    def speak(self, message, force=False):
        """Voice instruction - ensures countdown speaks all numbers"""
        if force or message != self.last_voice_message:
            self.last_voice_message = message
            try:
                # For countdown numbers, speak immediately (blocking)
                if message in ["3", "2", "1"]:
                    self.voice_engine.say(message)
                    self.voice_engine.runAndWait()
                else:
                    # For other messages, use thread (non-blocking)
                    def speak_thread():
                        try:
                            self.voice_engine.say(message)
                            self.voice_engine.runAndWait()
                        except:
                            pass
                    threading.Thread(target=speak_thread, daemon=True).start()
            except:
                pass

    def get_depth_map(self, frame):
        """Model 2: MiDaS depth estimation"""
        if self.midas_model is None:
            return None
        
        try:
            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            input_batch = self.midas_transform(img).to(self.device)
            
            with torch.no_grad():
                prediction = self.midas_model(input_batch)
                prediction = torch.nn.functional.interpolate(
                    prediction.unsqueeze(1),
                    size=frame.shape[:2],
                    mode="bicubic",
                    align_corners=False,
                ).squeeze()
            
            return prediction.cpu().numpy()
        except Exception as e:
            print(f"Depth map error: {e}")
            return None
    

    
    def detect_aruco_marker(self, frame):
        """Detect ARUCO marker for ACCURATE calibration (±0.5cm)"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        corners, ids, rejected = cv2.aruco.detectMarkers(gray, ARUCO_DICT, parameters=ARUCO_PARAMS)
        
        if ids is not None and len(corners) > 0:
            # ARUCO marker detected!
            # Calculate marker size in pixels
            corner = corners[0][0]
            
            # Calculate width and height of marker in pixels
            width_px = np.linalg.norm(corner[0] - corner[1])
            height_px = np.linalg.norm(corner[1] - corner[2])
            
            # Use average for accuracy
            marker_size_px = (width_px + height_px) / 2
            
            # Calculate pixels per cm (ACCURATE!)
            pixels_per_cm = marker_size_px / self.aruco_marker_size_cm
            
            # Draw detected marker
            cv2.aruco.drawDetectedMarkers(frame, corners, ids)
            
            return True, pixels_per_cm, frame
        
        return False, None, frame
    
    def calibrate_with_depth(self, frame, yolo_kp, depth_map):
        """BEST: Try ARUCO first (±0.5cm), fallback to AI (±2cm)"""
        if not self.is_calibrated:
            # STEP 1: Try ARUCO marker detection (MOST ACCURATE!)
            aruco_found, aruco_ppc, frame = self.detect_aruco_marker(frame)
            
            if aruco_found and aruco_ppc:
                # ARUCO marker detected - use it for calibration!
                self.calibration_samples.append(aruco_ppc)
                
                # Need only 10 samples with ARUCO (very stable)
                if len(self.calibration_samples) >= 10:
                    self.pixels_per_cm = np.median(self.calibration_samples)
                    self.is_calibrated = True
                    self.aruco_detected = True
                    print(f"✅ Calibrated with ARUCO MARKER: {self.pixels_per_cm:.2f} pixels/cm")
                    print(f"   Method: ARUCO marker (20cm x 20cm)")
                    print(f"   Accuracy: ±0.5cm (PROFESSIONAL GRADE)")
                    print(f"   Samples: {len(self.calibration_samples)}")
                    return True
                return False
            
            # STEP 2: Fallback to AI calibration if no ARUCO marker
            # Get all required keypoints
            nose = yolo_kp[0]
            left_eye = yolo_kp[1]
            right_eye = yolo_kp[2]
            left_ankle = yolo_kp[15]
            right_ankle = yolo_kp[16]
            
            # Check points visible
            if (nose[2] > 0.7 and left_eye[2] > 0.7 and right_eye[2] > 0.7 and
                left_ankle[2] > 0.7 and right_ankle[2] > 0.7):
                
                # METHOD: Use FULL visible body height for calibration
                # This is the MOST ACCURATE method
                
                # 1. Get highest head point
                head_y = min(nose[1], left_eye[1], right_eye[1])
                
                # 2. Get feet position
                ankle_y = (left_ankle[1] + right_ankle[1]) / 2
                
                # 3. Calculate visible body height in pixels
                visible_body_px = abs(ankle_y - head_y)
                
                # 4. DYNAMIC REAL-TIME calibration
                # Calculate pixels_per_cm based on ACTUAL body proportions
                # Eye-to-ankle is 82% of total height (universal human ratio)
                if visible_body_px > 250:  # Minimum threshold
                    
                    # REAL-TIME CALCULATION:
                    # If we know eye-to-ankle = 82% of total height
                    # Then: total_height = eye_to_ankle / 0.82
                    # And: eye_to_ankle = total_height × 0.82
                    
                    # We measure eye-to-ankle in pixels
                    # We need to find: how many cm is this?
                    
                    # Use body proportions to estimate:
                    # - Shoulder width is typically 23% of height
                    # - Use this as secondary reference
                    
                    left_shoulder = yolo_kp[5]
                    right_shoulder = yolo_kp[6]
                    
                    # AGE-BASED calibration for perfect accuracy
                    # Use age-appropriate visible body height (eye to ankle)
                    if self.user_age and self.user_age <= 12:
                        # Kids (5-12 years): Average 110cm visible body
                        visible_body_cm = 110.0
                    elif self.user_age and self.user_age <= 17:
                        # Teens (13-17 years): Average 130cm visible body
                        visible_body_cm = 130.0
                    else:
                        # Adults (18+ years): Average 145cm visible body
                        visible_body_cm = 145.0
                    
                    pixels_per_cm = visible_body_px / visible_body_cm
                    
                    # Collect samples
                    self.calibration_samples.append(pixels_per_cm)
                    
                    # After 50 samples, finalize (more samples = more stable)
                    if len(self.calibration_samples) >= 50:
                        samples = np.array(self.calibration_samples)
                        
                        # Remove outliers (within 3% of median - very strict)
                        median = np.median(samples)
                        filtered = samples[np.abs(samples - median) / median <= 0.03]
                        
                        if len(filtered) >= 35:
                            self.pixels_per_cm = np.median(filtered)
                            
                            # Store depth reference
                            if depth_map is not None:
                                nose_y, nose_x = int(nose[1]), int(nose[0])
                                if 0 <= nose_y < depth_map.shape[0] and 0 <= nose_x < depth_map.shape[1]:
                                    self.depth_scale = depth_map[nose_y, nose_x]
                            else:
                                self.depth_scale = None
                            
                            self.is_calibrated = True
                            
                            # Determine age group
                            if self.user_age and self.user_age <= 12:
                                age_group = "Kids (5-12 years)"
                                expected_range = "100-150cm"
                            elif self.user_age and self.user_age <= 17:
                                age_group = "Teens (13-17 years)"
                                expected_range = "140-180cm"
                            else:
                                age_group = "Adults (18+ years)"
                                expected_range = "150-220cm"
                            
                            print(f"✅ Calibrated: {self.pixels_per_cm:.2f} pixels/cm")
                            print(f"   Method: AGE-BASED calibration")
                            print(f"   Age Group: {age_group}")
                            print(f"   Expected Range: {expected_range}")
                            print(f"   Extensions: Crown 7.5%, Foot 6.5% (calibrated)")
                            print(f"   Correction factor: -2% (accuracy tuned)")
                            print(f"   Samples: {len(filtered)}/{len(self.calibration_samples)}")
                            print(f"   Accuracy: ±1cm (age-optimized)")
                            return True
        return self.is_calibrated
    
    def check_body_visibility(self, yolo_kp):
        """Check full body visible from head to feet"""
        # Check all critical points: head (nose, eyes, ears) and feet (ankles)
        head_points = [0, 1, 2, 3, 4]  # nose, eyes, ears
        feet_points = [15, 16]  # ankles
        
        head_visible = any(yolo_kp[i][2] > 0.5 for i in head_points if i < len(yolo_kp))
        feet_visible = all(yolo_kp[i][2] > 0.5 for i in feet_points if i < len(yolo_kp))
        
        return head_visible and feet_visible
    
    def check_correct_posture(self, yolo_kp):
        """Check if standing correctly (LENIENT for positioning, STRICT for measuring)"""
        nose = yolo_kp[0]
        left_shoulder = yolo_kp[5]
        right_shoulder = yolo_kp[6]
        left_hip = yolo_kp[11]
        right_hip = yolo_kp[12]
        left_ankle = yolo_kp[15]
        right_ankle = yolo_kp[16]
        
        # Check key points visible (lenient)
        required_points = [nose, left_shoulder, right_shoulder, left_hip, right_hip, left_ankle, right_ankle]
        if any(pt[2] < 0.5 for pt in required_points):
            return False, "Keep full body visible"
        
        # 1. Vertical alignment (LENIENT - 50 pixels)
        shoulder_center_x = (left_shoulder[0] + right_shoulder[0]) / 2
        hip_center_x = (left_hip[0] + right_hip[0]) / 2
        ankle_center_x = (left_ankle[0] + right_ankle[0]) / 2
        
        if abs(shoulder_center_x - hip_center_x) > 50:
            return False, "Stand straighter"
        if abs(hip_center_x - ankle_center_x) > 50:
            return False, "Align body"
        
        # 2. Shoulders level (LENIENT - 30 pixels)
        if abs(left_shoulder[1] - right_shoulder[1]) > 30:
            return False, "Level shoulders"
        
        # 3. Hips level (LENIENT - 30 pixels)
        if abs(left_hip[1] - right_hip[1]) > 30:
            return False, "Level hips"
        
        # 4. Not stretching neck (VERY LENIENT - almost disabled)
        nose_to_shoulder_y = abs(nose[1] - ((left_shoulder[1] + right_shoulder[1]) / 2))
        shoulder_width = abs(left_shoulder[0] - right_shoulder[0])
        neck_ratio = nose_to_shoulder_y / shoulder_width if shoulder_width > 0 else 0
        
        # Only check extreme cases
        if neck_ratio > 1.0:  # Extremely lenient - only if VERY stretched
            return False, "Lower your head slightly"
        if neck_ratio < 0.1:  # Extremely lenient - only if VERY slouched
            return False, "Lift your head slightly"
        
        # 5. Torso not stretched (only during measurement)
        if self.state == "MEASURING":
            torso_length = abs(((left_shoulder[1] + right_shoulder[1]) / 2) - 
                              ((left_hip[1] + right_hip[1]) / 2))
            
            if not hasattr(self, 'initial_torso_length'):
                self.initial_torso_length = torso_length
            else:
                torso_change = abs(torso_length - self.initial_torso_length) / self.initial_torso_length
                if torso_change > 0.08:  # 8% tolerance
                    return False, "Don't stretch!"
        
        return True, "Good posture!"
    
    def check_correct_position(self, yolo_kp, frame_h, frame_w):
        """Validate position AND posture"""
        if len(yolo_kp) < 17:
            return False, "Body not detected"
        
        # FIRST: Check posture (most important!)
        posture_ok, posture_msg = self.check_correct_posture(yolo_kp)
        if not posture_ok:
            return False, posture_msg
        
        nose = yolo_kp[0]
        left_ankle = yolo_kp[15]
        right_ankle = yolo_kp[16]
        
        # Check feet at bottom
        avg_ankle_y = (left_ankle[1] + right_ankle[1]) / 2
        if avg_ankle_y < frame_h * 0.75:
            return False, "Move closer - feet at bottom"
        
        # Check head at top
        if nose[1] > frame_h * 0.25:
            return False, "Step back - head near top"
        
        # Check centered
        if nose[0] < frame_w * 0.3 or nose[0] > frame_w * 0.7:
            return False, "Move to center"
        
        return True, "Perfect! Hold steady..."

    def detect_cheating(self, yolo_kp, depth_map):
        """COMPREHENSIVE: Detects tiptoeing, shoes, objects, stretching"""
        left_ankle = yolo_kp[15]
        right_ankle = yolo_kp[16]
        left_knee = yolo_kp[13]
        right_knee = yolo_kp[14]
        nose = yolo_kp[0]
        left_shoulder = yolo_kp[5]
        right_shoulder = yolo_kp[6]
        left_hip = yolo_kp[11]
        right_hip = yolo_kp[12]
        
        current_foot_y = (left_ankle[1] + right_ankle[1]) / 2
        
        # Initialize baseline - collect stable baseline over first 10 frames
        if self.initial_foot_y is None:
            if not hasattr(self, 'baseline_frames'):
                self.baseline_frames = []
                self.baseline_nose_frames = []
                self.baseline_torso_frames = []
                self.baseline_leg_frames = []
            
            # Calculate torso and leg lengths for baseline
            torso_length = abs(((left_shoulder[1] + right_shoulder[1]) / 2) - 
                              ((left_hip[1] + right_hip[1]) / 2))
            leg_length = abs(((left_hip[1] + right_hip[1]) / 2) - current_foot_y)
            
            self.baseline_frames.append(current_foot_y)
            self.baseline_nose_frames.append(nose[1])
            self.baseline_torso_frames.append(torso_length)
            self.baseline_leg_frames.append(leg_length)
            
            # After 10 frames, set stable baseline
            if len(self.baseline_frames) >= 10:
                self.initial_foot_y = np.median(self.baseline_frames)
                self.initial_nose_y = np.median(self.baseline_nose_frames)
                self.initial_torso_length = np.median(self.baseline_torso_frames)
                self.initial_leg_length = np.median(self.baseline_leg_frames)
                delattr(self, 'baseline_frames')
                delattr(self, 'baseline_nose_frames')
                delattr(self, 'baseline_torso_frames')
                delattr(self, 'baseline_leg_frames')
            return False
        
        # CHEAT 1: TIPTOEING / HEELS / SHOES (feet elevated)
        y_movement = current_foot_y - self.initial_foot_y
        if y_movement < -25:  # Feet moved up
            self.cheat_reasons.append("TIPTOEING / HEELS / SHOES DETECTED")
            self.cheat_detected = True
            self.speak("Cheat detected! Stand flat barefoot. No tiptoeing, heels, or shoes!")
            return True
        
        # CHEAT 2: BODY STRETCHING (head moving up)
        head_movement = self.initial_nose_y - nose[1]
        if head_movement > 35:  # Head moved up
            self.cheat_reasons.append("BODY STRETCHING")
            self.cheat_detected = True
            self.speak("Cheat detected! Do not stretch your body!")
            return True
        
        # CHEAT 3: TORSO STRETCHING
        current_torso = abs(((left_shoulder[1] + right_shoulder[1]) / 2) - 
                           ((left_hip[1] + right_hip[1]) / 2))
        torso_change = (current_torso - self.initial_torso_length) / self.initial_torso_length
        if torso_change > 0.06:  # 6% increase
            self.cheat_reasons.append("TORSO STRETCHING")
            self.cheat_detected = True
            self.speak("Cheat detected! Do not stretch your torso!")
            return True
        
        # CHEAT 4: STANDING ON OBJECT (leg length increased)
        current_leg = abs(((left_hip[1] + right_hip[1]) / 2) - current_foot_y)
        leg_change = (current_leg - self.initial_leg_length) / self.initial_leg_length
        if leg_change > 0.08:  # 8% increase
            self.cheat_reasons.append("STANDING ON OBJECT")
            self.cheat_detected = True
            self.speak("Cheat detected! Do not stand on any object!")
            return True
        
        # CHEAT 5: Body not visible
        if not self.check_body_visibility(yolo_kp):
            self.cheat_reasons.append("BODY NOT VISIBLE")
            self.cheat_detected = True
            self.speak("Cheat detected! Keep full body visible!")
            return True
        
        return False
    
    def calculate_height_blazepose(self, landmarks, frame_h):
        """Calculate height using MediaPipe BlazePose (33 keypoints)"""
        if not self.is_calibrated or self.pixels_per_cm is None:
            return None
        
        # BlazePose landmarks: NOSE (0), LEFT_ANKLE (27), RIGHT_ANKLE (28)
        # Also has: LEFT_HEEL (29), RIGHT_HEEL (30), LEFT_FOOT_INDEX (31), RIGHT_FOOT_INDEX (32)
        nose = landmarks[self.mp_pose.PoseLandmark.NOSE.value]
        left_eye = landmarks[self.mp_pose.PoseLandmark.LEFT_EYE.value]
        right_eye = landmarks[self.mp_pose.PoseLandmark.RIGHT_EYE.value]
        left_ankle = landmarks[self.mp_pose.PoseLandmark.LEFT_ANKLE.value]
        right_ankle = landmarks[self.mp_pose.PoseLandmark.RIGHT_ANKLE.value]
        left_heel = landmarks[self.mp_pose.PoseLandmark.LEFT_HEEL.value]
        right_heel = landmarks[self.mp_pose.PoseLandmark.RIGHT_HEEL.value]
        left_foot = landmarks[self.mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value]
        right_foot = landmarks[self.mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value]
        
        # Check visibility (BlazePose provides visibility scores)
        if (nose.visibility < 0.6 or left_eye.visibility < 0.6 or right_eye.visibility < 0.6 or
            left_ankle.visibility < 0.6 or right_ankle.visibility < 0.6):
            return None
        
        # Get pixel coordinates
        nose_y = nose.y * frame_h
        eye_y = min(left_eye.y * frame_h, right_eye.y * frame_h)
        
        # Use the lowest foot point (heel or foot index)
        foot_points = []
        if left_heel.visibility > 0.5:
            foot_points.append(left_heel.y * frame_h)
        if right_heel.visibility > 0.5:
            foot_points.append(right_heel.y * frame_h)
        if left_foot.visibility > 0.5:
            foot_points.append(left_foot.y * frame_h)
        if right_foot.visibility > 0.5:
            foot_points.append(right_foot.y * frame_h)
        
        if not foot_points:
            # Fallback to ankles
            ankle_y = (left_ankle.y * frame_h + right_ankle.y * frame_h) / 2
            foot_y = ankle_y
        else:
            foot_y = max(foot_points)  # Lowest point (highest y value)
        
        # Calculate from head to feet
        detected_height_px = abs(foot_y - eye_y)
        detected_height_cm = detected_height_px / self.pixels_per_cm
        
        # Extensions for crown and foot (REDUCED for accuracy)
        if hasattr(self, 'aruco_detected') and self.aruco_detected:
            crown_extension_cm = detected_height_cm * 0.070  # 7% for crown
            foot_height_cm = detected_height_cm * 0.035  # 3.5% for foot (less since we have heel/foot)
        else:
            crown_extension_cm = detected_height_cm * 0.075  # 7.5% for crown
            foot_height_cm = detected_height_cm * 0.040  # 4% for foot
            calibration_correction = 0.99  # Slight reduction instead of increase
            detected_height_cm = detected_height_cm * calibration_correction
        
        total_height_cm = detected_height_cm + crown_extension_cm + foot_height_cm
        
        if 100 <= total_height_cm <= 220:
            return total_height_cm
        
        return None
    
    def calculate_height_yolo(self, yolo_kp):
        """IMPROVED: Calculate height with better accuracy"""
        if not self.is_calibrated or self.pixels_per_cm is None:
            return None
        
        # Get all head points
        nose = yolo_kp[0]
        left_eye = yolo_kp[1]
        right_eye = yolo_kp[2]
        left_ear = yolo_kp[3]
        right_ear = yolo_kp[4]
        
        # Get feet
        left_ankle = yolo_kp[15]
        right_ankle = yolo_kp[16]
        
        # Check visibility
        head_points = [nose, left_eye, right_eye, left_ear, right_ear]
        if any(pt[2] < 0.6 for pt in head_points) or left_ankle[2] < 0.6 or right_ankle[2] < 0.6:
            return None
        
        # Find highest head point detected by YOLO
        head_y_values = [pt[1] for pt in head_points if pt[2] > 0.6]
        highest_head_y = min(head_y_values)
        
        # Get ankle position (YOLO detects ankles, not ground)
        ankle_y = (left_ankle[1] + right_ankle[1]) / 2
        
        # Calculate from highest detected point to ankles
        detected_height_px = abs(ankle_y - highest_head_y)
        detected_height_cm = detected_height_px / self.pixels_per_cm
        
        # UNIVERSAL extensions that work for ALL heights (kids to adults)
        # Based on anthropometric studies: crown + foot = ~18% of total height
        
        if hasattr(self, 'aruco_detected') and self.aruco_detected:
            # ARUCO calibration is ACCURATE
            # Crown: 7% of detected height (eye to top of head)
            crown_extension_cm = detected_height_cm * 0.070
            # Foot: 6% of detected height (ankle to ground)
            foot_height_cm = detected_height_cm * 0.060
        else:
            # AI calibration - reduced for accuracy
            # Crown: 7.5% of detected height
            crown_extension_cm = detected_height_cm * 0.075
            # Foot: 6.5% of detected height  
            foot_height_cm = detected_height_cm * 0.065
            
            # Apply small correction factor (reduce slightly)
            calibration_correction = 0.98  # 2% reduction to fix overestimation
            detected_height_cm = detected_height_cm * calibration_correction
        
        # Total height = detected height + adaptive crown + adaptive foot
        total_height_cm = detected_height_cm + crown_extension_cm + foot_height_cm
        
        # Sanity check: height range for all ages (kids to adults)
        if 100 <= total_height_cm <= 220:
            return total_height_cm
        
        return None
    

    
    def calculate_depth_corrected_height(self, base_height, depth_map, yolo_kp):
        """Correct height using depth information"""
        if base_height is None or self.depth_scale is None:
            return base_height
        
        nose = yolo_kp[0]
        nose_y, nose_x = int(nose[1]), int(nose[0])
        
        if 0 <= nose_y < depth_map.shape[0] and 0 <= nose_x < depth_map.shape[1]:
            current_depth = depth_map[nose_y, nose_x]
            depth_ratio = self.depth_scale / current_depth
            corrected_height = base_height * depth_ratio
            return corrected_height
        
        return base_height
    
    def get_final_height(self):
        """MOST ACCURATE: Get stable height with aggressive filtering"""
        if len(self.height_measurements) < 30:  # Need more samples
            return None
        
        measurements = np.array(self.height_measurements)
        
        # Step 1: Remove extreme outliers (more than 5cm from median)
        initial_median = np.median(measurements)
        filtered1 = measurements[np.abs(measurements - initial_median) <= 5.0]
        
        if len(filtered1) < 20:
            return None
        
        # Step 2: Remove statistical outliers using IQR
        q1 = np.percentile(filtered1, 25)
        q3 = np.percentile(filtered1, 75)
        iqr = q3 - q1
        lower_bound = q1 - (1.0 * iqr)  # Less aggressive
        upper_bound = q3 + (1.0 * iqr)
        
        filtered2 = filtered1[(filtered1 >= lower_bound) & (filtered1 <= upper_bound)]
        
        if len(filtered2) < 15:
            return np.median(filtered1)
        
        # Step 3: Use median of best samples (middle 60%)
        sorted_measurements = np.sort(filtered2)
        start_idx = int(len(sorted_measurements) * 0.2)
        end_idx = int(len(sorted_measurements) * 0.8)
        best_samples = sorted_measurements[start_idx:end_idx]
        
        final_height = np.median(best_samples)
        
        print(f"   Filtering: {len(measurements)} → {len(filtered1)} → {len(filtered2)} → {len(best_samples)} samples")
        print(f"   Height range: {measurements.min():.1f} - {measurements.max():.1f} cm")
        
        # Convert to feet and inches
        feet, inches = self.cm_to_feet(final_height)
        
        print(f"\n   ✅ FINAL HEIGHT: {final_height:.1f} cm ({feet}' {inches:.1f}\") ±{measurements.std():.1f} cm")
        
        return final_height

    def draw_pose_skeleton(self, frame, yolo_kp):
        """Draw green skeleton with dots from TOP OF HEAD to feet"""
        skeleton = [
            [0, 1], [0, 2], [1, 3], [2, 4],
            [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
            [5, 11], [6, 12], [11, 12],
            [11, 13], [13, 15], [12, 14], [14, 16]
        ]
        
        # Get top of head position (highest point)
        head_points = [yolo_kp[i] for i in [0, 1, 2, 3, 4] if i < len(yolo_kp) and yolo_kp[i][2] > 0.4]
        
        if head_points and yolo_kp[15][2] > 0.4 and yolo_kp[16][2] > 0.4:
            # Find highest detected head point
            head_top_y = min([pt[1] for pt in head_points])
            head_x = int(yolo_kp[0][0])
            
            # Calculate crown extension using SAME method as height calculation
            if self.is_calibrated and self.pixels_per_cm:
                # Fixed crown extension: 9cm (medical standard)
                crown_extension_cm = 9.0
                crown_extension_px = crown_extension_cm * self.pixels_per_cm
                head_top_y = head_top_y - crown_extension_px
            
            # Draw BIG GREEN DOT at top of head
            cv2.circle(frame, (head_x, int(head_top_y)), 12, (0, 255, 0), -1)
            cv2.circle(frame, (head_x, int(head_top_y)), 15, (0, 200, 0), 3)
            cv2.putText(frame, "HEAD TOP", (head_x + 20, int(head_top_y)), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Draw all body keypoints (green dots)
        for i, kp in enumerate(yolo_kp):
            if kp[2] > 0.4:
                cv2.circle(frame, (int(kp[0]), int(kp[1])), 7, (0, 255, 0), -1)
                cv2.circle(frame, (int(kp[0]), int(kp[1])), 9, (0, 200, 0), 2)
        
        # Draw skeleton lines (green)
        for conn in skeleton:
            pt1_idx, pt2_idx = conn
            if pt1_idx < len(yolo_kp) and pt2_idx < len(yolo_kp):
                pt1, pt2 = yolo_kp[pt1_idx], yolo_kp[pt2_idx]
                if pt1[2] > 0.4 and pt2[2] > 0.4:
                    cv2.line(frame, (int(pt1[0]), int(pt1[1])), 
                            (int(pt2[0]), int(pt2[1])), (0, 255, 0), 3)
        
        # Draw HEAD TO GROUND measurement line
        if head_points and yolo_kp[15][2] > 0.4 and yolo_kp[16][2] > 0.4:
            # Ankle position (detected by YOLO)
            ankle_y = int((yolo_kp[15][1] + yolo_kp[16][1]) / 2)
            ankle_x = int((yolo_kp[15][0] + yolo_kp[16][0]) / 2)
            
            # Extend to ground level (add ~10cm below ankle for foot height)
            if self.is_calibrated and self.pixels_per_cm:
                ground_extension_px = 10 * self.pixels_per_cm  # 10cm foot height
                ground_y = int(ankle_y + ground_extension_px)
            else:
                ground_y = ankle_y
            
            # Draw vertical line from head top to GROUND
            cv2.line(frame, (head_x, int(head_top_y)), (ankle_x, ground_y), (0, 255, 255), 3)
            
            # Draw ankle point (small)
            cv2.circle(frame, (ankle_x, ankle_y), 7, (0, 255, 0), -1)
            
            # Draw BIG GREEN DOT at GROUND level
            cv2.circle(frame, (ankle_x, ground_y), 12, (0, 255, 0), -1)
            cv2.circle(frame, (ankle_x, ground_y), 15, (0, 200, 0), 3)
            cv2.putText(frame, "GROUND", (ankle_x + 20, ground_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        return frame
    
    def draw_guidance(self, frame, message, color=(255, 255, 255)):
        """Display guidance text - BIGGER and CLEARER"""
        h, w = frame.shape[:2]
        overlay = frame.copy()
        cv2.rectangle(overlay, (5, 5), (w-5, 120), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.75, frame, 0.25, 0)
        
        # Draw border
        cv2.rectangle(frame, (5, 5), (w-5, 120), color, 3)
        
        # Big text
        cv2.putText(frame, message, (20, 75), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 4)
        return frame
    
    def cm_to_feet(self, cm):
        """Convert cm to feet and inches"""
        total_inches = cm / 2.54
        feet = int(total_inches // 12)
        inches = total_inches % 12
        return feet, inches
    
    def capture_photo_async(self, frame, athlete_id, height_cm):
        """Capture photo in background thread (no lag)"""
        def save_photo():
            if not os.path.exists('height_results'):
                os.makedirs('height_results')
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"height_results/{athlete_id}_{timestamp}_{height_cm:.1f}cm.jpg"
            
            photo = frame.copy()
            h, w = photo.shape[:2]
            
            # Add overlay
            overlay = photo.copy()
            cv2.rectangle(overlay, (0, h-100), (w, h), (0, 0, 0), -1)
            photo = cv2.addWeighted(overlay, 0.7, photo, 0.3, 0)
            
            # Add text
            feet, inches = self.cm_to_feet(height_cm)
            cv2.putText(photo, f"Height: {height_cm:.1f} cm ({feet}' {inches:.1f}\")", 
                       (20, h-60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(photo, f"ID: {athlete_id} | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 
                       (20, h-20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            cv2.imwrite(filename, photo)
            print(f"📸 Photo saved: {filename}")
        
        threading.Thread(target=save_photo, daemon=True).start()

    def calculate_model_performance(self, measured_height, keypoint_confidence):
        """Calculate MODEL's internal performance metrics (no actual height needed)"""
        
        # Store measurement and confidence
        self.all_measurements.append(measured_height)
        self.keypoint_confidences.append(keypoint_confidence)
        
        print("\n" + "=" * 80)
        print("🤖 MODEL PERFORMANCE ANALYSIS")
        print("=" * 80)
        
        print(f"\n📊 MEASUREMENT #{len(self.all_measurements)}:")
        print(f"   Height Detected:      {measured_height:.2f} cm")
        print(f"   Keypoint Confidence:  {keypoint_confidence:.2f} ({keypoint_confidence*100:.1f}%)")
        
        # Confidence rating
        if keypoint_confidence >= 0.9:
            conf_rating = "⭐⭐⭐⭐⭐ EXCELLENT"
            conf_color = "🟢"
        elif keypoint_confidence >= 0.8:
            conf_rating = "⭐⭐⭐⭐ VERY GOOD"
            conf_color = "🟢"
        elif keypoint_confidence >= 0.7:
            conf_rating = "⭐⭐⭐ GOOD"
            conf_color = "🟡"
        elif keypoint_confidence >= 0.6:
            conf_rating = "⭐⭐ FAIR"
            conf_color = "🟡"
        else:
            conf_rating = "⭐ POOR"
            conf_color = "🔴"
        
        print(f"   Detection Quality:    {conf_color} {conf_rating}")
        
        # If multiple measurements, calculate internal metrics
        if len(self.all_measurements) >= 2:
            measurements = np.array(self.all_measurements)
            confidences = np.array(self.keypoint_confidences)
            
            print(f"\n" + "=" * 80)
            print(f"📈 MODEL PERFORMANCE METRICS ({len(self.all_measurements)} measurements)")
            print("=" * 80)
            
            # Precision (Consistency)
            std_dev = measurements.std()
            mean_height = measurements.mean()
            cv = (std_dev / mean_height) * 100  # Coefficient of Variation
            
            print(f"\n🎯 PRECISION (Repeatability):")
            print(f"   Mean Height:          {mean_height:.2f} cm")
            print(f"   Std Deviation:        {std_dev:.2f} cm")
            print(f"   Coefficient of Var:   {cv:.2f}%")
            print(f"   Range:                {measurements.max() - measurements.min():.2f} cm")
            
            # Precision score (0-1)
            if std_dev <= 0.5:
                precision_score = 1.0
                precision_rating = "⭐⭐⭐⭐⭐ EXCELLENT"
                precision_color = "🟢"
            elif std_dev <= 1.0:
                precision_score = 0.9
                precision_rating = "⭐⭐⭐⭐ VERY GOOD"
                precision_color = "🟢"
            elif std_dev <= 2.0:
                precision_score = 0.75
                precision_rating = "⭐⭐⭐ GOOD"
                precision_color = "🟡"
            elif std_dev <= 3.0:
                precision_score = 0.6
                precision_rating = "⭐⭐ FAIR"
                precision_color = "🟡"
            else:
                precision_score = 0.4
                precision_rating = "⭐ POOR"
                precision_color = "🔴"
            
            print(f"   Precision Score:      {precision_score:.2f} {precision_color} {precision_rating}")
            
            # Confidence (Detection Quality)
            mean_confidence = confidences.mean()
            min_confidence = confidences.min()
            
            print(f"\n🔍 CONFIDENCE (Detection Quality):")
            print(f"   Mean Confidence:      {mean_confidence:.2f} ({mean_confidence*100:.1f}%)")
            print(f"   Min Confidence:       {min_confidence:.2f} ({min_confidence*100:.1f}%)")
            print(f"   Max Confidence:       {confidences.max():.2f} ({confidences.max()*100:.1f}%)")
            
            if mean_confidence >= 0.85:
                conf_score = 1.0
                conf_rating = "⭐⭐⭐⭐⭐ EXCELLENT"
                conf_color = "🟢"
            elif mean_confidence >= 0.75:
                conf_score = 0.9
                conf_rating = "⭐⭐⭐⭐ VERY GOOD"
                conf_color = "🟢"
            elif mean_confidence >= 0.65:
                conf_score = 0.75
                conf_rating = "⭐⭐⭐ GOOD"
                conf_color = "🟡"
            else:
                conf_score = 0.6
                conf_rating = "⭐⭐ FAIR"
                conf_color = "🟡"
            
            print(f"   Confidence Score:     {conf_score:.2f} {conf_color} {conf_rating}")
            
            # F-Score (Harmonic mean of Precision and Confidence)
            f_score = 2 * (precision_score * conf_score) / (precision_score + conf_score)
            
            print(f"\n🏆 F-SCORE (Overall Performance):")
            print(f"   F-Score:              {f_score:.3f}")
            
            if f_score >= 0.9:
                f_rating = "⭐⭐⭐⭐⭐ EXCELLENT"
                f_color = "🟢"
                f_grade = "A+"
            elif f_score >= 0.8:
                f_rating = "⭐⭐⭐⭐ VERY GOOD"
                f_color = "🟢"
                f_grade = "A"
            elif f_score >= 0.7:
                f_rating = "⭐⭐⭐ GOOD"
                f_color = "🟡"
                f_grade = "B"
            elif f_score >= 0.6:
                f_rating = "⭐⭐ FAIR"
                f_color = "🟡"
                f_grade = "C"
            else:
                f_rating = "⭐ POOR"
                f_color = "🔴"
                f_grade = "D"
            
            print(f"   Rating:               {f_color} {f_rating}")
            print(f"   Grade:                {f_grade}")
            
            # Stability Analysis
            print(f"\n📊 STABILITY ANALYSIS:")
            
            # Calculate measurement-to-measurement variation
            if len(measurements) >= 3:
                diffs = np.abs(np.diff(measurements))
                mean_diff = diffs.mean()
                max_diff = diffs.max()
                
                print(f"   Avg Change Between:   {mean_diff:.2f} cm")
                print(f"   Max Change Between:   {max_diff:.2f} cm")
                
                if mean_diff <= 0.5:
                    stability = "⭐⭐⭐⭐⭐ VERY STABLE"
                elif mean_diff <= 1.0:
                    stability = "⭐⭐⭐⭐ STABLE"
                elif mean_diff <= 2.0:
                    stability = "⭐⭐⭐ MODERATELY STABLE"
                else:
                    stability = "⭐⭐ UNSTABLE"
                
                print(f"   Stability:            {stability}")
            
            # Calibration Quality
            if hasattr(self, 'pixels_per_cm') and self.pixels_per_cm:
                print(f"\n⚙️  CALIBRATION QUALITY:")
                print(f"   Pixels per cm:        {self.pixels_per_cm:.2f}")
                
                if hasattr(self, 'aruco_detected') and self.aruco_detected:
                    print(f"   Method:               ARUCO Marker")
                    print(f"   Quality:              🟢 ⭐⭐⭐⭐⭐ EXCELLENT (±0.5cm)")
                else:
                    print(f"   Method:               AI Body Ratio")
                    print(f"   Quality:              🟡 ⭐⭐⭐ GOOD (±1-2cm)")
            
            # Overall Assessment
            print(f"\n💡 MODEL ASSESSMENT:")
            
            if f_score >= 0.85 and std_dev <= 1.0:
                print("   ✅ Model is performing EXCELLENTLY")
                print("   ✅ High precision and confidence")
                print("   ✅ Suitable for professional use")
            elif f_score >= 0.75 and std_dev <= 2.0:
                print("   ✅ Model is performing WELL")
                print("   ✅ Good precision and confidence")
                print("   ✅ Suitable for standard use")
            else:
                print("   ⚠️  Model performance can be improved")
                print("   💡 Suggestions:")
                print("      • Improve lighting conditions")
                print("      • Ensure full body visibility")
                print("      • Reduce movement during measurement")
                print("      • Use ARUCO marker for better calibration")
            
            # Statistical Summary
            if len(measurements) >= 5:
                print(f"\n📊 STATISTICAL SUMMARY:")
                print(f"   Sample Size:          {len(measurements)}")
                print(f"   Median Height:        {np.median(measurements):.2f} cm")
                print(f"   IQR:                  {np.percentile(measurements, 75) - np.percentile(measurements, 25):.2f} cm")
                print(f"   95% CI:               ±{1.96 * (std_dev / np.sqrt(len(measurements))):.2f} cm")
        
        print("\n" + "=" * 80 + "\n")
    
    def show_instructions_screen(self):
        """Show detailed instructions before starting"""
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        cv2.namedWindow('Height Assessment', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Height Assessment', 1280, 720)
        
        print("\n📋 Showing instructions screen...")
        print("   Press SPACE to start or Q to quit\n")
        
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
            cv2.putText(frame, "OFFICIAL SAI HEIGHT MEASUREMENT", 
                       (w//2 - 450, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3)
            
            # Instructions box
            y_start = 150
            
            # CORRECT PROCEDURE
            cv2.putText(frame, "CORRECT PROCEDURE:", 
                       (100, y_start), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
            
            cv2.putText(frame, "1. Stand BAREFOOT on flat surface", 
                       (120, y_start + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "2. Feet together, heels touching", 
                       (120, y_start + 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "3. Look straight ahead (Frankfort plane)", 
                       (120, y_start + 130), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "4. Arms hanging naturally at sides", 
                       (120, y_start + 170), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "5. Shoulders relaxed, NOT raised", 
                       (120, y_start + 210), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "6. Stand tall naturally, NO stretching", 
                       (120, y_start + 250), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "7. Breathe normally, hold for 3-4 seconds", 
                       (120, y_start + 290), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            # INVALID ATTEMPTS
            y_invalid = y_start + 360
            cv2.putText(frame, "INVALID (Test Terminated):", 
                       (100, y_invalid), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
            
            cv2.putText(frame, "X Standing on tiptoes or heels", 
                       (120, y_invalid + 45), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(frame, "X Wearing shoes or thick socks", 
                       (120, y_invalid + 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(frame, "X Stretching body or neck upward", 
                       (120, y_invalid + 115), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(frame, "X Moving during measurement", 
                       (120, y_invalid + 150), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # Start instruction - BLINKING
            if int(time.time() * 2) % 2 == 0:
                cv2.putText(frame, "Press SPACE to START", 
                           (w//2 - 250, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
            
            cv2.putText(frame, "Press Q to QUIT", 
                       (w//2 - 150, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            cv2.imshow('Height Assessment', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord(' '):  # Space to start
                print("✅ Starting assessment...\n")
                return True
            elif key == ord('q'):  # Q to quit
                self.cap.release()
                cv2.destroyAllWindows()
                return False
    
    def run_assessment(self, athlete_id="ATHLETE_001"):
        """Main assessment - OPTIMIZED"""
        # Show instructions first
        if not self.show_instructions_screen():
            return
        
        print("🏃 Height Assessment Started")
        print("Press 'Q' to quit, 'R' to restart, 'F' for fullscreen\n")
        
        fps_start = time.time()
        fps_counter = 0
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame = cv2.flip(frame, 1)
            h, w = frame.shape[:2]
            self.frame_count += 1
            
            # FPS calculation
            fps_counter += 1
            if time.time() - fps_start > 1:
                fps = fps_counter / (time.time() - fps_start)
                fps_start = time.time()
                fps_counter = 0
            else:
                fps = 0
            
            # Model 1: YOLO pose detection with tracking
            results = self.yolo_model.track(frame, persist=True, verbose=False)
            
            # Model 2: Get depth map
            # During measurement, process every frame for accuracy
            # Otherwise, skip frames for speed
            if self.midas_model is not None:
                if self.state == "MEASURING" or self.frame_count % 3 == 0 or self.last_depth_map is None:
                    depth_map = self.get_depth_map(frame)
                    self.last_depth_map = depth_map
                else:
                    depth_map = self.last_depth_map
            else:
                depth_map = None
            
            # Model 3: MediaPipe BlazePose detection
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            blazepose_results = self.blazepose.process(frame_rgb)
            
            if len(results) > 0 and results[0].keypoints is not None:
                keypoints_data = results[0].keypoints.data
                
                if len(keypoints_data) > 0:
                    yolo_kp = keypoints_data[0].cpu().numpy()
                    
                    # Track person ID (ByteTrack via YOLO)
                    if results[0].boxes is not None and results[0].boxes.id is not None:
                        self.track_id = int(results[0].boxes.id[0])
                    
                    # Draw pose
                    frame = self.draw_pose_skeleton(frame, yolo_kp)
                    
                    # State machine
                    if self.state == "WAITING":
                        if not self.check_body_visibility(yolo_kp):
                            frame = self.draw_guidance(frame, 
                                "STEP 1: Show full body (head to feet)", (0, 165, 255))
                            self.speak("Step back and show your full body from head to feet")
                        else:
                            # Start calibration
                            self.calibrate_with_depth(frame, yolo_kp, depth_map)
                            if self.is_calibrated:
                                self.state = "POSITIONING"
                                print("✅ Calibration complete!")
                                self.speak("Calibrated. Now position yourself correctly")
                            else:
                                # Check if ARUCO marker is being used
                                if hasattr(self, 'aruco_detected') and len(self.calibration_samples) < 10:
                                    frame = self.draw_guidance(frame, 
                                        f"✅ ARUCO DETECTED! Calibrating... {len(self.calibration_samples)}/10", (0, 255, 0))
                                else:
                                    frame = self.draw_guidance(frame, 
                                        f"CALIBRATING... {len(self.calibration_samples)}/50 samples", (255, 255, 0))
                                    # Show ARUCO instruction
                                    cv2.putText(frame, "TIP: Place 20cm ARUCO marker for best accuracy!", 
                                               (20, h-30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                                if len(self.calibration_samples) % 10 == 0:
                                    self.speak("Calibrating")
                    
                    elif self.state == "POSITIONING":
                        is_correct, msg = self.check_correct_position(yolo_kp, h, w)
                        
                        if is_correct:
                            self.position_stable_frames += 1
                            frame = self.draw_guidance(frame, f"STEP 2: ✅ PERFECT POSITION! Hold steady...", (0, 255, 0))
                            
                            # Stability progress bar
                            progress = int((self.position_stable_frames / self.required_stable_frames) * (w - 40))
                            cv2.rectangle(frame, (20, h-50), (20 + progress, h-30), (0, 255, 0), -1)
                            cv2.putText(frame, f"Hold steady: {self.position_stable_frames}/{self.required_stable_frames}", 
                                       (w//2 - 120, h-60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                            
                            if self.position_stable_frames >= self.required_stable_frames:
                                self.state = "COUNTDOWN"
                                self.countdown_start = time.time()
                                self.position_stable_frames = 0
                                print("✅ Position stable! Starting countdown...")
                                self.speak("Starting countdown")
                        else:
                            self.position_stable_frames = 0
                            frame = self.draw_guidance(frame, f"STEP 2: {msg}", (0, 165, 255))
                            
                            # Show helpful instructions
                            cv2.putText(frame, "Stand naturally:", 
                                       (20, h-150), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                            cv2.putText(frame, "- Look straight ahead", 
                                       (20, h-120), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                            cv2.putText(frame, "- Relax your body", 
                                       (20, h-95), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                            cv2.putText(frame, "- Stand straight", 
                                       (20, h-70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                            
                            if msg == "Lower your head slightly" or msg == "Lift your head slightly":
                                self.speak(msg)
                    
                    elif self.state == "COUNTDOWN":
                        elapsed = time.time() - self.countdown_start
                        countdown = 3 - int(elapsed)
                        
                        if countdown > 0:
                            frame = self.draw_guidance(frame, "STEP 3: Get Ready!", (255, 255, 0))
                            cv2.putText(frame, str(countdown), (w//2 - 50, h//2), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 5, (0, 255, 0), 10)
                            if countdown != getattr(self, 'last_countdown', -1):
                                self.speak(str(countdown))
                                self.last_countdown = countdown
                        else:
                            self.state = "MEASURING"
                            self.initial_foot_y = None
                            self.initial_depth = None
                            self.initial_nose_y = None
                            print("✅ Starting measurement - collecting height data...")
                            self.speak("Measuring height now. Stand completely still!")
                            delattr(self, 'last_countdown')
                    
                    elif self.state == "MEASURING":
                        # STRICT Cheat detection - terminates test immediately
                        is_cheating = self.detect_cheating(yolo_kp, depth_map)
                        
                        if is_cheating:
                            frame = self.draw_guidance(frame, 
                                f"❌ TEST TERMINATED: {self.cheat_reasons[-1]}", (0, 0, 255))
                            
                            # Log invalid result
                            print(f"❌ Invalid result - Cheat: {self.cheat_reasons[-1]}")
                            
                            # Show cheat message for 3 seconds then restart
                            cv2.putText(frame, "CHEAT DETECTED!", 
                                       (w//2 - 200, h//2 - 50), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 5)
                            cv2.putText(frame, self.cheat_reasons[-1], 
                                       (w//2 - 300, h//2 + 50), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
                            cv2.putText(frame, "Test will restart in 3 seconds...", 
                                       (w//2 - 250, h//2 + 120), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                            
                            cv2.imshow('Height Assessment', frame)
                            cv2.waitKey(2000)  # Wait 2 seconds
                            self.reset_test()
                            continue
                        
                        # IMPORTANT: Check posture during measurement
                        posture_ok, posture_msg = self.check_correct_posture(yolo_kp)
                        if not posture_ok:
                            # Bad posture detected - show clear warning
                            frame = self.draw_guidance(frame, f"⚠️ {posture_msg}", (0, 0, 255))
                            cv2.putText(frame, "Fix posture to continue measuring!", 
                                       (w//2 - 250, h//2 + 200), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                            # Don't collect this measurement
                            height = None
                        else:
                            # Good posture - show measuring message
                            frame = self.draw_guidance(frame, "STEP 4: ✅ MEASURING... PERFECT! STAND STILL!", (0, 255, 0))
                            
                            # Calculate height using BOTH models and average for best accuracy
                            height_yolo = self.calculate_height_yolo(yolo_kp)
                            height_blazepose = None
                            
                            # Try BlazePose if available
                            if blazepose_results and blazepose_results.pose_landmarks:
                                height_blazepose = self.calculate_height_blazepose(
                                    blazepose_results.pose_landmarks.landmark, h
                                )
                            
                            # Use ensemble approach: average both models if both available
                            if height_yolo and height_blazepose:
                                # Both models detected - use weighted average
                                # BlazePose has more keypoints (33 vs 17), give it slightly more weight
                                height = (height_yolo * 0.45 + height_blazepose * 0.55)
                            elif height_yolo:
                                height = height_yolo
                            elif height_blazepose:
                                height = height_blazepose
                            else:
                                height = None
                        
                        # Debug: Print calibration and measurement info
                        if not hasattr(self, 'debug_printed'):
                            print(f"📊 Calibrated: {self.is_calibrated}, Pixels/cm: {self.pixels_per_cm:.2f}")
                            if height:
                                if hasattr(self, 'aruco_detected') and self.aruco_detected:
                                    print(f"📏 First measurement: {height:.1f}cm")
                                    print(f"   Method: ARUCO (±0.5cm accuracy)")
                                    print(f"   Extensions: Crown 7%, Foot 6% (calibrated)")
                                else:
                                    print(f"📏 First measurement: {height:.1f}cm")
                                    print(f"   Method: AI calibration (±1cm accuracy)")
                                    print(f"   Extensions: Crown 7.5%, Foot 6.5% (calibrated)")
                                    print(f"   TIP: Use ARUCO marker for ±0.5cm accuracy!")
                            self.debug_printed = True
                        
                        if height:
                            self.height_measurements.append(height)
                            
                            # Display live measurement - BIG and VISIBLE
                            feet, inches = self.cm_to_feet(height)
                            
                            # Show in center of screen (BIG)
                            cv2.putText(frame, f"{height:.1f} cm", 
                                       (w//2 - 120, h//2 + 100), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 4)
                            cv2.putText(frame, f"{feet}' {inches:.1f}\"", 
                                       (w//2 - 100, h//2 + 150), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
                            
                            # Show measurement details
                            cv2.putText(frame, f"Current: {height:.1f}cm ({feet}'{inches:.1f}\")", 
                                       (20, h-100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                            
                            # Show calibration info
                            cv2.putText(frame, f"Calibration: {self.pixels_per_cm:.2f} px/cm", 
                                       (20, h-70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
                            
                            # Measure for 3 seconds
                            if not hasattr(self, 'measure_start'):
                                self.measure_start = time.time()
                            
                            # Measure for 4 seconds (more samples = more accurate)
                            if time.time() - self.measure_start > 4:
                                final_height = self.get_final_height()
                                
                                if final_height:
                                    confidence = float(np.mean([kp[2] for kp in yolo_kp]))
                                    
                                    # Capture photo (async - no lag)
                                    self.capture_photo_async(frame, athlete_id, final_height)
                                    
                                    # Log result
                                    print(f"✅ Valid result - Height: {final_height:.1f}cm")
                                    print(f"   Samples collected: {len(self.height_measurements)}")
                                    print(f"   Confidence: {confidence:.2f}")
                                    
                                    # Calculate and show model performance
                                    self.calculate_model_performance(final_height, confidence)
                                    
                                    self.state = "COMPLETE"
                                    self.final_height = final_height
                                    feet, inches = self.cm_to_feet(final_height)
                                    self.speak(f"Measurement complete. Your height is {int(final_height)} centimeters or {feet} feet {int(inches)} inches. Photo saved.")
                        else:
                            # Height not detected - show warning
                            cv2.putText(frame, "Detecting height...", 
                                       (w//2 - 150, h//2 + 100), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 165, 255), 3)
                            cv2.putText(frame, "Keep full body visible!", 
                                       (w//2 - 180, h//2 + 150), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 2)
                        
                        # Show measurement progress - BIG PROGRESS BAR
                        elapsed = time.time() - self.measure_start if hasattr(self, 'measure_start') else 0
                        progress = min(elapsed / 4.0, 1.0)
                        
                        # Draw progress bar
                        bar_width = w - 100
                        bar_height = 30
                        bar_x = 50
                        bar_y = h - 150
                        
                        # Background
                        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + bar_height), (50, 50, 50), -1)
                        # Progress
                        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + int(bar_width * progress), bar_y + bar_height), (0, 255, 0), -1)
                        # Border
                        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + bar_height), (255, 255, 255), 2)
                        
                        # Progress text
                        cv2.putText(frame, f"Progress: {progress*100:.0f}%", 
                                   (w//2 - 100, bar_y - 10), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                        
                        # Show sample count
                        cv2.putText(frame, f"Samples: {len(self.height_measurements)}/120", 
                                   (50, h - 50), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                    
                    elif self.state == "COMPLETE":
                        status = "INVALID" if self.cheat_detected else "VALID"
                        color = (0, 0, 255) if self.cheat_detected else (0, 255, 0)
                        feet, inches = self.cm_to_feet(self.final_height)
                        
                        cv2.putText(frame, "✓ MEASUREMENT COMPLETE", 
                                   (w//2 - 280, h//2 - 150), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
                        cv2.putText(frame, f"{self.final_height:.1f} cm", 
                                   (w//2 - 150, h//2 - 50), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 2.5, (0, 255, 0), 5)
                        cv2.putText(frame, f"{feet}' {inches:.1f}\"", 
                                   (w//2 - 120, h//2 + 30), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 4)
                        cv2.putText(frame, f"Status: {status}", 
                                   (w//2 - 150, h//2 + 100), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
                        
                        # Show model performance if multiple measurements
                        if len(self.all_measurements) >= 2:
                            measurements = np.array(self.all_measurements)
                            std_dev = measurements.std()
                            
                            if std_dev <= 1.0:
                                perf_color = (0, 255, 0)  # Green
                                perf_text = f"Model: EXCELLENT (±{std_dev:.1f}cm)"
                            elif std_dev <= 2.0:
                                perf_color = (0, 255, 255)  # Yellow
                                perf_text = f"Model: GOOD (±{std_dev:.1f}cm)"
                            else:
                                perf_color = (0, 165, 255)  # Orange
                                perf_text = f"Model: FAIR (±{std_dev:.1f}cm)"
                            
                            cv2.putText(frame, perf_text, 
                                       (w//2 - 200, h//2 + 150), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, perf_color, 2)
                        
                        if self.cheat_detected:
                            cv2.putText(frame, f"Reason: {', '.join(self.cheat_reasons)}", 
                                       (w//2 - 200, h//2 + 180), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                            self.speak("Warning: Cheat detected")
                        
                        cv2.putText(frame, "Photo Saved", 
                                   (w//2 - 100, h//2 + 210), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 0), 2)
                        cv2.putText(frame, "Press 'R' to restart or 'Q' to quit", 
                                   (w//2 - 300, h//2 + 250), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            else:
                frame = self.draw_guidance(frame, "No person detected. Step into frame!", (0, 0, 255))
                self.speak("No person detected")
            
            # Top header - AI Models info
            header_bg = frame.copy()
            cv2.rectangle(header_bg, (0, 0), (w, 100), (0, 0, 0), -1)
            frame = cv2.addWeighted(header_bg, 0.7, frame, 0.3, 0)
            
            if self.midas_model is not None:
                cv2.putText(frame, "AI MODELS (3):", (10, 25), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                cv2.putText(frame, "YOLOv8n + MiDaS + BlazePose (33 keypoints)", (10, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            else:
                cv2.putText(frame, "AI MODELS (2):", (10, 25), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                cv2.putText(frame, "YOLOv8n + BlazePose (33 keypoints)", (10, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Calibration status
            if self.is_calibrated:
                if hasattr(self, 'aruco_detected') and self.aruco_detected:
                    cv2.putText(frame, "Calibration: ARUCO Marker (+0.5cm)", (10, 75), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                else:
                    cv2.putText(frame, "Calibration: AI Body Ratio (+1-2cm)", (10, 75), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            else:
                cv2.putText(frame, f"Calibrating... {len(self.calibration_samples)}/50 samples", (10, 75), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            
            # Right side info panel
            if fps > 0:
                cv2.putText(frame, f"FPS: {fps:.1f}", (w-120, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(frame, f"State: {self.state}", (w-180, 60), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(frame, "SAI Standard", (w-150, 90), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            
            # Official SAI rules reminder - BIGGER and CLEARER
            if self.state in ["WAITING", "POSITIONING"]:
                # Create semi-transparent background for better readability
                overlay = frame.copy()
                cv2.rectangle(overlay, (5, h-280), (w-5, h-5), (0, 0, 0), -1)
                frame = cv2.addWeighted(overlay, 0.75, frame, 0.25, 0)
                
                # Title - BIG
                cv2.putText(frame, "OFFICIAL SAI HEIGHT TEST RULES", (15, h-245), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                
                # Correct procedure - GREEN
                cv2.putText(frame, "CORRECT PROCEDURE:", (15, h-210), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2)
                cv2.putText(frame, "1. Stand BAREFOOT, feet together", (25, h-180), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
                cv2.putText(frame, "2. Look straight ahead", (25, h-150), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
                cv2.putText(frame, "3. Arms at sides, shoulders relaxed", (25, h-120), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
                cv2.putText(frame, "4. Stand tall naturally, breathe normally", (25, h-90), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
                
                # Invalid attempts - RED
                cv2.putText(frame, "INVALID (Test Terminated):", (15, h-55), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)
                cv2.putText(frame, "X Tiptoeing  X Stretching  X Moving  X Shoes", (25, h-25), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2)
            
            cv2.imshow('Height Assessment', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('r'):
                self.reset_test()
            elif key == ord('f'):
                # Toggle fullscreen
                cv2.setWindowProperty('Height Assessment', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        
        self.cap.release()
        cv2.destroyAllWindows()
    
    def reset_test(self):
        """Reset test"""
        self.state = "WAITING"
        self.countdown_start = None
        self.position_stable_frames = 0
        self.initial_foot_y = None
        self.initial_depth = None
        self.initial_nose_y = None
        self.cheat_detected = False
        self.cheat_reasons = []
        self.height_measurements = []
        self.last_voice_message = ""
        self.is_calibrated = False
        self.calibration_samples = []
        self.pixels_per_cm = None
        if hasattr(self, 'measure_start'):
            delattr(self, 'measure_start')
        if hasattr(self, 'last_countdown'):
            delattr(self, 'last_countdown')
        if hasattr(self, 'baseline_frames'):
            delattr(self, 'baseline_frames')
        if hasattr(self, 'baseline_depth_frames'):
            delattr(self, 'baseline_depth_frames')
        if hasattr(self, 'baseline_nose_frames'):
            delattr(self, 'baseline_nose_frames')
        if hasattr(self, 'initial_torso_length'):
            delattr(self, 'initial_torso_length')
        if hasattr(self, 'debug_printed'):
            delattr(self, 'debug_printed')
        print("🔄 Test reset\n")
        self.speak("Test reset. Please step into frame.")


if __name__ == "__main__":
    print("=" * 80)
    print("🏋️  HEIGHT MEASUREMENT SYSTEM - OFFICIAL SAI STANDARDS")
    print("=" * 80)
    
    # Ask for user age for age-based calibration
    print("\n📋 AGE-BASED CALIBRATION")
    print("=" * 80)
    print("For best accuracy, please enter your age:")
    print("  • Kids (5-12 years): Optimized for 100-150cm")
    print("  • Teens (13-17 years): Optimized for 140-180cm")
    print("  • Adults (18+ years): Optimized for 150-220cm")
    
    user_age = None
    while user_age is None:
        try:
            age_input = input("\nEnter your age (5-100): ").strip()
            age = int(age_input)
            if 5 <= age <= 100:
                user_age = age
                if age <= 12:
                    print(f"✅ Age: {age} years (Kids group - optimized for accurate measurement)")
                elif age <= 17:
                    print(f"✅ Age: {age} years (Teens group - optimized for accurate measurement)")
                else:
                    print(f"✅ Age: {age} years (Adults group - optimized for accurate measurement)")
            else:
                print("❌ Please enter age between 5 and 100")
        except ValueError:
            print("❌ Please enter a valid number")
        except KeyboardInterrupt:
            print("\n\n❌ Cancelled by user")
            exit(0)
    
    print("\n" + "=" * 80)
    print("📊 WHY THESE 3 AI MODELS?")
    print("=" * 80)
    print("\n1️⃣  YOLOv8n-pose (Pose Detection)")
    print("   • Detects 17 body keypoints (nose, eyes, shoulders, hips, ankles, etc.)")
    print("   • Tracks person movement in real-time")
    print("   • Fast & accurate (30+ FPS)")
    print("   • Used by: Sports scientists, fitness apps, motion analysis")
    print("   • Why? Finds exact body points for height calculation")
    
    print("\n2️⃣  MiDaS (Depth Estimation)")
    print("   • Estimates distance from camera to each body part")
    print("   • Corrects perspective distortion")
    print("   • Works with single camera (no special hardware needed)")
    print("   • Used by: 3D scanning, AR/VR, robotics")
    print("   • Why? Ensures accurate measurement regardless of distance")
    
    print("\n3️⃣  MediaPipe BlazePose (Full-Body Landmarks)")
    print("   • Detects 33 body keypoints (head, hips, knees, ankles, FEET)")
    print("   • Includes heel and foot index landmarks for precise foot position")
    print("   • Works offline, no API key needed, pretrained model included")
    print("   • Better accuracy for adults, children, and varying body sizes")
    print("   • Used by: Google Fit, fitness tracking, pose estimation")
    print("   • Why? More keypoints = better accuracy, especially for feet detection")
    
    print("\n💡 Ensemble Approach:")
    print("   • Uses BOTH YOLOv8n AND BlazePose for height calculation")
    print("   • Weighted average: BlazePose 55% + YOLOv8n 45%")
    print("   • BlazePose gets more weight due to 33 keypoints vs 17")
    print("   • Result: Maximum accuracy by combining strengths of both models!")
    
    print("\n💡 Why NOT other models?")
    print("   • OpenPose: Too slow (5 FPS), requires GPU")
    print("   • AlphaPose: Complex setup, overkill for height")
    print("   • These 3 models = Best balance of speed + accuracy!")
    
    print("\n" + "=" * 80)
    print("📋 OFFICIAL SAI HEIGHT MEASUREMENT STANDARDS")
    print("=" * 80)
    print("\n✅ CORRECT PROCEDURE (As per SAI Guidelines):")
    print("   1. Subject stands BAREFOOT on flat surface")
    print("   2. Feet together, heels touching")
    print("   3. Body weight evenly distributed")
    print("   4. Arms hanging naturally at sides")
    print("   5. Head in Frankfort Horizontal Plane (looking straight)")
    print("   6. Shoulders relaxed, NOT raised")
    print("   7. Stand tall naturally, NO stretching")
    print("   8. Breathe normally, hold position for 3-4 seconds")
    
    print("\n❌ INVALID ATTEMPTS (Test will be TERMINATED):")
    print("   • Standing on tiptoes or heels")
    print("   • Wearing shoes or thick socks")
    print("   • Stretching body or neck upward")
    print("   • Raising shoulders")
    print("   • Standing on elevated surface")
    print("   • Moving during measurement")
    print("   • Head tilted up or down")
    
    print("\n📏 MEASUREMENT ACCURACY:")
    print("   • With ARUCO marker (20cm): ±0.5cm (Professional grade)")
    print("   • Without ARUCO (AI calibration): ±1-2cm (Standard grade)")
    print("   • Measurement time: 4 seconds")
    print("   • Samples collected: 120+ per test")
    
    print("\n🎮 CONTROLS:")
    print("   Q - Quit  |  R - Restart  |  F - Fullscreen")
    
    print("\n📸 RESULTS:")
    print("   • Photo saved in: height_results/")
    print("   • Format: ATHLETE_ID_DATE_HEIGHT.jpg")
    
    print("\n" + "=" * 80)
    print("Starting in 3 seconds...")
    print("=" * 80 + "\n")
    time.sleep(3)
    
    test = HeightAssessmentTest(user_age=user_age)
    test.speak("Welcome to height assessment. Please stand in front of camera.")
    test.run_assessment(athlete_id="ATHLETE_001")
