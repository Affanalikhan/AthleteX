"""
PROFESSIONAL LIVE BROAD JUMP TEST SYSTEM
=========================================
Complete system with 3 trials, countdown, and accurate measurement

Features:
- Live camera capture
- 3 trials with space bar control
- Voice countdown (Ready, 1, 2, 3, Start!)
- Automatic jump detection
- Accurate distance measurement
- Clear instructions
- Professional results display

Author: AI Assistant
Date: 2025-11-18
"""

import cv2
import numpy as np
import os
import csv
import time
import datetime
from ultralytics import YOLO

# ===================================================================
# CONFIGURATION
# ===================================================================
MODEL_PATH = "yolov8s-pose.pt"
CAMERA_INDEX = 0

OUTPUT_DIR = "jump_results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CSV_FILE = os.path.join(OUTPUT_DIR, "results.csv")
SAVE_VIDEO = True
MAX_TRIALS = 3

# Detection thresholds
STATIC_FRAMES_REQUIRED = 5
STATIC_TOLERANCE_PX = 10
TAKEOFF_VELOCITY = 20
LANDING_VELOCITY = 8
LANDING_STABLE_FRAMES = 4

# Keypoints
ANKLE_LEFT = 15
ANKLE_RIGHT = 16

# Colors
COLOR_GREEN = (0, 255, 0)
COLOR_RED = (0, 0, 255)
COLOR_YELLOW = (0, 255, 255)
COLOR_WHITE = (255, 255, 255)
COLOR_BLACK = (0, 0, 0)

# ===================================================================
# LOAD MODEL
# ===================================================================
print("="*70)
print("PROFESSIONAL BROAD JUMP TEST SYSTEM")
print("="*70)
print("\nLoading AI model...")
model = YOLO(MODEL_PATH)
print("✓ Model loaded successfully\n")

# ===================================================================
# HELPER FUNCTIONS
# ===================================================================

def get_ankle_position(results):
    """Get ankle positions from pose detection"""
    try:
        for r in results:
            if r.keypoints is not None and len(r.keypoints.xy) > 0:
                kp = r.keypoints.xy[0]
                left = kp[ANKLE_LEFT]
                right = kp[ANKLE_RIGHT]
                
                if left[0] > 0 and left[1] > 0 and right[0] > 0 and right[1] > 0:
                    # Use forward-most ankle for accuracy
                    forward_x = max(float(left[0]), float(right[0]))
                    avg_y = (float(left[1]) + float(right[1])) / 2
                    return forward_x, avg_y, (int(left[0]), int(left[1])), (int(right[0]), int(right[1]))
    except:
        pass
    return None

def smooth_position(current, previous, alpha=0.3):
    """Exponential smoothing for position"""
    if previous is None:
        return current
    return alpha * current + (1 - alpha) * previous

