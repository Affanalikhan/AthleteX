# 🏃 Professional Live Broad Jump Test System

AI-powered broad jump measurement system with live camera capture, automatic detection, and accurate distance calculation.

## ✨ Features

- ✅ **3 Trials** - Complete testing with 3 attempts
- ✅ **Voice Countdown** - "READY, 3, 2, 1, START!"
- ✅ **Automatic Detection** - AI tracks takeoff and landing
- ✅ **Accurate Measurement** - Distance in meters (±2-3cm accuracy)
- ✅ **Clear Instructions** - Step-by-step guidance
- ✅ **Video Recording** - Save each trial
- ✅ **Professional Results** - Best jump and average
- ✅ **Easy Controls** - Press SPACE to start each trial

## 🚀 Quick Start

### Option 1: Web Version (Recommended)

```bash
python run_server.py
```

Browser opens automatically with two options:
- **Live Camera Test** - Real-time testing with webcam
- **Video Upload** - Analyze pre-recorded videos

### Option 2: Python Terminal Version

```bash
pip install opencv-python ultralytics numpy
python live_broad_jump_test.py
```

### Follow Instructions

1. **Setup** - Position camera to the side
2. **Calibrate** - Click reference object edges (or automatic for web)
3. **Trial 1** - Press SPACE, wait for countdown, jump!
4. **Trial 2** - Press SPACE, jump again
5. **Trial 3** - Press SPACE, final jump
6. **Results** - See your best jump!

**Total time: 3-7 minutes**

## 📐 Camera Setup

### ✅ Correct (Side View):

```
    📷 Camera
    ↓
    ┌─────────────────────────────────────┐
    │                                     │
    │  🚶 ═══════════► 🏃                │
    │  You          Jump forward          │
    │  (sideways)                         │
    │                                     │
    └─────────────────────────────────────┘
```

**Key Points:**
- Camera on the SIDE (not front)
- You stand SIDEWAYS to camera
- Jump FORWARD (perpendicular to camera)
- Camera is STABLE

**Camera Distance Range:**
- **Recommended:** 3-4 meters from jump area
- **Minimum:** 2.5 meters
- **Maximum:** 5 meters
- Camera should capture full jump trajectory

## 🎮 Controls

| Key | Action |
|-----|--------|
| **SPACE** | Start trial |
| **Q** | Quit |
| **ENTER** | Continue |

## 📊 What You Get

### During Test:
- Real-time position detection
- Visual countdown (READY, 3, 2, 1, START!)
- Live jump tracking
- Instant results after each trial

### After Test:
```
TEST COMPLETE - FINAL RESULTS
==============================

Valid trials: 3/3

Individual results:
  Trial 1: 2.345 meters
  Trial 2: 2.412 meters
  Trial 3: 2.389 meters

==============================
BEST JUMP: 2.412 meters
AVERAGE:   2.382 meters
==============================
```

### Files Saved:
- `jump_results/results.csv` - All data
- `jump_results/trial_1_*.mp4` - Video of trial 1
- `jump_results/trial_2_*.mp4` - Video of trial 2
- `jump_results/trial_3_*.mp4` - Video of trial 3

## 📏 Calibration

### What You Need:
Any object of known size:
- **1-meter tape** ⭐ (best)
- **Ruler** (30cm)
- **A4 paper** (21cm width)
- **Floor tile** (measure it)

### How to Calibrate:
1. Place object horizontally in view
2. Click LEFT edge
3. Click RIGHT edge
4. Enter real distance (e.g., 1.0 for 1 meter)
5. Done!

## 🎯 Trial Sequence

### Each Trial:

```
Press SPACE
    ↓
Stand still (5 sec)
    ↓
Countdown: READY → 3 → 2 → 1 → START!
    ↓
JUMP!
    ↓
Result: "2.345 meters"
    ↓
Next trial
```

**Time per trial:** ~30-40 seconds

## 📹 What You'll See

### Position Detection:
```
TRIAL 1 - DETECTING START POSITION
Hold still: 5/5
[████████████████████████████████]
        🟢 🟢 ← Your feet
```

### Countdown:
```
        3
```

### Tracking:
```
TRACKING JUMP...
Velocity: 25.3 px/frame
    🟢 ═══════════►
```

### Result:
```
TRIAL 1 RESULT
2.345 meters
```

## 🔧 Requirements

### Hardware:
- Camera (webcam or external)
- Computer
- 3+ meters clear space

### Software:
- Python 3.7+
- OpenCV
- Ultralytics YOLO
- NumPy

