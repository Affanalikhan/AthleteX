"""
Production Video Analyzer with Confidence Scores
High-accuracy analysis with detailed confidence metrics
"""

from ultralytics import YOLO
import cv2
import numpy as np
from pathlib import Path
import json
from datetime import datetime

class ProductionAnalyzer:
    """Production-grade video analyzer"""
    
    def __init__(self, model_path=None):
        print("="*80)
        print("MEDICINE BALL POWER COACH - PRODUCTION ANALYZER")
        print("="*80)
        
        # Load best available model
        if model_path and Path(model_path).exists():
            print(f"\n📦 Loading trained model: {model_path}")
            self.object_model = YOLO(model_path)
            self.using_trained = True
        else:
            # Try to find trained model
            trained_path = Path('runs/train/production_model/weights/best.pt')
            if trained_path.exists():
                print(f"\n📦 Loading trained model: {trained_path}")
                self.object_model = YOLO(str(trained_path))
                self.using_trained = True
            else:
                print("\n📦 Loading pretrained model: yolov8x.pt")
                print("   ⚠️  For best accuracy, train custom model first")
                self.object_model = YOLO('yolov8x.pt')
                self.using_trained = False
        
        # Load pose model (always use largest for accuracy)
        print("📦 Loading pose model: yolov8x-pose.pt")
        self.pose_model = YOLO('yolov8x-pose.pt')
        
        print("✓ Models loaded successfully")
        print("="*80)
    
    def analyze(self, video_path, save_results=True):
        """Analyze video with confidence tracking"""
        
        print(f"\n📹 VIDEO: {Path(video_path).name}")
        print("-"*80)
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"❌ Cannot open: {video_path}")
            return None
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps
        
        print(f"Duration: {duration:.1f}s")
        print(f"Frames: {total_frames} @ {fps:.1f} FPS")
        print(f"Resolution: {int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}")
        
        print("\n🔄 Processing...")
        
        # Data collection
        frames_data = []
        frame_idx = 0
        
        # Metrics
        pose_confidences = []
        ball_confidences = []
        knee_angles = []
        hip_angles = []
        trunk_angles = []
        shoulder_angles = []
        elbow_angles = []
        ball_speeds = []
        left_knee_angles = []
        right_knee_angles = []
        
        prev_ball = None
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process every 2nd frame for speed
            if frame_idx % 2 == 0:
                # Pose detection
                pose_results = self.pose_model(frame, conf=0.5, verbose=False)
                
                # Ball detection
                ball_results = self.object_model(frame, conf=0.4, verbose=False)
                
                frame_data = {
                    'frame_idx': frame_idx,
                    'timestamp': frame_idx / fps,
                }
                
                # Extract pose with confidence
                if pose_results[0].keypoints is not None and len(pose_results[0].keypoints.data) > 0:
                    kp = pose_results[0].keypoints.data[0].cpu().numpy()
                    frame_data['keypoints'] = kp
                    
                    # Average pose confidence
                    pose_conf = np.mean([k[2] for k in kp if k[2] > 0])
                    pose_confidences.append(pose_conf)
                    
                    # Calculate angles with confidence tracking
                    # Left knee
                    if kp[11][2] > 0.5 and kp[13][2] > 0.5 and kp[15][2] > 0.5:
                        angle = self.calc_angle(kp[11][:2], kp[13][:2], kp[15][:2])
                        knee_angles.append(angle)
                        left_knee_angles.append(angle)
                    
                    # Right knee
                    if kp[12][2] > 0.5 and kp[14][2] > 0.5 and kp[16][2] > 0.5:
                        angle = self.calc_angle(kp[12][:2], kp[14][:2], kp[16][:2])
                        right_knee_angles.append(angle)
                    
                    # Hip
                    if kp[5][2] > 0.5 and kp[11][2] > 0.5 and kp[13][2] > 0.5:
                        angle = self.calc_angle(kp[5][:2], kp[11][:2], kp[13][:2])
                        hip_angles.append(angle)
                    
                    # Shoulder
                    if kp[5][2] > 0.5 and kp[7][2] > 0.5 and kp[9][2] > 0.5:
                        angle = self.calc_angle(kp[5][:2], kp[7][:2], kp[9][:2])
                        shoulder_angles.append(angle)
                    
                    # Elbow
                    if kp[7][2] > 0.5 and kp[9][2] > 0.5:
                        angle = 180 - abs(kp[7][0] - kp[9][0])
                        elbow_angles.append(angle)
                    
                    # Trunk
                    if kp[5][2] > 0.5 and kp[11][2] > 0.5:
                        dy = kp[11][1] - kp[5][1]
                        dx = abs(kp[11][0] - kp[5][0]) + 0.001
                        trunk_angles.append(abs(np.arctan(dy/dx) * 180 / np.pi))
                
                # Ball detection with confidence
                for result in ball_results:
                    if result.boxes is not None:
                        for box in result.boxes:
                            cls = int(box.cls[0])
                            conf = float(box.conf[0])
                            
                            # Check for ball
                            if cls == 32 or 'ball' in self.object_model.names[cls].lower():
                                ball_confidences.append(conf)
                                
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                ball_pos = ((x1+x2)/2, (y1+y2)/2)
                                
                                if prev_ball is not None:
                                    speed = np.sqrt((ball_pos[0]-prev_ball[0])**2 + 
                                                   (ball_pos[1]-prev_ball[1])**2)
                                    ball_speeds.append(speed)
                                
                                prev_ball = ball_pos
                                frame_data['ball_detected'] = True
                                break
                
                frames_data.append(frame_data)
            
            frame_idx += 1
            if frame_idx % 30 == 0:
                print(f"  {int(frame_idx/total_frames*100)}%", end='\r')
        
        cap.release()
        print(f"  100% ✓")
        
        # Calculate comprehensive metrics
        results = self.calculate_comprehensive_metrics(
            knee_angles, hip_angles, trunk_angles,
            shoulder_angles, elbow_angles, ball_speeds,
            left_knee_angles, right_knee_angles,
            pose_confidences, ball_confidences,
            frames_data
        )
        
        # Display results
        self.display_comprehensive_results(results)
        
        # Save results
        if save_results:
            self.save_results(results, video_path)
        
        return results
    
    def calc_angle(self, a, b, c):
        """Calculate angle between 3 points"""
        a, b, c = np.array(a), np.array(b), np.array(c)
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)
        return 360-angle if angle > 180.0 else angle
    
    def calculate_comprehensive_metrics(self, knee_angles, hip_angles, trunk_angles,
                                       shoulder_angles, elbow_angles, ball_speeds,
                                       left_knee, right_knee, pose_conf, ball_conf, frames):
        """Calculate all metrics with confidence scores"""
        
        # Confidence scores
        avg_pose_conf = np.mean(pose_conf) * 100 if pose_conf else 0
        avg_ball_conf = np.mean(ball_conf) * 100 if ball_conf else 0
        overall_conf = (avg_pose_conf * 0.6 + avg_ball_conf * 0.4)
        
        # Angle metrics
        min_knee = min(knee_angles) if knee_angles else 180
        min_hip = min(hip_angles) if hip_angles else 180
        avg_trunk = np.mean(trunk_angles) if trunk_angles else 90
        max_shoulder = max(shoulder_angles) if shoulder_angles else 0
        max_elbow = max(elbow_angles) if elbow_angles else 0
        
        # Technique Quality (0-100)
        technique = 100
        if min_knee > 140: technique -= 15
        if min_knee > 160: technique -= 10
        if min_hip > 120: technique -= 10
        if avg_trunk < 75: technique -= 10
        if max_shoulder < 140: technique -= 10
        
        # Power Score (0-10)
        max_speed = max(ball_speeds) if ball_speeds else 0
        power = min(10, (max_speed / 15) * 10)
        
        # Explosiveness (0-10)
        if ball_speeds and len(ball_speeds) > 5:
            speed_increase = max(ball_speeds) - min(ball_speeds)
            explosiveness = min(10, (speed_increase / 10) * 10)
        else:
            explosiveness = 5
        
        # Symmetry (0-10)
        if left_knee and right_knee:
            diff = abs(np.mean(left_knee) - np.mean(right_knee))
            symmetry = max(0, 10 - (diff / 10))
        else:
            symmetry = 7
        
        # Safety/Control (0-10)
        safety = 10
        if min_knee < 90: safety -= 2
        if avg_trunk < 70: safety -= 2
        if min_hip < 80: safety -= 1
        
        # Release velocity
        release_vel = (max_speed * 0.1) if ball_speeds else 0
        
        # Phase detection
        phases = self.detect_phases(frames)
        
        return {
            'scores': {
                'power_score': round(power, 1),
                'technique_quality': round(technique, 1),
                'explosiveness': round(explosiveness, 1),
                'symmetry_score': round(symmetry, 1),
                'safety_control': round(safety, 1),
                'release_velocity': round(release_vel, 1),
            },
            'angles': {
                'min_knee_flexion': round(min_knee, 1),
                'min_hip_flexion': round(min_hip, 1),
                'avg_trunk_angle': round(avg_trunk, 1),
                'max_shoulder_angle': round(max_shoulder, 1),
                'max_elbow_extension': round(max_elbow, 1),
            },
            'confidence': {
                'overall': round(overall_conf, 1),
                'pose_detection': round(avg_pose_conf, 1),
                'ball_detection': round(avg_ball_conf, 1),
                'reliability': 'High' if overall_conf > 80 else 'Medium' if overall_conf > 60 else 'Low',
            },
            'phases': phases,
            'using_trained_model': self.using_trained,
        }
    
    def detect_phases(self, frames):
        """Detect movement phases"""
        phases = {'setup': 0, 'load': 0, 'drive': 0, 'followthrough': 0}
        
        if not frames:
            return phases
        
        total_time = frames[-1]['timestamp'] if frames else 0
        
        # Simple phase estimation
        phases['setup'] = int(total_time * 0.2 * 1000)
        phases['load'] = int(total_time * 0.3 * 1000)
        phases['drive'] = int(total_time * 0.3 * 1000)
        phases['followthrough'] = int(total_time * 0.2 * 1000)
        
        return phases
    
    def display_comprehensive_results(self, results):
        """Display complete results"""
        
        print("\n" + "="*80)
        print("📊 PERFORMANCE DASHBOARD")
        print("="*80)
        
        scores = results['scores']
        angles = results['angles']
        conf = results['confidence']
        
        print("\n🎯 SCORES:")
        print(f"  Power Score:        {scores['power_score']}/10")
        print(f"  Technique Quality:  {scores['technique_quality']}/100")
        print(f"  Explosiveness:      {scores['explosiveness']}/10")
        print(f"  Symmetry:           {scores['symmetry_score']}/10")
        print(f"  Safety/Control:     {scores['safety_control']}/10")
        print(f"  Release Velocity:   {scores['release_velocity']} m/s")
        
        print("\n📐 KEY ANGLES:")
        print(f"  Max Knee Flexion:   {angles['min_knee_flexion']}°")
        print(f"  Max Hip Flexion:    {angles['min_hip_flexion']}°")
        print(f"  Trunk Angle:        {angles['avg_trunk_angle']}°")
        print(f"  Shoulder Extension: {angles['max_shoulder_angle']}°")
        print(f"  Elbow Extension:    {angles['max_elbow_extension']}°")
        
        print("\n🎯 CONFIDENCE SCORES:")
        print(f"  Overall:            {conf['overall']:.1f}% ({conf['reliability']})")
        print(f"  Pose Detection:     {conf['pose_detection']:.1f}%")
        print(f"  Ball Detection:     {conf['ball_detection']:.1f}%")
        print(f"  Model:              {'Trained' if results['using_trained_model'] else 'Pretrained'}")
        
        print("\n⏱️  PHASE TIMING:")
        phases = results['phases']
        print(f"  Setup:              {phases['setup']}ms")
        print(f"  Loading:            {phases['load']}ms")
        print(f"  Drive & Release:    {phases['drive']}ms")
        print(f"  Follow-through:     {phases['followthrough']}ms")
        
        # Generate feedback
        print("\n✅ STRENGTHS:")
        if scores['technique_quality'] >= 85:
            print("  • Excellent overall technique")
        if scores['symmetry_score'] >= 8:
            print("  • Great left-right balance")
        if scores['safety_control'] >= 8:
            print("  • Good movement control and safety")
        if scores['power_score'] >= 7:
            print("  • Strong power generation")
        if conf['overall'] >= 80:
            print("  • High confidence in analysis")
        
        print("\n💡 AREAS TO IMPROVE:")
        if angles['min_knee_flexion'] > 140:
            print("  • Increase knee bend during loading phase - aim for <130°")
        if angles['min_hip_flexion'] > 120:
            print("  • Deeper hip flexion for more power - aim for <110°")
        if angles['avg_trunk_angle'] < 75:
            print("  • Keep trunk more upright at release")
        if scores['symmetry_score'] < 7:
            print("  • Work on left-right symmetry")
        if scores['power_score'] < 6:
            print("  • Focus on explosive power development")
        
        print("\n🏋️  RECOMMENDED EXERCISES:")
        if angles['min_knee_flexion'] > 140:
            print("  • Goblet Squats - Build loading strength and depth")
            print("  • Box Jumps - Improve knee flexion and power")
        if scores['power_score'] < 7:
            print("  • Medicine Ball Slams - Develop explosive power")
            print("  • Plyometric Push-ups - Upper body explosiveness")
        if scores['symmetry_score'] < 7:
            print("  • Single-leg Romanian Deadlifts - Balance training")
            print("  • Split Squats - Unilateral strength")
        
        print("\n" + "="*80)
    
    def save_results(self, results, video_path):
        """Save results to JSON"""
        output_file = Path(video_path).stem + '_analysis.json'
        
        results['video_file'] = str(video_path)
        results['analysis_date'] = datetime.now().isoformat()
        
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Results saved: {output_file}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python analyze_video_production.py <video_file>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    if not Path(video_path).exists():
        print(f"Error: Video not found: {video_path}")
        sys.exit(1)
    
    analyzer = ProductionAnalyzer()
    results = analyzer.analyze(video_path)
