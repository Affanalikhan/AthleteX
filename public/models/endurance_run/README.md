# Endurance Run Coach

AI-powered running form analysis with biomechanical feedback and coaching recommendations.

## Features
- Video upload (MP4, MOV, AVI - max 50MB)
- Pose detection & gait analysis
- Real-time metrics: cadence, ground contact time, symmetry, efficiency
- Dashboard with performance tiles and coaching feedback
- Recommended drills based on analysis

## Tech Stack
- **Frontend**: React + TailwindCSS
- **Backend**: FastAPI (Python)
- **CV Model**: MediaPipe Pose / OpenPose
- **Video Processing**: OpenCV

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Usage
1. Upload running video (side view, 8-15 seconds)
2. Click "Analyze Run"
3. View metrics, scores, and coaching feedback
