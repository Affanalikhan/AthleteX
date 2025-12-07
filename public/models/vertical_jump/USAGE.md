# How to Use - Vertical Jump Coach

## 🎉 READY TO USE NOW!

Your system works with **OpenCV-based pose detection** - no MediaPipe required!

## Three Ways to Analyze Jumps

### 1. 📹 Analyze Uploaded Video Files

```bash
python analyze_video.py your_jump_video.mp4
```

**Supports:** MP4, MOV, AVI, MKV

**Example:**
```bash
python analyze_video.py C:\Videos\my_jump.mp4
```

**Output:**
- Jump height (cm and inches)
- 6 performance scores
- Technique errors detected
- Coaching feedback
- Exercise recommendations
- Phase timing breakdown

---

### 2. 🎥 Real-Time Webcam Analysis

```bash
python realtime_analyzer.py
```

**How it works:**
1. Webcam opens
2. Press SPACE to start recording
3. Perform your jump
4. Press SPACE to stop and get instant analysis
5. Press 'q' to quit

**Perfect for:**
- Practice sessions
- Immediate feedback
- Multiple jump comparisons

---

### 3. 🌐 Web Interface (Upload Videos)

```bash
python start.py
```

Then open http://localhost:8080 in your browser

**Features:**
- Drag & drop video upload
- Beautiful results display
- Save and compare jumps
- Mobile-friendly

---

## Quick Test

### Test with Demo Data
```bash
python demo_analyzer.py
```
See the system work with simulated jump data.

### Test Video Analysis
If you have a jump video:
```bash
python analyze_video.py path/to/video.mp4
```

### Test Real-Time
If you have a webcam:
```bash
python realtime_analyzer.py
```

---

## Recording Tips

### For Best Results:

**Camera Position:**
- 3-5 meters away
- Side view (90 degrees)
- Camera at waist height
- Keep entire body in frame

**Lighting:**
- Good, even lighting
- Avoid backlighting
- No harsh shadows

**Video Quality:**
- 720p or higher
- 30 fps minimum
- 2-3 seconds duration
- Stable camera (not handheld)

**Environment:**
- Clear background
- Flat surface
- Enough space around jumper

---

## What You Get

### Performance Metrics
- **Jump Height**: Calculated in cm and inches
- **Power Score**: 0-100 rating
- **Explosiveness**: Speed and timing
- **Takeoff Efficiency**: Technique optimization
- **Landing Control**: Safety score
- **Quality Score**: Overall technique

### Technique Analysis
- **Error Detection**: 5 types of errors
- **Severity Levels**: Low, medium, high
- **Specific Feedback**: What to fix and how

### Coaching
- **Positive Reinforcement**: What you did well
- **Improvement Tips**: Actionable suggestions
- **Exercise Recommendations**: Personalized workouts

### Technical Details
- **Phase Timing**: Setup, takeoff, flight, landing
- **Confidence Score**: Measurement reliability
- **Camera Tips**: How to improve accuracy

---

## Examples

### Example 1: Analyze a Video
```bash
python analyze_video.py jump.mp4
```

Output:
```
🎯 Jump Height: 45.2 cm (17.8 inches)
⭐ Quality Score: 85/100
💪 Power Score: 78/100

✅ What you did well:
   • Excellent left-right symmetry!

💡 Areas for improvement:
   • Land with bent knees to absorb force

🏋️ Recommended: Box Drops for landing mechanics
```

### Example 2: Real-Time Analysis
```bash
python realtime_analyzer.py
```

1. Webcam opens
2. Press SPACE
3. Jump!
4. Press SPACE
5. Get instant results

### Example 3: Web Interface
```bash
python start.py
```

1. Browser opens automatically
2. Drag video file to upload area
3. Click "Analyze Jump"
4. View beautiful results

---

## Troubleshooting

### "Video file not found"
- Check the file path
- Use absolute path: `C:\Videos\jump.mp4`
- Or relative path: `./videos/jump.mp4`

### "Could not open webcam"
- Check webcam is connected
- Close other apps using webcam
- Try different camera: `cv2.VideoCapture(1)`

### "Not enough frames captured"
- Record for at least 2 seconds
- Ensure person is visible in frame
- Check lighting

### Low confidence scores
- Improve lighting
- Use side view angle
- Keep full body in frame
- Position camera 3-5m away

---

## Advanced Usage

### Custom User Profile
Edit the user profile in the scripts:
```python
user_profile = UserProfile(
    age=30,
    skill_level="advanced",
    training_goal=TrainingGoal.LANDING_SAFETY,
    safety_mode=SafetyMode.KNEE_SAFE
)
```

### Batch Processing
Process multiple videos:
```bash
for video in *.mp4; do
    python analyze_video.py "$video"
done
```

### API Integration
Start the API server:
```bash
python -m uvicorn src.api.server:app --port 8000
```

Then use curl or any HTTP client:
```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "video=@jump.mp4" \
  -F "user_skill=intermediate"
```

---

## Next Steps

1. **Record a jump video** (or use webcam)
2. **Run the analyzer**: `python analyze_video.py video.mp4`
3. **Review feedback** and recommendations
4. **Practice exercises** suggested
5. **Record again** and track improvement!

---

## Support

- Full docs: `README.md`
- Quick start: `QUICKSTART.md`
- Installation: `INSTALL.md`
- Features: `FEATURES.md`

---

**Ready to analyze jumps! 🏀**
