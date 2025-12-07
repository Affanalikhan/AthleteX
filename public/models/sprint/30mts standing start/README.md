# 30 Meter Sprint Speed Calculator

A web application that uses YOLOv8 pose detection to accurately measure sprint speed and time for 30-meter standing start tests.

## 🚀 Quick Start

1. **Run the application:**
   ```cmd
   python app_single.py
   ```
   OR double-click `RUN.bat`

2. **Open your browser:**
   ```
   http://localhost:5000
   ```

## 📋 Features

### 📹 Live Camera Mode
- Real-time pose detection using your webcam
- Voice instructions for proper positioning
- Automatic timing when runner crosses lines
- Instant speed calculation

### 📁 Video Upload Mode
- Upload pre-recorded sprint videos
- Frame-by-frame analysis
- Accurate speed measurement from video

## 🎯 How to Use

### Live Camera:
1. Click "Calibrate 30m Distance"
2. Click on video to mark START line (vertical)
3. Click on video to mark FINISH line (30m away, vertical)
4. Click "Start Test" and follow voice instructions
5. Run when you hear "Go!"

### Upload Video:
1. Switch to "Upload Video" tab
2. Select your video file
3. Calibrate START and FINISH lines
4. Click "Analyze Video"
5. Wait for results

## 📦 Requirements

- Python 3.8+
- Webcam (for live mode)
- YOLOv8 pose model: `yolov8s-pose.pt`

Install dependencies:
```cmd
pip install -r requirements.txt
```

## 📁 Project Files

- `app_single.py` - Main application (all-in-one file)
- `RUN.bat` - Quick start script
- `requirements.txt` - Python dependencies
- `yolov8s-pose.pt` - YOLOv8 pose detection model
- `README.md` - This file

## 🎥 Camera Setup

- Position camera perpendicular to running path
- Ensure entire 30m distance is visible in frame
- Camera should be at waist to chest height
- Keep camera stable (use tripod if available)

## 🏃 Running Instructions

The system uses vertical lines for calibration:
- Lines should be perpendicular to camera view
- Runner moves parallel to camera (left-to-right or right-to-left)
- System tracks hip position to detect line crossing

## 🔧 Troubleshooting

- **Camera not working:** Check Windows camera permissions
- **Video upload fails:** Ensure video format is supported (mp4, avi, mov)
- **Slow analysis:** Large videos take longer to process
- **Debug mode:** Press F12 in browser to see console logs

## 📊 Results

The application provides:
- Time (seconds)
- Speed (km/h and m/s)
- Distance (30 meters)
- Voice announcement of results

---

Built with Flask, OpenCV, and YOLOv8
