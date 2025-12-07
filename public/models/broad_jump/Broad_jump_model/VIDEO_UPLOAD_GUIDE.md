# 📹 Video Upload - Broad Jump Analysis Guide

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   python run_server.py
   ```

2. **Open in browser:**
   ```
   http://localhost:8000/video_upload_jump.html
   ```

3. **Upload your video and follow the instructions!**

---

## 📋 Video Requirements

### ✅ Required Setup:

```
    📷 Camera (Side View)
    ↓
    ┌─────────────────────────────────────┐
    │                                     │
    │  🚶 ═══════════► 🏃                │
    │  Person       Jump forward          │
    │  (sideways)                         │
    │                                     │
    └─────────────────────────────────────┘
```

### Video Must Have:

- ✅ **Side view** - Camera positioned to the side (not front)
- ✅ **Sideways person** - Jumper stands sideways to camera
- ✅ **Forward jump** - Jump perpendicular to camera view
- ✅ **Full visibility** - Entire jump from start to landing visible
- ✅ **Stable camera** - No camera movement during recording
- ✅ **Good lighting** - Clear, well-lit video
- ✅ **Reference object** - Include something of known size (ruler, tape, etc.)

### Supported Formats:
- MP4 (recommended)
- AVI
- MOV
- WebM

---

## 🎯 How to Use

### Step 1: Upload Video

**Option A: Click to Upload**
1. Click the upload box
2. Select your video file
3. Wait for video to load

**Option B: Drag and Drop**
1. Drag video file from your computer
2. Drop it on the upload box
3. Wait for video to load

### Step 2: Calibration

**Purpose:** Tell the system how to convert pixels to meters

**Process:**
1. Video will pause on first frame
2. Click on the **LEFT edge** of a known-size object (e.g., 1-meter tape)
3. Click on the **RIGHT edge** of the same object
4. Enter the real distance in meters (e.g., 1.0 for 1 meter)
5. Click "Confirm Calibration"

**Tips:**
- Use the largest reference object available
- Click edges precisely
- Measure your reference object accurately
- Common objects:
  - 1-meter tape: 1.0 meters
  - 30cm ruler: 0.3 meters
  - A4 paper width: 0.21 meters

### Step 3: Analyze Jump

1. Click "Analyze Jump" button
2. System will process entire video
3. Progress bar shows analysis status
4. AI detects person's position in each frame
5. Results displayed automatically

### Step 4: View Results

**You'll see:**
- Jump distance in meters
- Start position (time and location)
- End position (time and location)
- Visual trajectory on video
- Detailed statistics

---

## 📊 What Gets Analyzed

### Detection Process:

1. **AI Pose Detection**
   - Detects 17 body keypoints
   - Focuses on ankle positions
   - Tracks movement frame-by-frame

2. **Start Position**
   - Finds stable starting position
   - Uses first 20% of video
   - Averages position for accuracy

3. **End Position**
   - Finds maximum distance reached
   - Identifies landing point
   - Uses most forward position

4. **Distance Calculation**
   ```
   Distance (meters) = Pixel Distance / Pixels Per Meter
   ```

### Accuracy:
- **Ideal conditions:** ±2-3 cm
- **Good conditions:** ±5 cm
- **Factors affecting accuracy:**
  - Calibration precision
  - Video quality
  - Camera stability
  - Lighting conditions

---

## 🎬 Recording Tips

### Camera Setup:

1. **Position**
   - Place camera on the SIDE
   - 3-4 meters away from jump area
   - Waist height
   - Stable mount (tripod recommended)

2. **Framing**
   - Include entire jump area
   - Show starting position
   - Show landing area
   - Include reference object

3. **Settings**
   - 30 FPS or higher
   - 1080p resolution (minimum 720p)
   - Good lighting
   - No camera movement

### Before Recording:

- [ ] Camera positioned to side
- [ ] Camera stable (tripod)
- [ ] Reference object visible
- [ ] Good lighting
- [ ] Clear background
- [ ] Full jump area in frame

### During Recording:

- [ ] Start recording before jump
- [ ] Keep camera still
- [ ] Record entire jump
- [ ] Continue recording after landing
- [ ] Stop recording

---

## 🔧 Troubleshooting

### "Video won't upload"
**Solutions:**
- Check file format (MP4, AVI, MOV, WebM)
- Ensure file size is reasonable (< 500MB)
- Try different browser (Chrome recommended)
- Check internet connection

### "Cannot detect person"
**Solutions:**
- Ensure person is clearly visible
- Check video quality
- Improve lighting in video
- Make sure person is sideways to camera
- Verify camera angle is from the side

### "Inaccurate distance"
**Solutions:**
- Recalibrate with accurate measurement
- Use larger reference object
- Click calibration points more precisely
- Verify reference object measurement
- Check camera was truly side view

### "Analysis takes too long"
**Solutions:**
- Use shorter video (10-20 seconds ideal)
- Reduce video resolution
- Close other browser tabs
- Use faster computer
- Try Chrome browser (best performance)

### "Jump not detected"
**Solutions:**
- Ensure full jump is visible in video
- Check person doesn't go out of frame
- Verify camera angle (side view)
- Make sure jump has clear start and end
- Try recording with better lighting

---

## 💡 Best Practices

### For Accurate Results:

1. **Video Quality**
   - Record in good lighting
   - Use stable camera mount
   - 1080p resolution minimum
   - 30 FPS or higher

2. **Camera Angle**
   - Perfect side view
   - Perpendicular to jump direction
   - No angle or tilt
   - Waist height

3. **Calibration**
   - Use 1-meter tape (best)
   - Place horizontally in jump area
   - Click edges precisely
   - Measure accurately

4. **Jump Execution**
   - Stand sideways to camera
   - Jump forward (perpendicular)
   - Stay in frame throughout
   - Clear start and landing

---

## 📈 Expected Results

### Typical Distances:

| Age Group | Average | Good | Excellent |
|-----------|---------|------|-----------|
| 10-12 years | 1.2-1.5m | 1.5-1.8m | 1.8-2.1m |
| 13-15 years | 1.5-1.8m | 1.8-2.2m | 2.2-2.5m |
| 16-18 years | 1.8-2.2m | 2.2-2.6m | 2.6-3.0m |
| Adults | 2.0-2.5m | 2.5-3.0m | 3.0-3.5m |
| Athletes | 2.5-3.0m | 3.0-3.5m | 3.5-4.0m |

---

## 🎯 Use Cases

### Perfect For:

- **Analyzing recorded jumps** - Review past performances
- **Remote testing** - Send video, get results
- **Multiple attempts** - Record all jumps, analyze later
- **Technique review** - Study jump form and distance
- **Competition verification** - Verify jump distances
- **Training analysis** - Track progress over time

---

## 🔒 Privacy

- ✅ All processing happens in your browser
- ✅ No video uploaded to servers
- ✅ No data sent anywhere
- ✅ Video stays on your computer
- ✅ Results stored locally only

---

## 📊 Results Display

### What You Get:

```
🎉 Jump Analysis Results

