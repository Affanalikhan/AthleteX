"""
Medicine Ball Power Coach - Video Analysis
Upload video → Analyze → Get scores and recommendations
"""

from ultralytics import YOLO
import cv2
import numpy as np
import sys
from pathlib import Path

class MedicineBallAnalyzer:
    def __init__(self):
        print("="*70)
        print("MEDICINE BALL POWER COACH - VIDEO ANALYZER")
        print("="*70)
        print("\nLoading AI models...")
        
        self.pose_model = YOLO('yolov8n-pose.pt')
        self.object_model = YOLO('yolov8n.pt')
        
        print("✓ Models loaded")
        print("="*70)
    
    def analyze(self, video_path):
        """Analyze video and return scores"""
        
        print(f"\n📹 Analyzing: {Path(video_path).name}")
        print("-"*70)
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"❌ Cannot open video: {video_path}")
            return None
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"Video: {total_frames} frames @ {fps:.1f} FPS")
        print("Processing...")
        
        # Collect data
        knee_angles = []
        hip_angles = []
        trunk_angles = []
        ball_speeds = []
        left_knee = []
        right_knee = []
        
        frame_idx = 0
        prev_ball = None
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process every 3rd frame
            if frame_idx % 3 == 0:
                # Pose detection
                pose_results = self.pose_model(frame, conf=0.5, verbose=False)
                
                # Ball detection
                object_results = self.object_model(frame, conf=0.3, verbose=False)
                
                # Extract keypoints
                if pose_results[0].keypoints is not None:
                    kp = pose_results[0].keypoints.data[0].cpu().numpy()
                    
                    # Left knee angle
                    if kp[11][2] > 0.5 and kp[13][2] > 0.5 and kp[15][2] > 0.5:
                        angle = self.calc_angle(kp[11][:2], kp[13][:2], kp[15][:2])
                        knee_angles.append(angle)
                        left_knee.append(angle)
                    
                    # Right knee angle
                    if kp[12][2] > 0.5 and kp[14][2] > 0.5 and kp[16][2] > 0.5:
                        angle = self.calc_angle(kp[12][:2], kp[14][:2], kp[16][:2])
                        right_knee.append(angle)
                    
                    # Hip angle
                    if kp[5][2] > 0.5 and kp[11][2] > 0.5 and kp[13][2] > 0.5:
                        angle = self.calc_angle(kp[5][:2], kp[11][:2], kp[13][:2])
                        hip_angles.append(angle)
                    
                    # Trunk angle
                    if kp[5][2] > 0.5 and kp[11][2] > 0.5:
                        dy = kp[11][1] - kp[5][1]
                        dx = abs(kp[11][0] - kp[5][0]) + 0.001
                        trunk_angles.append(abs(np.arctan(dy/dx) * 180 / np.pi))
                
                # Ball tracking
                for result in object_results:
                    if result.boxes is not None:
                        for box in result.boxes:
                            cls = int(box.cls[0])
                            if cls == 32:  # Sports ball
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                ball_pos = ((x1+x2)/2, (y1+y2)/2)
                                
                                if prev_ball is not None:
                                    speed = np.sqrt((ball_pos[0]-prev_ball[0])**2 + 
                                                   (ball_pos[1]-prev_ball[1])**2)
                                    ball_speeds.append(speed)
                                
                                prev_ball = ball_pos
                                break
            
            frame_idx += 1
            if frame_idx % 30 == 0:
                print(f"  {int(frame_idx/total_frames*100)}%")
        
        cap.release()
        
        print("✓ Analysis complete\n")
        
        # Calculate scores
        results = self.calculate_scores(
            knee_angles, hip_angles, trunk_angles, 
            ball_speeds, left_knee, right_knee
        )
        
        self.display_results(results)
        
        return results
    
    def calc_angle(self, a, b, c):
        """Calculate angle between 3 points"""
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)
        
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)
        
        if angle > 180.0:
            angle = 360-angle
        
        return angle
    
    def calculate_scores(self, knee_angles, hip_angles, trunk_angles, 
                        ball_speeds, left_knee, right_knee):
        """Calculate all performance scores"""
        
        # Technique Quality (0-100)
        technique = 100
        
        min_knee = min(knee_angles) if knee_angles else 180
        if min_knee > 140:
            technique -= 15  # Shallow knee bend
        
        min_hip = min(hip_angles) if hip_angles else 180
        if min_hip > 120:
            technique -= 10  # Limited hip flexion
        
        avg_trunk = np.mean(trunk_angles) if trunk_angles else 90
        if avg_trunk < 75:
            technique -= 10  # Too much forward lean
        
        # Power Score (0-10)
        max_speed = max(ball_speeds) if ball_speeds else 0
        power = min(10, (max_speed / 15) * 10)
        
        # Explosiveness (0-10)
        if ball_speeds:
            speed_increase = max(ball_speeds) - min(ball_speeds)
            explosiveness = min(10, (speed_increase / 10) * 10)
        else:
            explosiveness = 5
        
        # Symmetry (0-10)
        if left_knee and right_knee:
            avg_left = np.mean(left_knee)
            avg_right = np.mean(right_knee)
            diff = abs(avg_left - avg_right)
            symmetry = max(0, 10 - (diff / 10))
        else:
            symmetry = 7
        
        # Safety/Control (0-10)
        safety = 10
        if min_knee < 90:
            safety -= 2  # Too deep, risky
        if avg_trunk < 70:
            safety -= 2  # Excessive lean
        
        # Release velocity
        release_vel = (max_speed * 0.1) if ball_speeds else 0
        
        return {
            'power_score': round(power, 1),
            'technique_quality': round(technique, 1),
            'explosiveness': round(explosiveness, 1),
            'symmetry_score': round(symmetry, 1),
            'safety_control': round(safety, 1),
            'release_velocity': round(release_vel, 1),
            'min_knee_angle': round(min_knee, 1),
            'min_hip_angle': round(min_hip, 1),
            'avg_trunk_angle': round(avg_trunk, 1),
        }
    
    def display_results(self, results):
        """Display results dashboard"""
        
        print("="*70)
        print("📊 PERFORMANCE DASHBOARD")
        print("="*70)
        
        print("\n🎯 SCORES:")
        print(f"  Power Score:        {results['power_score']}/10")
        print(f"  Technique Quality:  {results['technique_quality']}/100")
        print(f"  Explosiveness:      {results['explosiveness']}/10")
        print(f"  Symmetry:           {results['symmetry_score']}/10")
        print(f"  Safety/Control:     {results['safety_control']}/10")
        print(f"  Release Velocity:   {results['release_velocity']} m/s")
        
        print("\n📐 KEY ANGLES:")
        print(f"  Max Knee Flexion:   {results['min_knee_angle']}°")
        print(f"  Max Hip Flexion:    {results['min_hip_angle']}°")
        print(f"  Trunk Angle:        {results['avg_trunk_angle']}°")
        
        print("\n✅ STRENGTHS:")
        if results['technique_quality'] >= 85:
            print("  • Excellent overall technique")
        if results['symmetry_score'] >= 8:
            print("  • Great left-right balance")
        if results['safety_control'] >= 8:
            print("  • Good movement control")
        if results['power_score'] >= 7:
            print("  • Strong power generation")
        
        print("\n💡 AREAS TO IMPROVE:")
        if results['min_knee_angle'] > 140:
            print("  • Increase knee bend during loading phase")
        if results['min_hip_angle'] > 120:
            print("  • Deeper hip flexion for more power")
        if results['avg_trunk_angle'] < 75:
            print("  • Keep trunk more upright at release")
        if results['symmetry_score'] < 7:
            print("  • Work on left-right symmetry")
        if results['power_score'] < 6:
            print("  • Focus on explosive power development")
        
        print("\n🏋️ RECOMMENDED EXERCISES:")
        if results['min_knee_angle'] > 140:
            print("  • Goblet Squats - Build loading strength")
            print("  • Box Jumps - Improve knee flexion")
        if results['power_score'] < 7:
            print("  • Medicine Ball Slams - Develop power")
            print("  • Plyometric Push-ups - Upper body explosiveness")
        if results['symmetry_score'] < 7:
            print("  • Single-leg exercises - Balance training")
        
        print("\n" + "="*70)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_video.py <video_file>")
        print("Example: python analyze_video.py my_throw.mp4")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    if not Path(video_path).exists():
        print(f"Error: Video file not found: {video_path}")
        sys.exit(1)
    
    analyzer = MedicineBallAnalyzer()
    results = analyzer.analyze(video_path)
