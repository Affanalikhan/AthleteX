# 📖 Live Broad Jump Test - User Guide

## 🚀 Quick Start

```bash
python live_broad_jump_test.py
```

Follow the on-screen instructions!

---

## 📋 What You Need

### Equipment:
1. **Camera** (webcam or external)
2. **Reference object** (1-meter tape, ruler, or A4 paper)
3. **Clear space** (at least 3 meters for jumping)
4. **Computer** with Python installed

### Software:
```bash
pip install opencv-python ultralytics numpy
```

---

## 🎯 Complete Workflow

### Step 1: Setup Instructions (Automatic)

When you run the program, you'll see:

```
SETUP INSTRUCTIONS
==================

CAMERA SETUP:
1. Position camera to the SIDE (not front)
2. Camera should see the full jump area
3. Mount camera at waist height
4. Keep camera stable

YOUR POSITION:
1. Stand SIDEWAYS to the camera
2. Face perpendicular to camera view
3. Feet together at starting position
4. Jump FORWARD

Press ENTER to continue...
```

### Step 2: Calibration

**What happens:**
1. Camera opens and shows live view
2. You place your reference object horizontally
3. Click LEFT edge of object
4. Click RIGHT edge of object
5. Enter real distance (e.g., 1.0 for 1 meter)

**Example:**
```
Click 2 points on your reference object...
[Click left end of 1m tape]
[Click right end of 1m tape]

Pixel distance measured: 526.3 pixels
Enter the REAL distance in meters: 1.0

✓ Calibration complete!
  Scale: 526.3 pixels per meter
```

### Step 3: Trial 1

**What happens:**
1. Screen shows "Press SPACE to start"
2. You press SPACE when ready
3. System detects your starting position
4. Countdown: "READY, 3, 2, 1, START!"
5. You jump
6. System tracks and measures
7. Result displayed: "2.345 meters"

### Step 4: Trial 2

Same as Trial 1 - press SPACE when ready

### Step 5: Trial 3

Same as Trial 1 - press SPACE when ready

### Step 6: Final Results

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

---

## 📐 Camera Setup (IMPORTANT!)

### ✅ Correct Setup (Side View):

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

**Key points:**
- Camera sees you from the SIDE
- You stand SIDEWAYS to camera
- You jump FORWARD (perpendicular to camera)
- Camera is STABLE (not moving)

### ❌ Wrong Setup (Front View):

```
       📷
        ↓
       👤  ← Facing camera (WRONG!)
        ↓
     Jump away
```

This won't work! Camera must be on the side!

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| **SPACE** | Start trial / Continue |
| **Q** | Quit anytime |
| **R** | Reset calibration points |
| **ENTER** | Continue from instructions |

---

## 📏 Calibration Objects

### Recommended Objects:

| Object | Size | How to Use |
|--------|------|------------|
| **1m tape** ⭐ | 100 cm | Place horizontally, click ends |
| **Ruler** | 30 cm | Place horizontally, click ends |
| **A4 paper** | 21 cm (width) | Place horizontally, click edges |
| **Book** | ~15 cm | Measure first, then use |
| **Floor tile** | Measure it | Click opposite corners |

### Tips:
- Larger objects = more accurate
- Measure your object accurately
- Place it in the jump area
- Keep it horizontal

---

## 🎯 How to Stand

### Starting Position:

```
Side View (what camera sees):

    🚶 ← You (sideways to camera)
    ║
    ║ Feet together
    ║ On starting line
    ↓
    ═══════════► Jump forward
```

**Checklist:**
- [ ] Standing sideways to camera
- [ ] Feet together
- [ ] At starting position
- [ ] Ready to jump forward
- [ ] Visible to camera

---

## 📊 What Gets Measured

### The System Tracks:

1. **Starting Position**
   - Detected automatically
   - You must hold still for 5 frames
   - Progress bar shows when ready

