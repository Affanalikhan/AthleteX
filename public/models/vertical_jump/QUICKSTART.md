# Quick Start Guide 🚀

Get your Vertical Jump Coach running in 3 simple steps!

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- MediaPipe (pose detection)
- OpenCV (video processing)
- FastAPI (API server)
- NumPy (calculations)

## Step 2: Start the Application

### Option A: Automatic Startup (Recommended)

```bash
python start.py
```

This will:
- Start the API server on port 8000
- Start the web interface on port 8080
- Open your browser automatically

### Option B: Manual Startup

Terminal 1 - Start API:
```bash
python -m uvicorn src.api.server:app --reload --port 8000
```

Terminal 2 - Start Web Interface:
```bash
cd web
python -m http.server 8080
```

Then open http://localhost:8080 in your browser

## Step 3: Analyze a Jump!

1. **Record a video** of someone doing a vertical jump
   - Side view works best
   - 2-3 seconds long
   - Keep full body in frame

2. **Upload the video** on the web interface

3. **Click "Analyze Jump"**

4. **Get instant results:**
   - Jump height in cm and inches
   - 6 performance scores
   - Technique feedback
   - Exercise recommendations

## Test with Command Line

If you have a test video:

```bash
python test_analyzer.py your_jump_video.mp4
```

## API Testing

Test the API directly:

```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "video=@jump_video.mp4" \
  -F "user_skill=intermediate"
```

## Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### "Port already in use"
Change the port in start.py or kill the process:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### Video not processing
- Make sure video is in MP4, MOV, or AVI format
- Check that the person is clearly visible
- Try a side-view angle

## What You Get

### Performance Metrics
- **Jump Height**: Calculated from physics
- **Power Score**: Height + velocity combination
- **Explosiveness**: Takeoff speed rating
- **Takeoff Efficiency**: Technique optimization
- **Landing Control**: Safety and stability
- **Quality Score**: Overall technique rating

### Feedback
- ✅ Positive reinforcement
- 💡 Specific improvements
- 🏋️ Personalized exercises
- ⚠️ Technique error detection

### Detected Errors
- Poor depth (knee bend)
- Knee valgus (alignment)
- Forward lean
- Stiff landing
- Arm swing timing

## Next Steps

1. **Try different videos** - See how technique affects scores
2. **Follow exercise recommendations** - Improve your weak areas
3. **Track progress** - Compare jumps over time
4. **Experiment with angles** - Find the best camera position

## Need Help?

- Check README.md for detailed documentation
- View API docs at http://localhost:8000/docs
- Open an issue on GitHub

---

Happy jumping! 🏀
