# Installation Guide

## Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Webcam or video files for testing

## Step-by-Step Installation

### 1. Clone or Download the Project

```bash
# If using git
git clone <repository-url>
cd vertical-jump-coach

# Or download and extract the ZIP file
```

### 2. Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `mediapipe==0.10.9` - Pose detection
- `opencv-python==4.8.1.78` - Video processing
- `numpy==1.24.3` - Numerical computations
- `torch==2.1.0` - Deep learning framework
- `fastapi==0.104.1` - Web API framework
- `uvicorn==0.24.0` - ASGI server
- And other dependencies

**Note**: Installation may take 5-10 minutes depending on your internet speed.

### 4. Verify Installation

```bash
python -c "import cv2, mediapipe, fastapi; print('✅ All dependencies installed successfully!')"
```

If you see the success message, you're ready to go!

## Quick Test

### Test 1: Start the Application

```bash
python start.py
```

You should see:
```
🏀 VERTICAL JUMP COACH
Checking dependencies...
✅ All dependencies installed
🚀 Starting API server on http://localhost:8000
🌐 Starting web server on http://localhost:8080
✅ Servers started successfully!
```

Your browser should open automatically to http://localhost:8080

### Test 2: API Health Check

Open a new terminal and run:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"healthy"}
```

### Test 3: Analyze a Video (if you have one)

```bash
python test_analyzer.py path/to/your/jump_video.mp4
```

## Troubleshooting

### Issue: "No module named 'cv2'"

**Solution**: Reinstall OpenCV
```bash
pip uninstall opencv-python
pip install opencv-python==4.8.1.78
```

### Issue: "No module named 'mediapipe'"

**Solution**: Install MediaPipe
```bash
pip install mediapipe==0.10.9
```

### Issue: "Port 8000 already in use"

**Solution**: Kill the process or use a different port

Windows:
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

Mac/Linux:
```bash
lsof -ti:8000 | xargs kill -9
```

Or edit `start.py` to use a different port.

### Issue: "torch" installation fails

**Solution**: Install PyTorch separately

Visit https://pytorch.org/get-started/locally/ and follow instructions for your system.

For CPU-only (smaller download):
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

### Issue: Video not processing

**Possible causes**:
1. Video format not supported → Convert to MP4
2. Video too large → Compress or trim to 2-3 seconds
3. Person not visible → Ensure full body is in frame
4. Poor lighting → Record in better lighting

### Issue: Low confidence scores

**Solutions**:
- Use side view (90 degrees from jumper)
- Ensure good lighting (avoid backlighting)
- Keep entire body in frame
- Position camera 3-5 meters away
- Use stable camera (not handheld)

## Platform-Specific Notes

### Windows

- Use Command Prompt or PowerShell
- Activate venv: `venv\Scripts\activate`
- Python command: `python`

### Mac

- Use Terminal
- Activate venv: `source venv/bin/activate`
- Python command: `python3`
- May need to install Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```

### Linux

- Use Terminal
- Activate venv: `source venv/bin/activate`
- Python command: `python3`
- May need to install system dependencies:
  ```bash
  sudo apt-get update
  sudo apt-get install python3-dev python3-pip
  sudo apt-get install libgl1-mesa-glx  # For OpenCV
  ```

## System Requirements

### Minimum
- CPU: Dual-core 2.0 GHz
- RAM: 4 GB
- Storage: 2 GB free space
- OS: Windows 10, macOS 10.14, Ubuntu 18.04 or newer

### Recommended
- CPU: Quad-core 2.5 GHz or better
- RAM: 8 GB or more
- Storage: 5 GB free space
- GPU: Optional (for faster processing)

## Next Steps

After successful installation:

1. **Read QUICKSTART.md** for usage instructions
2. **Try the web interface** at http://localhost:8080
3. **Test with a video** using `test_analyzer.py`
4. **Explore the API** at http://localhost:8000/docs
5. **Read README.md** for detailed documentation

## Getting Help

If you encounter issues:

1. Check this troubleshooting section
2. Verify all dependencies are installed
3. Check Python version: `python --version` (should be 3.9+)
4. Try reinstalling dependencies: `pip install -r requirements.txt --force-reinstall`
5. Open an issue on GitHub with error details

## Uninstallation

To remove the application:

```bash
# Deactivate virtual environment
deactivate

# Remove project directory
cd ..
rm -rf vertical-jump-coach  # Mac/Linux
rmdir /s vertical-jump-coach  # Windows
```

---

**Installation complete!** 🎉 Ready to analyze jumps!