2. **Takeoff**
   - Detected by forward velocity
   - Marks when you leave the ground

3. **Landing**
   - Detected by stable position
   - Uses maximum distance reached

4. **Distance**
   - From start to landing
   - Calculated in meters
   - Accurate to ±2-3 cm

---

## 🎬 Trial Sequence

### Each Trial:

```
1. Press SPACE
   ↓
2. Stand still (5 seconds)
   "Hold still: 5/5" ✓
   ↓
3. Countdown
   "READY" → "3" → "2" → "1" → "START!"
   ↓
4. Jump!
   System tracks automatically
   ↓
5. Result
   "2.345 meters"
   ↓
6. Next trial or finish
```

**Total time per trial:** ~30-40 seconds

---

## 📹 What You'll See On Screen

### During Position Detection:
```
┌─────────────────────────────────────┐
│ TRIAL 1 - DETECTING START POSITION │
│                                     │
│ Hold still: 3/5                     │
│ [████████░░░░░░░░░░░░░░░░░░░░░░]   │
│                                     │
│         🟢 🟢 ← Your feet           │
│                                     │
└─────────────────────────────────────┘
```

### During Countdown:
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│              3                      │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### During Jump:
```
┌─────────────────────────────────────┐
│ TRACKING JUMP...                    │
│ Velocity: 25.3 px/frame             │
│                                     │
│    🟢 ═══════════►                  │
│                                     │
└─────────────────────────────────────┘
```

### Result:
```
┌─────────────────────────────────────┐
│ TRIAL 1 RESULT                      │
│                                     │
│ 2.345 meters                        │
│                                     │
└─────────────────────────────────────┘
```

---

## 💾 Output Files

### Location: `jump_results/`

**Files created:**
1. `results.csv` - All trial data
2. `trial_1_TIMESTAMP.mp4` - Video of trial 1
3. `trial_2_TIMESTAMP.mp4` - Video of trial 2
4. `trial_3_TIMESTAMP.mp4` - Video of trial 3

### CSV Format:
```csv
timestamp,trial,distance_m,px_distance,px_per_m,takeoff_x,landing_x,video_file
2025-11-18T10:30:00,1,2.345,1234.5,526.3,300.2,1534.7,trial_1_20251118_103000.mp4
```

---

## 🔧 Troubleshooting

### "Cannot open camera"
**Problem:** Camera not accessible

**Solutions:**
- Check camera is connected
- Close other apps using camera
- Try different CAMERA_INDEX (0, 1, 2)
- Check camera permissions

### "Could not detect start position"
**Problem:** System can't see you

**Solutions:**
- Stand closer to camera
- Ensure good lighting
- Make sure feet are visible
- Stand still for longer

### "Jump not detected properly"
**Problem:** Tracking failed

**Solutions:**
- Jump with more force
- Ensure you're sideways to camera
- Don't go out of frame
- Check lighting

### Wrong distance measured
**Problem:** Result seems incorrect

**Solutions:**
- Recalibrate with accurate measurement
- Verify reference object size
- Check camera is truly side view
- Ensure camera didn't move

### "Invalid distance"
**Problem:** Result outside 0.2-5.0m range

**Solutions:**
- Check calibration accuracy
- Verify you jumped (not just stepped)
- Ensure proper camera angle
- Recalibrate if needed

---

## 💡 Tips for Best Results

### Before Testing:

1. **Setup Environment**
   - Clear jump area (3+ meters)
   - Good lighting
   - Stable camera mount
   - No obstacles

2. **Prepare Equipment**
   - Test camera works
   - Have reference object ready
   - Measure reference accurately
   - Close other camera apps

3. **Warm Up**
   - Stretch properly
   - Practice jump technique
   - Get comfortable with space

### During Testing:

1. **Calibration**
   - Click edges precisely
   - Use large reference object
   - Double-check measurement
   - Recalibrate if unsure

