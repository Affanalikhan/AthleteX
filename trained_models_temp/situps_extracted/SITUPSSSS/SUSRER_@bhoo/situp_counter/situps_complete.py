#!/usr/bin/env python3
"""
COMPLETE SAI SIT-UP COUNTER
- Full SAI rules explanation (visual + voice)
- Visual countdown with loud voice
- All screen text has voice narration
- Real-time angle tracking with voice feedback
"""
import cv2
import mediapipe as mp
import numpy as np
import time
import pyttsx3
import threading
import queue

# Voice Coach - Windows Native (More Reliable)
class VoiceCoach:
    def __init__(self):
        self.is_active = False
        self.speaker = None
        self.last_speak_time = {}
        self.method = None
        
        # Try win32com first (most reliable on Windows)
        try:
            import win32com.client
            self.speaker = win32com.client.Dispatch("SAPI.SpVoice")
            self.speaker.Volume = 100  # Maximum volume
            self.speaker.Rate = 1      # Normal speed
            
            print("\n🔊 Initializing Windows voice (win32com)...")
            self.speaker.Speak("Voice system ready")
            
            self.is_active = True
            self.method = "win32com"
            print("✅ Voice ready (win32com - LOUD mode)")
            
        except Exception as e1:
            print(f"⚠️ win32com failed: {e1}")
            
            # Fallback to pyttsx3
            try:
                self.speaker = pyttsx3.init('sapi5')
                self.speaker.setProperty('rate', 150)
                self.speaker.setProperty('volume', 1.0)
                
                voices = self.speaker.getProperty('voices')
                print(f"\n🔊 Fallback to pyttsx3... ({len(voices)} voices)")
                
                if len(voices) > 0:
                    self.speaker.setProperty('voice', voices[0].id)
                
                print("🎤 Testing voice...")
                self.speaker.say("Voice system ready")
                self.speaker.runAndWait()
                
                self.is_active = True
                self.method = "pyttsx3"
                print("✅ Voice ready (pyttsx3 - LOUD mode)")
                
            except Exception as e2:
                print(f"⚠️ All voice methods failed:")
                print(f"   win32com: {e1}")
                print(f"   pyttsx3: {e2}")
                print("❌ Voice disabled. Install: pip install pywin32")
                self.is_active = False
    
    def speak(self, message, cooldown=0, force=False, priority=False):
        """Speak with optional cooldown"""
        if not self.is_active or not self.speaker:
            print(f"🔇 VOICE DISABLED: {message}")
            return
        
        current_time = time.time()
        
        # Check cooldown
        message_key = message[:20]
        last_time = self.last_speak_time.get(message_key, 0)
        
        if not force and not priority and current_time - last_time < cooldown:
            print(f"🔇 COOLDOWN: {message}")
            return
        
        try:
            print(f"🎤 SPEAKING ({self.method}): {message}")
            
            if self.method == "win32com":
                # win32com - more reliable, synchronous
                if priority:
                    self.speaker.Speak("", 2)  # Purge before speak
                self.speaker.Speak(message)
                
            elif self.method == "pyttsx3":
                # pyttsx3 fallback
                if priority:
                    self.speaker.stop()
                self.speaker.say(message)
                self.speaker.runAndWait()
            
            self.last_speak_time[message_key] = current_time
            print(f"✅ SPOKEN: {message}")
            
        except Exception as e:
            print(f"⚠️ Voice error: {e}")
            self.is_active = False