2.345 meters

Start Position: 245.3 px at 1.25s
End Position: 1479.8 px at 2.10s
Pixel Distance: 1234.5 pixels
Scale: 526.3 pixels/meter
Data Points: 45 frames analyzed
Jump Duration: 0.85 seconds
```

### Visual Display:

- Green trajectory line showing movement
- Green circle at START position
- Red circle at END position
- Yellow line showing distance
- Distance measurement overlay

---

## ✅ Pre-Upload Checklist

Before uploading video:

- [ ] Video recorded from side view
- [ ] Person jumps sideways to camera
- [ ] Full jump visible in frame
- [ ] Reference object included
- [ ] Good lighting
- [ ] Stable camera (no movement)
- [ ] Clear start and landing
- [ ] Video format supported (MP4, AVI, MOV, WebM)

---

## 🎉 Summary

**This tool allows you to:**
- Upload pre-recorded jump videos
- Analyze jump distance accurately
- Get detailed statistics
- Review jump trajectory
- No live camera needed
- Process multiple videos

**Perfect for:**
- Remote testing
- Post-event analysis
- Training review
- Competition verification
- Progress tracking

---

## 🚀 Getting Started

```bash
# 1. Start server
python run_server.py

# 2. Open browser
http://localhost:8000/video_upload_jump.html

# 3. Upload video

# 4. Calibrate

# 5. Analyze

# 6. Get results!
```

---

**Upload your video and get accurate jump measurements in seconds!** 🎯