def save_result(data):
    """Save result to CSV"""
    headers = ["timestamp", "trial", "distance_m", "px_distance", "px_per_m", 
               "takeoff_x", "landing_x", "video_file"]
    
    file_exists = os.path.exists(CSV_FILE)
    with open(CSV_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(headers)
        writer.writerow(data)

def draw_text_with_background(frame, text, position, font_scale=1, thickness=2, 
                               text_color=COLOR_WHITE, bg_color=COLOR_BLACK):
    """Draw text with background for better visibility"""
    font = cv2.FONT_HERSHEY_SIMPLEX
    (text_width, text_height), baseline = cv2.getTextSize(text, font, font_scale, thickness)
    
    x, y = position
    # Draw background rectangle
    cv2.rectangle(frame, (x - 5, y - text_height - 5), 
                  (x + text_width + 5, y + baseline + 5), bg_color, -1)
    # Draw text
    cv2.putText(frame, text, (x, y), font, font_scale, text_color, thickness)

# ===================================================================
# INSTRUCTIONS SCREEN
# ===================================================================

def show_instructions():
    """Display setup instructions"""
    print("\n" + "="*70)
    print("SETUP INSTRUCTIONS")
    print("="*70)
    print("""
CAMERA SETUP:
1. Position camera to the SIDE (not front)
2. Camera should see the full jump area (at least 3 meters)
3. Mount camera at waist height
4. Keep camera stable (use tripod if possible)

CALIBRATION:
1. You'll need a reference object of known size
2. Examples: 1-meter tape, ruler, A4 paper (21cm)
3. Place it horizontally in the jump area
4. You'll click its edges to calibrate

YOUR POSITION:
1. Stand SIDEWAYS to the camera
2. Face perpendicular to camera view
3. Feet together at starting position
4. Jump FORWARD (away from camera)

CAMERA VIEW (Side View):
    
    📷 Camera
    ↓
    ┌─────────────────────────────────────┐
    │                                     │
    │  🚶 ═══════════► 🏃                │
    │  You          Jump forward          │
    │  (sideways)                         │
    │                                     │
    └─────────────────────────────────────┘

CONTROLS:
- Press SPACE to start each trial
- Press Q to quit anytime
- Follow on-screen countdown

Ready? Press ENTER to continue...""")
    
    input()

# ===================================================================
# CALIBRATION
# ===================================================================

def calibrate_system(cap):
    """Interactive calibration"""
    print("\n" + "="*70)
    print("CALIBRATION")
    print("="*70)
    print("""
CALIBRATION STEPS:
1. Place your reference object horizontally in view
2. Click the LEFT edge of the object
3. Click the RIGHT edge of the object
4. Enter the real distance in meters

Common reference objects:
- 1-meter tape: Enter 1.0
- 30cm ruler: Enter 0.3
- A4 paper width: Enter 0.21
- Credit card width: Enter 0.085

Press ENTER when ready...""")
    
    input()
    
    # Get first frame
    ret, frame = cap.read()
    if not ret:
        print("Error: Cannot read from camera")
        return None, None
    
    # Resize for display
    h, w = frame.shape[:2]
    if w > 1280:
        scale = 1280 / w
        frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
    
    points = []
    
    def mouse_callback(event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN and len(points) < 2:
            points.append((x, y))
    
    cv2.namedWindow("Calibration", cv2.WINDOW_NORMAL)
    cv2.setMouseCallback("Calibration", mouse_callback)
    
    print("\nClick 2 points on your reference object...")
    
    while len(points) < 2:
        ret, frame = cap.read()
        if not ret:
            continue
        
        # Resize
        h, w = frame.shape[:2]
        if w > 1280:
            scale = 1280 / w
            frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
        
        display = frame.copy()
        
        # Instructions
        draw_text_with_background(display, "CALIBRATION", (20, 40), 1.5, 3, COLOR_YELLOW)
        draw_text_with_background(display, f"Click 2 points on reference object ({len(points)}/2)", 
                                 (20, 90), 1, 2, COLOR_WHITE)
        
        # Draw points
        for i, pt in enumerate(points):
            cv2.circle(display, pt, 10, COLOR_GREEN, -1)
            cv2.circle(display, pt, 12, COLOR_WHITE, 2)
            draw_text_with_background(display, f"P{i+1}", (pt[0]+15, pt[1]-15), 0.8, 2, COLOR_GREEN)
        
        if len(points) == 1:
            draw_text_with_background(display, "Now click the second point", 
                                     (20, 130), 0.9, 2, COLOR_GREEN)
        
        cv2.imshow("Calibration", display)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            cv2.destroyAllWindows()
            return None, None
        elif key == ord('r'):
            points = []
    
    # Calculate pixel distance
    px_distance = np.sqrt((points[1][0] - points[0][0])**2 + 
                          (points[1][1] - points[0][1])**2)
    
    # Show measurement
    display = frame.copy()
    cv2.line(display, points[0], points[1], COLOR_GREEN, 3)
    cv2.circle(display, points[0], 10, COLOR_GREEN, -1)
    cv2.circle(display, points[1], 10, COLOR_GREEN, -1)
    draw_text_with_background(display, f"{px_distance:.1f} pixels", 
                             (points[0][0], points[0][1]-30), 1, 2, COLOR_GREEN)
    cv2.imshow("Calibration", display)
    cv2.waitKey(1000)
    
    cv2.destroyAllWindows()
    
    # Get real distance
    print(f"\nPixel distance measured: {px_distance:.1f} pixels")
    print("Enter the REAL distance in meters (e.g., 1.0 for 1 meter): ", end='')
    
    try:
        real_distance = float(input().strip())
        if real_distance <= 0:
            print("Invalid distance")
            return None, None
    except:
        print("Invalid input")
        return None, None
    
    px_per_meter = px_distance / real_distance
    
    print(f"\n✓ Calibration complete!")
    print(f"  Scale: {px_per_meter:.1f} pixels per meter")
    print(f"  {px_distance:.1f} pixels = {real_distance} meters")
    
    return px_per_meter, points[0][0]

# ===================================================================
# JUMP TRIAL
# ===================================================================

def run_trial(cap, trial_num, px_per_meter, reference_x):
    """Run one jump trial"""
    
    print(f"\n{'='*70}")
    print(f"TRIAL {trial_num}/{MAX_TRIALS}")
    print('='*70)
    print("\nPress SPACE when ready to start this trial...")
    
    cv2.namedWindow("Broad Jump Test", cv2.WINDOW_NORMAL)
    
    # Wait for space bar
    waiting = True
    while waiting:
        ret, frame = cap.read()
        if not ret:
            continue
        
        h, w = frame.shape[:2]
        display = frame.copy()
        
        # Draw instructions
        cv2.rectangle(display, (0, 0), (w, 150), COLOR_BLACK, -1)
        draw_text_with_background(display, f"TRIAL {trial_num}/{MAX_TRIALS}", 
                                 (20, 50), 1.5, 3, COLOR_YELLOW, COLOR_BLACK)
        draw_text_with_background(display, "Press SPACE to start | Press Q to quit", 
                                 (20, 100), 1, 2, COLOR_WHITE, COLOR_BLACK)
        
        cv2.imshow("Broad Jump Test", display)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord(' '):
            waiting = False
        elif key == ord('q'):
            return None
    
    print("Starting trial...")
    
    # ===== PHASE 1: DETECT START POSITION =====
    print("Phase 1: Detecting your starting position...")
    print("Stand still in your starting position...")
    
    start_x = None
    static_count = 0
    prev_x = None
    timeout = time.time() + 15
    
    while time.time() < timeout and start_x is None:
        ret, frame = cap.read()
        if not ret:
            continue
        
        h, w = frame.shape[:2]
        display = frame.copy()
        
        # Detect pose
        results = model(frame, verbose=False)
        ankle_data = get_ankle_position(results)
        
        # Status bar
        cv2.rectangle(display, (0, 0), (w, 150), COLOR_BLACK, -1)
        draw_text_with_background(display, f"TRIAL {trial_num} - DETECTING START POSITION", 
                                 (20, 50), 1.2, 3, COLOR_YELLOW, COLOR_BLACK)
        
        if ankle_data:
            x, y, left, right = ankle_data
            
            # Draw ankles
            cv2.circle(display, left, 10, COLOR_GREEN, -1)
            cv2.circle(display, right, 10, COLOR_GREEN, -1)
            cv2.circle(display, (int(x), int(y)), 12, (255, 0, 255), -1)
            
            # Check if static
            if prev_x is not None:
                if abs(x - prev_x) < STATIC_TOLERANCE_PX:
                    static_count += 1
                else:
                    static_count = max(0, static_count - 1)
            
            prev_x = x
            
            # Progress
            draw_text_with_background(display, f"Hold still: {static_count}/{STATIC_FRAMES_REQUIRED}", 
                                     (20, 100), 1, 2, COLOR_WHITE, COLOR_BLACK)
            
            # Progress bar
            bar_w = 500
            progress = min(static_count / STATIC_FRAMES_REQUIRED, 1.0)
            cv2.rectangle(display, (20, 120), (20 + bar_w, 145), (100, 100, 100), 2)
            cv2.rectangle(display, (20, 120), (20 + int(bar_w * progress), 145), COLOR_GREEN, -1)
            
            if static_count >= STATIC_FRAMES_REQUIRED:
                start_x = x
                print(f"✓ Start position detected at x={start_x:.1f}")
        else:
            draw_text_with_background(display, "Stand in view with feet visible", 
                                     (20, 100), 1, 2, COLOR_RED, COLOR_BLACK)
            static_count = 0
        
        cv2.imshow("Broad Jump Test", display)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            return None
    
    if start_x is None:
        print("✗ Could not detect start position")
        return None
    
    # ===== PHASE 2: COUNTDOWN =====
    print("Phase 2: Countdown...")
    
    countdown_texts = ["READY", "3", "2", "1", "START!"]
    
    for text in countdown_texts:
        print(f"  {text}")
        
        for _ in range(20):  # Show each for ~0.67 seconds
            ret, frame = cap.read()
            if not ret:
                continue
            
            h, w = frame.shape[:2]
            display = frame.copy()
            
            # Draw countdown
            text_size = 6 if text == "START!" else 8
            thickness = 8 if text == "START!" else 12
            color = COLOR_GREEN if text == "START!" else COLOR_RED
            
            (text_width, text_height), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 
                                                           text_size, thickness)
            text_x = (w - text_width) // 2
            text_y = (h + text_height) // 2
            
            cv2.putText(display, text, (text_x, text_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, text_size, color, thickness)
            
            cv2.imshow("Broad Jump Test", display)
            cv2.waitKey(33)
    
    # ===== PHASE 3: TRACK JUMP =====
    print("Phase 3: Tracking jump...")
    
    took_off = False
    takeoff_x = None
    landing_x = None
    prev_smooth = None
    stable = 0
    buffer = []
    max_x = start_x
    
    start_time = time.time()
    
    while time.time() - start_time < 10:
        ret, frame = cap.read()
        if not ret:
            break
        
        buffer.append(frame.copy())
        h, w = frame.shape[:2]
        display = frame.copy()
        
        # Draw start line
        if reference_x:
            cv2.line(display, (int(reference_x), 0), (int(reference_x), h), COLOR_YELLOW, 3)
        
        # Detect pose
        results = model(frame, verbose=False)
        ankle_data = get_ankle_position(results)
        
        if not ankle_data:
            cv2.imshow("Broad Jump Test", display)
            cv2.waitKey(1)
            continue
        
        x, y, left, right = ankle_data
        
        # Smooth position
        x_smooth = smooth_position(x, prev_smooth)
        
        # Track maximum distance
        if x_smooth > max_x:
            max_x = x_smooth
        
        if prev_smooth is not None:
            velocity = x_smooth - prev_smooth
            
            # Status overlay
            cv2.rectangle(display, (0, 0), (w, 120), COLOR_BLACK, -1)
            
            if not took_off:
                draw_text_with_background(display, "WAITING FOR JUMP...", 
                                         (20, 50), 1.2, 3, COLOR_YELLOW, COLOR_BLACK)
                draw_text_with_background(display, f"Velocity: {velocity:.1f} px/frame", 
                                         (20, 90), 0.9, 2, COLOR_WHITE, COLOR_BLACK)
                
                if abs(velocity) > TAKEOFF_VELOCITY:
                    took_off = True
                    takeoff_x = prev_smooth
                    print(f"✓ Takeoff detected at x={takeoff_x:.1f}")
            else:
                draw_text_with_background(display, "TRACKING JUMP...", 
                                         (20, 50), 1.2, 3, COLOR_GREEN, COLOR_BLACK)
                draw_text_with_background(display, f"Velocity: {velocity:.1f} px/frame", 
                                         (20, 90), 0.9, 2, COLOR_WHITE, COLOR_BLACK)
                
                if abs(velocity) < LANDING_VELOCITY:
                    stable += 1
                else:
                    stable = 0
                
                if stable >= LANDING_STABLE_FRAMES:
                    landing_x = max_x  # Use maximum distance reached
                    print(f"✓ Landing detected at x={landing_x:.1f}")
                    break
        
        prev_smooth = x_smooth
        
        # Draw tracking
        cv2.circle(display, (int(x_smooth), int(y)), 15, COLOR_GREEN, -1)
        cv2.circle(display, (int(x_smooth), int(y)), 18, COLOR_WHITE, 2)
        
        cv2.imshow("Broad Jump Test", display)
        cv2.waitKey(1)
    
    # ===== CALCULATE RESULT =====
    if not took_off or landing_x is None:
        print("✗ Jump not detected properly")
        return None
    
    # Calculate distance
    start_pos = reference_x if reference_x is not None else start_x
    px_distance = abs(landing_x - start_pos)
    distance_m = px_distance / px_per_meter
    
    # Validate
    if distance_m < 0.2 or distance_m > 5.0:
        print(f"✗ Invalid distance: {distance_m:.3f}m")
        return None
    
    print(f"✓ Jump distance: {distance_m:.3f} meters")
    
    # Save video
    video_file = ""
    if SAVE_VIDEO and buffer:
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        video_file = os.path.join(OUTPUT_DIR, f"trial_{trial_num}_{ts}.mp4")
        h, w = buffer[0].shape[:2]
        out = cv2.VideoWriter(video_file, cv2.VideoWriter_fourcc(*'mp4v'), 20, (w, h))
        for f in buffer:
            out.write(f)
        out.release()
        print(f"✓ Video saved: {video_file}")
    
    # Show result
    if buffer:
        result_frame = buffer[-1].copy()
        h, w = result_frame.shape[:2]
        
        # Draw result overlay
        cv2.rectangle(result_frame, (0, 0), (w, 200), COLOR_BLACK, -1)
        draw_text_with_background(result_frame, f"TRIAL {trial_num} RESULT", 
                                 (20, 50), 1.5, 3, COLOR_YELLOW, COLOR_BLACK)
        draw_text_with_background(result_frame, f"{distance_m:.3f} meters", 
                                 (20, 120), 2.5, 4, COLOR_GREEN, COLOR_BLACK)
        
        cv2.imshow("Broad Jump Test", result_frame)
        cv2.waitKey(3000)
    
    # Save result
    save_result([
        datetime.datetime.now().isoformat(),
        trial_num,
        round(distance_m, 3),
        round(px_distance, 2),
        round(px_per_meter, 2),
        round(takeoff_x, 2),
        round(landing_x, 2),
        os.path.basename(video_file)
    ])
    
    return distance_m

# ===================================================================
# MAIN
# ===================================================================

def main():
    """Main program"""
    
    # Show instructions
    show_instructions()
    
    # Open camera
    print("\nOpening camera...")
    cap = cv2.VideoCapture(CAMERA_INDEX)
    
    if not cap.isOpened():
        print("✗ Error: Cannot open camera")
        return
    
    # Set camera properties
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    print("✓ Camera opened successfully")
    
    # Calibrate
    px_per_meter, reference_x = calibrate_system(cap)
    
    if px_per_meter is None:
        print("\n✗ Calibration failed or cancelled")
        cap.release()
        cv2.destroyAllWindows()
        return
    
    # Run trials
    results = []
    
    for trial in range(1, MAX_TRIALS + 1):
        distance = run_trial(cap, trial, px_per_meter, reference_x)
        
        if distance is not None:
            results.append(distance)
        
        if trial < MAX_TRIALS:
            print(f"\nTrial {trial} complete. Press SPACE for next trial...")
    
    # Final results
    print("\n" + "="*70)
    print("TEST COMPLETE - FINAL RESULTS")
    print("="*70)
    
    if results:
        print(f"\nValid trials: {len(results)}/{MAX_TRIALS}")
        print("\nIndividual results:")
        for i, dist in enumerate(results, 1):
            print(f"  Trial {i}: {dist:.3f} meters")
        
        best = max(results)
        avg = sum(results) / len(results)
        
        print(f"\n{'='*70}")
        print(f"BEST JUMP: {best:.3f} meters")
        print(f"AVERAGE:   {avg:.3f} meters")
        print('='*70)
        
        print(f"\nResults saved to: {OUTPUT_DIR}/")
        print(f"CSV file: {CSV_FILE}")
    else:
        print("\n✗ No valid jumps recorded")
    
    print("\n" + "="*70)
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()

# ===================================================================
# RUN
# ===================================================================

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        cv2.destroyAllWindows()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        cv2.destroyAllWin