# Sit-up Counter
class SitupCounter:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Test settings
        self.test_duration = 30
        self.start_time = None
        self.is_running = False
        
        # Rep counting
        self.state = "DOWN"
        self.rep_count = 0
        self.current_angle = 0
        self.min_angle_in_cycle = 180
        self.max_angle_in_cycle = 0
        self.state_entry_time = time.time()  # Track when state changed
        self.down_hold_start = None  # Track DOWN position hold time
        
        # Enhanced Thresholds (5-Point Validation System)
        self.UP_THRESHOLD = 70  # UP (bent forward): < 70°
        self.DOWN_THRESHOLD = 160  # DOWN (lying flat): > 160°
        self.MIN_RANGE = 50  # Minimum range of motion
        self.PERFECT_RANGE = 80  # Perfect range
        self.MIN_HOLD_TIME = 0.3  # Must hold position for 0.3 seconds
        self.MAX_REP_TIME = 3.0  # Rep must complete within 3 seconds
        
        # Voice
        self.coach = VoiceCoach()
        
        # User profile (for age-based rating)
        self.age = None
        self.gender = None
        
        # Setup phases
        self.phase = "WELCOME"  # WELCOME -> USER_INFO -> CAMERA_SETUP -> RULES -> POSITION -> COUNTDOWN -> RUNNING -> COMPLETE
        self.phase_start_time = time.time()
        self.rules_shown = False
        self.rules_spoken = False
        self.camera_setup_spoken = False
        self.position_ready = False
        self.countdown_value = 3
        self.last_countdown_time = 0
        self.last_position_voice = 0
        self.body_visible_count = 0  # Track how many frames body is visible
        self.camera_instructions_spoken = False
        self.position_instructions_spoken = False
        self.position_confirmed_spoken = False
        self.last_body_warning = 0
        self.last_validation_voice = 0
        self.results_spoken = False
        self.user_info_spoken = False
        
        # Milestones
        self.milestones_announced = set()
    
    def calculate_angle(self, p1, p2, p3):
        """Calculate angle at p2"""
        a = np.array([p1.x, p1.y])
        b = np.array([p2.x, p2.y])
        c = np.array([p3.x, p3.y])
        
        ba = a - b
        bc = c - b
        
        cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
        angle = np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))
        
        return angle
    
    def show_welcome(self, frame):
        """Welcome screen"""
        h, w = frame.shape[:2]
        
        # Dark overlay
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
        frame = cv2.addWeighted(frame, 0.3, overlay, 0.7, 0)
        
        # Title
        cv2.putText(frame, "SAI SIT-UP TEST", (w//2 - 250, h//2 - 150),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3)
        
        # Instructions
        cv2.putText(frame, "Press SPACE to start", (w//2 - 200, h//2),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
        cv2.putText(frame, "Press Q to quit", (w//2 - 150, h//2 + 50),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (200, 200, 200), 2)
        
        # Voice welcome (once)
        if not self.rules_shown:
            self.coach.speak("Welcome to SAI Sit-up Test. Press space to begin.", force=True)
            self.rules_shown = True
        
        return frame
    
    def show_user_info(self, frame):
        """User information input screen"""
        h, w = frame.shape[:2]
        
        # Dark overlay
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
        frame = cv2.addWeighted(frame, 0.3, overlay, 0.7, 0)
        
        # Title
        cv2.putText(frame, "ATHLETE INFORMATION", (w//2 - 220, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)
        
        # Instructions
        instructions = [
            "Select your age group (press ONE number):",
            "",
            "MALE:",
            "  1 = 10-15 years    2 = 16-25 years    3 = 26-35 years",
            "  4 = 36-45 years    5 = 46-55 years    6 = 56+ years",
            "",
            "FEMALE:",
            "  7 = 10-15 years    8 = 16-25 years    9 = 26-35 years",
            "  0 = 36-45 years    Q = 46-55 years    W = 56+ years",
            "",
            "Press SPACE to skip"
        ]
        
        y_pos = 150
        for i, instruction in enumerate(instructions):
            if i == 0:
                cv2.putText(frame, instruction, (50, y_pos),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            elif instruction == "":
                pass
            elif "Press number" in instruction or "Press M" in instruction or "Press SPACE" in instruction:
                cv2.putText(frame, instruction, (50, y_pos),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                cv2.putText(frame, instruction, (70, y_pos),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
            y_pos += 35
        
        # Show current selection
        if self.age or self.gender:
            y_pos += 20
            cv2.putText(frame, "CURRENT SELECTION:", (w//2 - 150, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            y_pos += 40
            
            if self.age:
                age_text = f"Age Group: {self.age}"
                cv2.putText(frame, age_text, (w//2 - 120, y_pos),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                y_pos += 35
            
            if self.gender:
                gender_text = f"Gender: {self.gender}"
                cv2.putText(frame, gender_text, (w//2 - 120, y_pos),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            if self.age and self.gender:
                y_pos += 50
                cv2.putText(frame, "Press SPACE to continue", (w//2 - 200, y_pos),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        # Voice instructions (once)
        if not self.user_info_spoken:
            self.coach.speak("Athlete information. Enter your age group and gender for personalized rating. Or press space to skip.", force=True)
            self.user_info_spoken = True
        
        return frame
    
    def get_age_based_rating(self, reps, age_group, gender):
        """Get rating based on age and gender"""
        # Age-based standards (Male)
        male_standards = {
            "10-15 years": {"excellent": 50, "good": 40, "average": 30, "below": 20},
            "16-25 years": {"excellent": 60, "good": 50, "average": 40, "below": 30},
            "26-35 years": {"excellent": 55, "good": 45, "average": 35, "below": 25},
            "36-45 years": {"excellent": 50, "good": 40, "average": 30, "below": 20},
            "46-55 years": {"excellent": 45, "good": 35, "average": 25, "below": 15},
            "56+ years": {"excellent": 40, "good": 30, "average": 20, "below": 10}
        }
        
        # Age-based standards (Female)
        female_standards = {
            "10-15 years": {"excellent": 45, "good": 35, "average": 25, "below": 15},
            "16-25 years": {"excellent": 55, "good": 45, "average": 35, "below": 25},
            "26-35 years": {"excellent": 50, "good": 40, "average": 30, "below": 20},
            "36-45 years": {"excellent": 45, "good": 35, "average": 25, "below": 15},
            "46-55 years": {"excellent": 40, "good": 30, "average": 20, "below": 10},
            "56+ years": {"excellent": 35, "good": 25, "average": 15, "below": 5}
        }
        
        # Select appropriate standards
        standards = male_standards if gender == "Male" else female_standards
        thresholds = standards.get(age_group, standards["16-25 years"])  # Default to young adult
        
        # Determine rating
        if reps >= thresholds["excellent"]:
            return "EXCELLENT", (0, 255, 0), "⭐⭐⭐⭐⭐"
        elif reps >= thresholds["good"]:
            return "GOOD", (0, 255, 255), "⭐⭐⭐⭐"
        elif reps >= thresholds["average"]:
            return "AVERAGE", (0, 165, 255), "⭐⭐⭐"
        elif reps >= thresholds["below"]:
            return "BELOW AVERAGE", (0, 100, 255), "⭐⭐"
        else:
            return "NEEDS IMPROVEMENT", (0, 0, 255), "⭐"
    
    def show_camera_setup(self, frame, landmarks):
        """Camera setup instructions with body detection"""
        h, w = frame.shape[:2]
        
        # Dark overlay
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
        frame = cv2.addWeighted(frame, 0.3, overlay, 0.7, 0)
        
        # Title
        cv2.putText(frame, "CAMERA SETUP", (w//2 - 180, 50),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 255), 3)
        
        if landmarks:
            # Check if full body is visible
            required_landmarks = [
                self.mp_pose.PoseLandmark.NOSE,
                self.mp_pose.PoseLandmark.LEFT_SHOULDER,
                self.mp_pose.PoseLandmark.RIGHT_SHOULDER,
                self.mp_pose.PoseLandmark.LEFT_HIP,
                self.mp_pose.PoseLandmark.RIGHT_HIP,
                self.mp_pose.PoseLandmark.LEFT_KNEE,
                self.mp_pose.PoseLandmark.RIGHT_KNEE,
                self.mp_pose.PoseLandmark.LEFT_ANKLE,
                self.mp_pose.PoseLandmark.RIGHT_ANKLE
            ]
            
            all_visible = all(
                landmarks[lm].visibility > 0.5 for lm in required_landmarks
            )
            
            if all_visible:
                self.body_visible_count += 1
                
                # Success message
                cv2.putText(frame, "PERFECT! FULL BODY VISIBLE", (w//2 - 280, h//2 - 80),
                           cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 255, 0), 3)
                
                # Draw green checkmark
                cv2.circle(frame, (w//2, h//2), 60, (0, 255, 0), 6)
                cv2.line(frame, (w//2 - 25, h//2), (w//2 - 10, h//2 + 25), (0, 255, 0), 6)
                cv2.line(frame, (w//2 - 10, h//2 + 25), (w//2 + 35, h//2 - 35), (0, 255, 0), 6)
                
                cv2.putText(frame, "Press SPACE to continue", (w//2 - 220, h//2 + 120),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
                
                # Voice confirmation (once after 1 second of visibility)
                if self.body_visible_count == 30:  # ~1 second at 30fps
                    self.coach.speak("Perfect! Your full body is visible. Press space to continue.", force=True)
            else:
                self.body_visible_count = 0
                
                # Show what's missing
                cv2.putText(frame, "ADJUST CAMERA POSITION", (w//2 - 250, 120),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 165, 255), 2)
                
                # Instructions - Compact and visible
                instructions = [
                    "SETUP INSTRUCTIONS:",
                    "1. Camera 6-8 feet away, waist height",
                    "2. Position to SIDE (not above)",
                    "3. Lie perpendicular to camera",
                    "4. FULL BODY visible (head to feet)",
                    "5. Good lighting"
                ]
                
                y_pos = 170
                for i, instruction in enumerate(instructions):
                    if i == 0:
                        cv2.putText(frame, instruction, (25, y_pos),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                    else:
                        cv2.putText(frame, instruction, (25, y_pos),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    y_pos += 32
                
                # Voice guidance (every 5 seconds) - speak instructions
                current_time = time.time()
                if current_time - self.last_position_voice > 5.0:
                    self.coach.speak("Adjust camera position. Place it to your side, 6 to 8 feet away. Make sure your full body is visible.", force=True)
                    self.last_position_voice = current_time
                elif not self.camera_instructions_spoken:
                    # Speak instructions on first frame
                    self.coach.speak("Camera setup instructions. Place camera 6 to 8 feet away, at waist height, to your side.", force=True)
                    self.camera_instructions_spoken = True
        else:
            # No body detected at all
            cv2.putText(frame, "NO BODY DETECTED", (w//2 - 220, h//2 - 80),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 0, 255), 3)
            
            # Large red X
            cv2.line(frame, (w//2 - 50, h//2 - 50), (w//2 + 50, h//2 + 50), (0, 0, 255), 8)
            cv2.line(frame, (w//2 + 50, h//2 - 50), (w//2 - 50, h//2 + 50), (0, 0, 255), 8)
            
            # Quick tips
            tips = [
                "QUICK TIPS:",
                "- Stand in front of camera first",
                "- Make sure room is well lit",
                "- Camera should see your full body",
                "- Move back if too close"
            ]
            
            y_pos = h//2 + 100
            for tip in tips:
                cv2.putText(frame, tip, (w//2 - 250, y_pos),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                y_pos += 38
            
            # Voice guidance (every 4 seconds)
            current_time = time.time()
            if current_time - self.last_position_voice > 4.0:
                self.coach.speak("No body detected. Step into camera view.", force=True)
                self.last_position_voice = current_time
        
        # Voice initial instructions (once at start)
        if not self.camera_setup_spoken:
            self.coach.speak("Camera setup phase. Position the camera to your side, 6 to 8 feet away, at waist height.", force=True)
            self.camera_setup_spoken = True
        
        return frame
    
    def show_rules(self, frame):
        """Show SAI rules"""
        h, w = frame.shape[:2]
        
        # Dark overlay
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
        frame = cv2.addWeighted(frame, 0.2, overlay, 0.8, 0)
        
        # Title
        cv2.putText(frame, "SAI OFFICIAL RULES", (w//2 - 220, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 255, 255), 2)
        
        # Rules
        rules = [
            "1. Lie on your back, knees bent at 90 degrees",
            "2. Place hands behind your head, fingers interlocked",
            "3. Elbows must touch ground at start",
            "4. Sit up until elbows touch or pass knees",
            "5. Return until shoulder blades touch ground",
            "6. Keep hands behind head throughout",
            "7. Feet must stay flat on floor",
            "8. Complete as many reps as possible in 30 seconds"
        ]
        
        y_pos = 150
        for rule in rules:
            cv2.putText(frame, rule, (40, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            y_pos += 42
        
        # Continue instruction
        cv2.putText(frame, "Press SPACE when ready", (w//2 - 200, h - 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        # Voice rules (once, non-blocking)
        if not self.rules_spoken:
            self.coach.speak("Listen carefully to the official SAI rules. Press space when ready.", force=True)
            self.rules_spoken = True
        
        return frame
    
    def show_position_check(self, frame, landmarks):
        """Check if athlete is in correct starting position"""
        h, w = frame.shape[:2]
        
        if landmarks:
            # Calculate angle
            left_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
            right_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            left_hip = landmarks[self.mp_pose.PoseLandmark.LEFT_HIP]
            right_hip = landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP]
            left_knee = landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE]
            right_knee = landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            
            shoulder = type('obj', (object,), {
                'x': (left_shoulder.x + right_shoulder.x) / 2,
                'y': (left_shoulder.y + right_shoulder.y) / 2
            })()
            hip = type('obj', (object,), {
                'x': (left_hip.x + right_hip.x) / 2,
                'y': (left_hip.y + right_hip.y) / 2
            })()
            knee = type('obj', (object,), {
                'x': (left_knee.x + right_knee.x) / 2,
                'y': (left_knee.y + right_knee.y) / 2
            })()
            
            raw_angle = self.calculate_angle(shoulder, hip, knee)
            self.current_angle = 180 - raw_angle + 40
            
            # Check if in correct position (lying flat > 160°)
            if self.current_angle >= self.DOWN_THRESHOLD:
                self.position_ready = True
                cv2.putText(frame, "PERFECT POSITION!", (w//2 - 200, h//2 - 80),
                           cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3)
                cv2.putText(frame, "Get ready for countdown...", (w//2 - 220, h//2),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
                
                # Voice confirmation (once)
                if not self.position_confirmed_spoken:
                    self.coach.speak("Perfect position! Get ready for countdown.", force=True)
                    self.position_confirmed_spoken = True
            else:
                self.position_ready = False
                cv2.putText(frame, "LIE DOWN FLAT", (w//2 - 160, h//2 - 80),
                           cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 0, 255), 3)
                cv2.putText(frame, f"Angle: {int(self.current_angle)} (need > 160)", 
                           (w//2 - 220, h//2),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                
                # Voice guidance (every 3 seconds)
                current_time = time.time()
                if current_time - self.last_position_voice > 3.0:
                    self.coach.speak("Lie down flat on your back. Your angle must be above 160 degrees.", force=True)
                    self.last_position_voice = current_time
                elif not self.position_instructions_spoken:
                    self.coach.speak("Position check. Lie down flat on your back with knees bent.", force=True)
                    self.position_instructions_spoken = True
        else:
            cv2.putText(frame, "STEP INTO CAMERA VIEW", (w//2 - 280, h//2),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 255, 255), 2)
            
            current_time = time.time()
            if current_time - self.last_position_voice > 4.0:
                self.coach.speak("Step into camera view. Show your full body.", force=True)
                self.last_position_voice = current_time
        
        return frame
    
    def show_countdown(self, frame):
        """Visual countdown with voice"""
        h, w = frame.shape[:2]
        
        current_time = time.time()
        
        # Update countdown
        if current_time - self.last_countdown_time >= 1.0:
            if self.countdown_value > 0:
                # Show and speak countdown - use speak_now for immediate feedback
                self.coach.speak(str(self.countdown_value), force=True, priority=True)
                self.last_countdown_time = current_time
                self.countdown_value -= 1
            else:
                # GO!
                self.coach.speak("Go! Start now!", force=True, priority=True)
                self.phase = "RUNNING"
                self.is_running = True
                self.start_time = time.time()
                return frame
        
        # Display countdown number (HUGE)
        if self.countdown_value > 0:
            text = str(self.countdown_value)
            text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 10, 15)[0]
            text_x = (w - text_size[0]) // 2
            text_y = (h + text_size[1]) // 2
            cv2.putText(frame, text, (text_x, text_y),
                       cv2.FONT_HERSHEY_SIMPLEX, 10, (0, 255, 255), 15)
        else:
            # Show GO!
            cv2.putText(frame, "GO!", (w//2 - 150, h//2),
                       cv2.FONT_HERSHEY_SIMPLEX, 6, (0, 255, 0), 12)
        
        return frame
    
    def process_frame(self, frame):
        h, w = frame.shape[:2]
        
        # Process pose
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)
        
        landmarks = results.pose_landmarks.landmark if results.pose_landmarks else None
        
        # Draw skeleton if detected
        if results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                frame, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS,
                self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=3),
                self.mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2)
            )
        
        # Phase-based rendering
        if self.phase == "WELCOME":
            return self.show_welcome(frame)
        
        elif self.phase == "USER_INFO":
            return self.show_user_info(frame)
        
        elif self.phase == "CAMERA_SETUP":
            return self.show_camera_setup(frame, landmarks)
        
        elif self.phase == "RULES":
            return self.show_rules(frame)
        
        elif self.phase == "POSITION":
            frame = self.show_position_check(frame, landmarks)
            # Auto-advance when position is ready for 2 seconds
            if self.position_ready:
                if time.time() - self.phase_start_time > 2:
                    self.phase = "COUNTDOWN"
                    self.phase_start_time = time.time()
                    self.last_countdown_time = time.time()
            return frame
        
        elif self.phase == "COUNTDOWN":
            return self.show_countdown(frame)
        
        elif self.phase == "RUNNING":
            return self.show_running_test(frame, landmarks)
        
        elif self.phase == "COMPLETE":
            return self.show_results(frame)
        
        return frame
    
    def show_running_test(self, frame, landmarks):
        """Main test display with all overlays"""
        h, w = frame.shape[:2]
        
        if not landmarks:
            cv2.putText(frame, "BODY NOT VISIBLE!", (w//2 - 200, h//2),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 0, 255), 2)
            current_time = time.time()
            if current_time - self.last_body_warning > 3.0:
                self.coach.speak("Warning! Stay in camera view!", force=True)
                self.last_body_warning = current_time
            return frame
        
        # Calculate angle
        left_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
        left_hip = landmarks[self.mp_pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP]
        left_knee = landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE]
        right_knee = landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE]
        
        shoulder = type('obj', (object,), {
            'x': (left_shoulder.x + right_shoulder.x) / 2,
            'y': (left_shoulder.y + right_shoulder.y) / 2
        })()
        hip = type('obj', (object,), {
            'x': (left_hip.x + right_hip.x) / 2,
            'y': (left_hip.y + right_hip.y) / 2
        })()
        knee = type('obj', (object,), {
            'x': (left_knee.x + right_knee.x) / 2,
            'y': (left_knee.y + right_knee.y) / 2
        })()
        
        raw_angle = self.calculate_angle(shoulder, hip, knee)
        self.current_angle = 180 - raw_angle + 40
        
        # Debug: Print angle occasionally to verify calculation
        if int(time.time() * 2) % 2 == 0:
            print(f"[DEBUG] Raw: {raw_angle:.1f}° → Transformed: {self.current_angle:.1f}° | State: {self.state}")
        
        # Track min/max
        self.min_angle_in_cycle = min(self.min_angle_in_cycle, self.current_angle)
        self.max_angle_in_cycle = max(self.max_angle_in_cycle, self.current_angle)
        angle_range = self.max_angle_in_cycle - self.min_angle_in_cycle
        
        # 5-POINT VALIDATION STATE MACHINE
        current_time = time.time()
        
        # Track DOWN position hold time
        if self.current_angle > self.DOWN_THRESHOLD:
            if self.down_hold_start is None:
                self.down_hold_start = current_time
        else:
            self.down_hold_start = None
        
        # State transitions with strict validation
        if self.state == "DOWN" and self.current_angle < self.UP_THRESHOLD:
            # Attempting transition to UP
            down_hold_time = current_time - self.state_entry_time if self.state_entry_time else 0
            
            # ✅ VALIDATION 1: Hold DOWN Position (≥ 0.3s)
            if down_hold_time < self.MIN_HOLD_TIME:
                print(f"[✗] UP transition rejected: held DOWN only {down_hold_time:.2f}s < {self.MIN_HOLD_TIME}s")
                if current_time - self.last_validation_voice > 2.0:
                    self.coach.speak("Hold the down position longer!", force=True)
                    self.last_validation_voice = current_time
                return frame
            
            # Transition to UP
            self.state = "UP"
            self.state_entry_time = current_time
            print(f"[✓] Transition to UP: angle={self.current_angle:.1f}° (held DOWN for {down_hold_time:.2f}s)")
            # Don't speak "Up" - too frequent and distracting
        
        elif self.state == "UP" and self.current_angle > self.DOWN_THRESHOLD:
            # Attempting to count rep - VALIDATE ALL 5 POINTS
            time_in_up = current_time - self.state_entry_time
            total_rep_time = time_in_up
            
            # ✅ VALIDATION 2: Hold UP Position (≥ 0.3s)
            if time_in_up < self.MIN_HOLD_TIME:
                print(f"[✗] Rep REJECTED: held UP only {time_in_up:.2f}s < {self.MIN_HOLD_TIME}s")
                if current_time - self.last_validation_voice > 2.0:
                    self.coach.speak("Too fast! Hold the up position!", force=True)
                    self.last_validation_voice = current_time
                self.state = "DOWN"
                self.state_entry_time = current_time
                self.min_angle_in_cycle = 180
                self.max_angle_in_cycle = 0
                return frame
            
            # ✅ VALIDATION 3: Complete Within Time (< 3.0s)
            if total_rep_time > self.MAX_REP_TIME:
                print(f"[✗] Rep REJECTED: took too long {total_rep_time:.2f}s > {self.MAX_REP_TIME}s")
                if current_time - self.last_validation_voice > 2.0:
                    self.coach.speak("Too slow! Move faster!", force=True)
                    self.last_validation_voice = current_time
                self.state = "DOWN"
                self.state_entry_time = current_time
                self.min_angle_in_cycle = 180
                self.max_angle_in_cycle = 0
                return frame
            
            # ✅ VALIDATION 4: Sufficient Range (≥ 50°)
            if angle_range < self.MIN_RANGE:
                print(f"[✗] Rep REJECTED: insufficient range {angle_range:.1f}° < {self.MIN_RANGE}°")
                if current_time - self.last_validation_voice > 2.0:
                    self.coach.speak("Not enough range! Go all the way up and down!", force=True)
                    self.last_validation_voice = current_time
                self.state = "DOWN"
                self.state_entry_time = current_time
                self.min_angle_in_cycle = 180
                self.max_angle_in_cycle = 0
                return frame
            
            # ✅ VALIDATION 5: Proper Angles
            if self.min_angle_in_cycle >= self.UP_THRESHOLD:
                print(f"[✗] Rep REJECTED: min angle {self.min_angle_in_cycle:.1f}° >= {self.UP_THRESHOLD}° (not bent enough)")
                if current_time - self.last_validation_voice > 2.0:
                    self.coach.speak("Bend forward more! Touch your knees!", force=True)
                    self.last_validation_voice = current_time
                self.state = "DOWN"
                self.state_entry_time = current_time
                self.min_angle_in_cycle = 180
                self.max_angle_in_cycle = 0
                return frame
            
            if self.max_angle_in_cycle < self.DOWN_THRESHOLD:
                print(f"[✗] Rep REJECTED: max angle {self.max_angle_in_cycle:.1f}° < {self.DOWN_THRESHOLD}° (not lying flat)")
                if current_time - self.last_validation_voice > 2.0:
                    self.coach.speak("Lie down flatter! Shoulders to the ground!", force=True)
                    self.last_validation_voice = current_time
                self.state = "DOWN"
                self.state_entry_time = current_time
                self.min_angle_in_cycle = 180
                self.max_angle_in_cycle = 0
                return frame
            
            # ✅✅✅ ALL 5 VALIDATIONS PASSED - COUNT THE REP!
            self.state = "DOWN"
            self.state_entry_time = current_time
            self.rep_count += 1
            print(f"[✓✓✓] REP COUNTED! Range: {angle_range:.1f}° (min={self.min_angle_in_cycle:.1f}°, max={self.max_angle_in_cycle:.1f}°, time={total_rep_time:.2f}s)")
            
            # Speak rep count with priority
            self.coach.speak(str(self.rep_count), force=True, priority=True)
            
            # Reset for next cycle
            self.min_angle_in_cycle = 180
            self.max_angle_in_cycle = 0
        
        # Time management
        elapsed = time.time() - self.start_time
        remaining = max(0, self.test_duration - elapsed)
        
        # Milestone announcements with better timing and priority
        if remaining <= 15 and '15' not in self.milestones_announced:
            self.coach.speak(f"Fifteen seconds left! {self.rep_count} reps! Keep going!", force=True, priority=True)
            self.milestones_announced.add('15')
        elif remaining <= 10 and '10' not in self.milestones_announced:
            self.coach.speak("Ten seconds left! Push harder!", force=True, priority=True)
            self.milestones_announced.add('10')
        elif remaining <= 5 and '5' not in self.milestones_announced:
            self.coach.speak("Five seconds! Final push!", force=True, priority=True)
            self.milestones_announced.add('5')
        
        # Test complete
        if remaining <= 0:
            self.phase = "COMPLETE"
            self.coach.speak(f"Time up! You completed {self.rep_count} repetitions!", force=True, priority=True)
            return frame
        
        # Draw bounding box
        x_coords = [lm.x for lm in landmarks]
        y_coords = [lm.y for lm in landmarks]
        x1, x2 = int(min(x_coords) * w * 0.9), int(max(x_coords) * w * 1.1)
        y1, y2 = int(min(y_coords) * h * 0.9), int(max(y_coords) * h * 1.1)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
        
        # Timer (top left)
        cv2.putText(frame, f"Time: {elapsed:.1f}s", (15, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(frame, f"Left: {remaining:.1f}s", (15, 70),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        
        # Min/Max/Range (top right)
        cv2.putText(frame, f"Min: {int(self.min_angle_in_cycle)}", (w - 180, 50),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(frame, f"Max: {int(self.max_angle_in_cycle)}", (w - 180, 90),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(frame, f"Range: {int(angle_range)}", (w - 180, 130),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        
        # Validation status
        if angle_range >= self.MIN_RANGE:
            cv2.putText(frame, "VALID RANGE", (w - 200, 170),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        else:
            cv2.putText(frame, f"NEED {self.MIN_RANGE - int(angle_range)}°", (w - 200, 170),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        # Large rep count (center)
        rep_text = f"{self.rep_count}"
        text_size = cv2.getTextSize(rep_text, cv2.FONT_HERSHEY_SIMPLEX, 3, 5)[0]
        text_x = (w - text_size[0]) // 2
        text_y = (h + text_size[1]) // 2
        cv2.putText(frame, rep_text, (text_x, text_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 3, (0, 255, 0), 5)
        cv2.putText(frame, "REPS", (text_x + 15, text_y + 50),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 2)
        
        # State (bottom left)
        state_color = (0, 255, 0) if self.state == "UP" else (0, 255, 255)
        cv2.putText(frame, self.state, (15, h - 120),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.4, state_color, 3)
        
        # Angle info (bottom left)
        cv2.putText(frame, f"Range: {int(angle_range)}", (15, h - 90),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv2.putText(frame, f"UP<{self.UP_THRESHOLD} DOWN>{self.DOWN_THRESHOLD}", 
                   (15, h - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        cv2.putText(frame, f"Angle: {int(self.current_angle)}", (15, h - 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Angle bar (bottom) - scale from 50° to 180°
        bar_x, bar_y = 200, h - 50
        bar_length, bar_height = 400, 20
        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_length, bar_y + bar_height),
                     (100, 100, 100), -1)
        
        # Map angle 50-180 to bar position
        angle_pos = int(((self.current_angle - 50) / 130) * bar_length)
        angle_pos = max(0, min(bar_length, angle_pos))
        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + angle_pos, bar_y + bar_height),
                     (0, 255, 0), -1)
        
        # Threshold markers
        up_pos = int(((self.UP_THRESHOLD - 50) / 130) * bar_length)
        down_pos = int(((self.DOWN_THRESHOLD - 50) / 130) * bar_length)
        cv2.line(frame, (bar_x + up_pos, bar_y - 5), (bar_x + up_pos, bar_y + bar_height + 5),
                (0, 255, 255), 2)
        cv2.line(frame, (bar_x + down_pos, bar_y - 5), (bar_x + down_pos, bar_y + bar_height + 5),
                (0, 255, 255), 2)
        
        return frame
    
    def show_results(self, frame):
        """Final results screen"""
        h, w = frame.shape[:2]
        
        # Dark overlay
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
        frame = cv2.addWeighted(frame, 0.2, overlay, 0.8, 0)
        
        # Title
        cv2.putText(frame, "TEST COMPLETE!", (w//2 - 220, 80),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
        
        # Results
        cv2.putText(frame, f"Total Reps: {self.rep_count}", (w//2 - 160, 200),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.3, (255, 255, 255), 3)
        
        # Age-based or default rating
        if self.age and self.gender:
            rating, color, stars = self.get_age_based_rating(self.rep_count, self.age, self.gender)
            rating_text = f"Rating: {rating} {stars}"
            
            # Show age/gender info
            cv2.putText(frame, f"{self.gender}, {self.age}", (w//2 - 160, 260),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (200, 200, 200), 2)
        else:
            # Default rating (no age/gender)
            if self.rep_count >= 50:
                rating = "EXCELLENT"
                color = (0, 255, 0)
                stars = "⭐⭐⭐⭐⭐"
            elif self.rep_count >= 40:
                rating = "GOOD"
                color = (0, 255, 255)
                stars = "⭐⭐⭐⭐"
            elif self.rep_count >= 30:
                rating = "AVERAGE"
                color = (0, 165, 255)
                stars = "⭐⭐⭐"
            else:
                rating = "BELOW AVERAGE"
                color = (0, 0, 255)
                stars = "⭐⭐"
            rating_text = f"Rating: {rating} {stars}"
        
        cv2.putText(frame, rating_text, (w//2 - 240, 300),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
        
        # Exit and restart instructions
        cv2.putText(frame, "Press R to restart | Press Q to quit", (w//2 - 280, h - 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.9, (200, 200, 200), 2)
        
        # Voice rating
        rating_voice = f"Your rating is {rating}."
        if rating == "EXCELLENT":
            rating_voice += " Excellent performance!"
        elif rating == "GOOD":
            rating_voice += " Good job!"
        elif rating == "AVERAGE":
            rating_voice += " Keep training to improve!"
        else:
            rating_voice += " More practice needed!"
        
        # Voice rating announcement (once)
        if not self.results_spoken:
            self.coach.speak(f"Your rating is {rating}. {rating_voice}", force=True)
            self.results_spoken = True
        
        # Exit and restart instructions
        cv2.putText(frame, "Press R to restart | Press Q to quit", (w//2 - 350, h - 50),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, (200, 200, 200), 2)
        
        return frame

def main():
    print("=" * 60)
    print("🏃 COMPLETE SAI SIT-UP COUNTER")
    print("=" * 60)
    print("Controls:")
    print("  SPACE - Advance through phases")
    print("  R - Restart test")
    print("  Q - Quit")
    print("=" * 60)
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Cannot open camera")
        return
    
    counter = SitupCounter()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        
        annotated_frame = counter.process_frame(frame)
        
        # Add restart instruction on screen
        h, w = annotated_frame.shape[:2]
        if counter.phase == "RUNNING" or counter.phase == "COMPLETE":
            cv2.putText(annotated_frame, "Press R to restart", (w - 280, h - 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        
        cv2.namedWindow('SAI Sit-up Counter', cv2.WINDOW_NORMAL)
        cv2.setWindowProperty('SAI Sit-up Counter', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        cv2.imshow('SAI Sit-up Counter', annotated_frame)
        
        key = cv2.waitKey(1) & 0xFF
        
        # Debug: Show key presses
        if key != 255:  # 255 means no key pressed
            print(f"[DEBUG] Key pressed: {key} ('{chr(key) if 32 <= key <= 126 else '?'}')")
        
        if key == ord('q'):
            break
        elif key == ord('r'):  # Restart
            print("\n🔄 RESTARTING TEST...")
            counter.coach.speak("Restarting test. Get ready!", priority=True)
            counter = SitupCounter()  # Create new counter instance
        elif key == ord(' '):  # Space bar
            if counter.phase == "WELCOME":
                counter.phase = "USER_INFO"
                counter.phase_start_time = time.time()
            elif counter.phase == "USER_INFO":
                # Skip to camera setup (age/gender optional)
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif counter.phase == "CAMERA_SETUP":
                # Only allow advance if body is visible
                if counter.body_visible_count > 0:
                    counter.phase = "RULES"
                    counter.phase_start_time = time.time()
                else:
                    counter.coach.speak("Please make sure your full body is visible before continuing.", force=True)
            elif counter.phase == "RULES":
                counter.phase = "POSITION"
                counter.phase_start_time = time.time()
        
        # Handle age/gender input - ONE KEY PRESS, AUTO-ADVANCE
        elif counter.phase == "USER_INFO":
            # MALE options (1-6)
            if key == ord('1'):
                counter.age = "10-15 years"
                counter.gender = "Male"
                print(f"✅ Selected: Male, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('2'):
                counter.age = "16-25 years"
                counter.gender = "Male"
                print(f"✅ Selected: Male, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('3'):
                counter.age = "26-35 years"
                counter.gender = "Male"
                print(f"✅ Selected: Male, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('4'):
                counter.age = "36-45 years"
                counter.gender = "Male"
                print(f"✅ Selected: Male, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('5'):
                counter.age = "46-55 years"
                counter.gender = "Male"
                print(f"✅ Selected: Male, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('6'):
                counter.age = "56+ years"
                counter.gender = "Male"
                print(f"✅ Selected: Male, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            # FEMALE options (7-9, 0, Q, W)
            elif key == ord('7'):
                counter.age = "10-15 years"
                counter.gender = "Female"
                print(f"✅ Selected: Female, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('8'):
                counter.age = "16-25 years"
                counter.gender = "Female"
                print(f"✅ Selected: Female, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('9'):
                counter.age = "26-35 years"
                counter.gender = "Female"
                print(f"✅ Selected: Female, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('0'):
                counter.age = "36-45 years"
                counter.gender = "Female"
                print(f"✅ Selected: Female, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('q') or key == ord('Q'):
                counter.age = "46-55 years"
                counter.gender = "Female"
                print(f"✅ Selected: Female, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
            elif key == ord('w') or key == ord('W'):
                counter.age = "56+ years"
                counter.gender = "Female"
                print(f"✅ Selected: Female, {counter.age}")
                counter.phase = "CAMERA_SETUP"
                counter.phase_start_time = time.time()
    
    cap.release()
    cv2.destroyAllWindows()
    
    print("\n" + "=" * 60)
    print(f"FINAL RESULT: {counter.rep_count} reps")
    print("=" * 60)

if __name__ == '__main__':
    main()