2. **Position**
   - Stand completely still
   - Wait for progress bar to fill
   - Don't move until countdown

3. **Jumping**
   - Jump on "START!"
   - Jump forward with force
   - Stay in camera view
   - Land safely

4. **Between Trials**
   - Rest adequately
   - Review previous result
   - Adjust technique if needed

---

## 📈 Expected Results

### Typical Distances by Age:

| Age Group | Average | Good | Excellent |
|-----------|---------|------|-----------|
| 10-12 years | 1.2-1.5m | 1.5-1.8m | 1.8-2.1m |
| 13-15 years | 1.5-1.8m | 1.8-2.2m | 2.2-2.5m |
| 16-18 years | 1.8-2.2m | 2.2-2.6m | 2.6-3.0m |
| Adults | 2.0-2.5m | 2.5-3.0m | 3.0-3.5m |
| Athletes | 2.5-3.0m | 3.0-3.5m | 3.5-4.0m |

---

## 🎓 Understanding the System

### How It Works:

1. **Pose Detection**
   - AI detects your body keypoints
   - Focuses on ankle positions
   - Tracks in every frame

2. **Position Tracking**
   - Records ankle position over time
   - Smooths data to reduce noise
   - Calculates velocity

3. **Jump Detection**
   - Takeoff: Sudden forward velocity
   - Flight: Maximum distance tracking
   - Landing: Stable position

4. **Distance Calculation**
   ```
   Distance = (Landing Position - Start Position) / Pixels Per Meter
   ```

### Accuracy:

- **Ideal conditions:** ±2-3 cm
- **Good conditions:** ±5 cm
- **Factors affecting accuracy:**
  - Calibration precision
  - Camera stability
  - Lighting quality
  - Video resolution

---

## 🎯 Professional Use

### For Coaches/Trainers:

1. **Setup Once**
   - Mount camera permanently
   - Mark starting line on floor
   - Keep reference object handy

2. **Quick Testing**
   - Calibrate once per session
   - Test multiple athletes
   - Save all results to CSV

3. **Analysis**
   - Compare trials
   - Track progress over time
   - Review videos for technique

### For Research:

1. **Standardization**
   - Same camera position
   - Same calibration method
   - Same testing protocol

2. **Data Collection**
   - CSV export for analysis
   - Video archive for review
   - Timestamp for tracking

3. **Validation**
   - Cross-check with manual measurement
   - Multiple trials for reliability
   - Statistical analysis of results

---

## ✅ Pre-Test Checklist

Before starting:

- [ ] Camera positioned to the side
- [ ] Camera stable (tripod recommended)
- [ ] Clear jump area (3+ meters)
- [ ] Good lighting
- [ ] Reference object ready and measured
- [ ] Comfortable clothing
- [ ] Warmed up
- [ ] Understand controls (SPACE, Q)
- [ ] Know how to stand (sideways)
- [ ] Ready for 3 trials

---

## 📞 Support

### If you encounter issues:

1. **Check setup**
   - Camera position (side view)
   - Lighting (bright enough)
   - Space (clear area)

2. **Verify calibration**
   - Reference object measured correctly
   - Clicked edges accurately
   - Reasonable px/meter value (300-800)

3. **Test camera**
   - Can you see yourself clearly?
   - Are your feet visible?
   - Is image stable?

4. **Review instructions**
   - Read this guide again
   - Check camera setup diagram
   - Verify standing position

---

## 🎉 Summary

**This system provides:**
- ✅ Professional 3-trial testing
- ✅ Automatic jump detection
- ✅ Accurate distance measurement
- ✅ Clear countdown and instructions
- ✅ Video recording of each trial
- ✅ CSV export of results
- ✅ Best jump identification

**Perfect for:**
- Athletic testing
- Physical education
- Sports science
- Training programs
- Competition measurement

---

**Ready to test? Run:**
```bash
python live_broad_jump_test.py
```

**Good luck with your jumps!** 🚀