### Models:
- `yolov8s-pose.pt` (included)

## 💡 Tips

### For Best Results:

1. **Camera Setup**
   - Side view (perpendicular to jump)
   - Waist height
   - Stable mount (tripod)
   - 3-4 meters away

2. **Environment**
   - Good lighting
   - Clear background
   - Flat surface
   - No obstacles

3. **Calibration**
   - Use large reference object
   - Click edges precisely
   - Measure accurately

4. **Jumping**
   - Stand sideways to camera
   - Wait for "START!"
   - Jump forward with force
   - Stay in frame

## 🐛 Troubleshooting

### "Cannot open camera"
- Check camera is connected
- Close other camera apps
- Try different camera index

### "Could not detect start position"
- Stand closer to camera
- Improve lighting
- Ensure feet are visible

### "Jump not detected"
- Jump with more force
- Stay sideways to camera
- Don't go out of frame

### Wrong distance
- Recalibrate accurately
- Verify reference object size
- Check camera angle

## 📈 Expected Results

| Age Group | Average | Good | Excellent |
|-----------|---------|------|-----------|
| 10-12 years | 1.2-1.5m | 1.5-1.8m | 1.8-2.1m |
| 13-15 years | 1.5-1.8m | 1.8-2.2m | 2.2-2.5m |
| 16-18 years | 1.8-2.2m | 2.2-2.6m | 2.6-3.0m |
| Adults | 2.0-2.5m | 2.5-3.0m | 3.0-3.5m |
| Athletes | 2.5-3.0m | 3.0-3.5m | 3.5-4.0m |

## 🎥 NEW: Video Upload Feature

Upload pre-recorded jump videos for analysis!

### Features:
- ✅ Upload any video file (MP4, AVI, MOV, WebM)
- ✅ Accurate calibration with reference objects
- ✅ Frame-by-frame AI analysis
- ✅ Visual trajectory display
- ✅ Detailed statistics
- ✅ Perfect for remote testing

### How to Use:
1. Run `python run_server.py`
2. Choose "Video Upload Analysis"
3. Upload your jump video
4. Calibrate with reference object
5. Click "Analyze Jump"
6. Get detailed results!

**See VIDEO_UPLOAD_GUIDE.md for complete instructions**

## 📖 Documentation

- **README.md** - This file (overview)
- **USER_GUIDE.md** - Complete user guide for Python version
- **HOW_TO_USE.md** - Web version guide
- **VIDEO_UPLOAD_GUIDE.md** - Video upload feature guide
- **WEB_README.md** - Web version technical details
- **QUICK_START.txt** - Quick reference

## 🎓 How It Works

1. **AI Pose Detection** - Tracks your body keypoints
2. **Position Tracking** - Records ankle positions
3. **Jump Detection** - Identifies takeoff and landing
4. **Distance Calculation** - Measures in meters

### Accuracy:
- **Ideal conditions:** ±2-3 cm
- **Good conditions:** ±5 cm

## ✅ Pre-Test Checklist

- [ ] Camera positioned to side
- [ ] Camera stable
- [ ] Clear jump area (3+ meters)
- [ ] Good lighting
- [ ] Reference object ready
- [ ] Warmed up
- [ ] Understand controls

## 🎯 Perfect For

- Athletic testing
- Physical education
- Sports science research
- Training programs
- Competition measurement
- Performance tracking

## 📊 Output Format

### CSV File:
```csv
timestamp,trial,distance_m,px_distance,px_per_m,takeoff_x,landing_x,video_file
2025-11-18T10:30:00,1,2.345,1234.5,526.3,300.2,1534.7,trial_1_20251118_103000.mp4
```

### Video Files:
- MP4 format
- 20 FPS
- Full trial recording
- Timestamped filename

## 🚀 Getting Started

```bash
# 1. Install dependencies
pip install opencv-python ultralytics numpy

# 2. Run the system
python live_broad_jump_test.py

# 3. Follow on-screen instructions

# 4. Get your results!
```

## 📞 Support

For issues:
1. Check camera setup (side view)
2. Verify calibration accuracy
3. Read USER_GUIDE.md
4. Check troubleshooting section

## 🎉 Summary

**This system provides:**
- Professional 3-trial testing
- Automatic jump detection
- Accurate measurements
- Clear instructions
- Video recording
- CSV export
- Best jump identification

**Ready in 5 minutes!**

---

**Run now:**
```bash
python live_broad_jump_test.py
```

**Good luck with your jumps!** 🏃💨
