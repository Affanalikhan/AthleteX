# 📁 Project File Structure

## Essential Files (Keep These)

### 🌐 Web Application Files
- `simple_jump_test.html` - Live camera broad jump test interface
- `video_upload_jump.html` - Video upload and analysis interface
- `video_upload_analysis.js` - Video analysis JavaScript logic
- `index.html` - Main landing page
- `index_main.html` - Alternative main page
- `styles.css` - CSS styling for all pages

### 🐍 Python Files (Optional)
- `run_server.py` - Simple Python HTTP server
- `web_broad_jump.py` - Web server implementation
- `live_broad_jump_test.py` - Python-based live test
- `app.js` - Node.js server (if using Node)

### 📝 Documentation
- `README.md` - Main project documentation
- `SETUP_GUIDE.md` - Quick setup instructions
- `USER_GUIDE.md` - User instructions
- `HOW_TO_USE.md` - Usage guide
- `VIDEO_UPLOAD_GUIDE.md` - Video upload instructions
- `WEB_README.md` - Web interface documentation
- `FEATURES_SUMMARY.md` - Feature list
- `QUICK_START.txt` - Quick start text
- `FILE_STRUCTURE.md` - This file

### 🚀 Startup Scripts
- `START_TEST.bat` - Windows batch file to start server

### 📂 Folders
- `jump_results/` - Stores jump test results
- `.vscode/` - VS Code settings (optional)

## ❌ Removed Files (Not Needed)

### Large Model Files (1.4+ GB removed!)
- `dpt_large-midas-2f21e586.pt` (1312 MB) - MiDaS depth model
- `pose_landmarker_heavy.task` (29 MB) - Heavy pose model
- `yolov8s-pose.pt` (22 MB) - YOLOv8 pose model
- `yolov8s.pt` (22 MB) - YOLOv8 model
- `pose_landmarker_full.task` (9 MB) - Full pose model
- `yolov8n.pt` (6 MB) - YOLOv8 nano model

### Unnecessary Folders
- `venv/` (22 MB) - Python virtual environment
- `ultralytics-main/` (7 MB) - Ultralytics library
- `MiDaS-master/` (2.5 MB) - MiDaS library

## 💡 Why These Were Removed

### Models Now Load from CDN
The application uses TensorFlow.js and loads models directly from Google's CDN:
- Faster initial download
- Always up-to-date models
- No local storage needed
- Works on any device with internet

### Benefits
- **Before:** 1.4+ GB
- **After:** 0.2 MB
- **Reduction:** 99.99% smaller!

## 🔄 How to Recreate Python Environment (If Needed)

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install any needed packages
pip install opencv-python mediapipe numpy
```

## 📦 Deployment Ready
The project is now lightweight and ready for:
- GitHub repositories
- Web hosting
- Email sharing
- USB drives
- Cloud storage

Total size: **~0.2 MB** (down from 1.4+ GB!)
