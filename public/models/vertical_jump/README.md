# Vertical Jump Coach 🏀

An AI-powered vertical jump analysis system that provides instant performance metrics, technique feedback, and personalized training recommendations.

## Features

- **Pose Detection**: Uses MediaPipe to detect body keypoints from video
- **Biomechanical Analysis**: Extracts 11+ features including knee angles, hip depth, symmetry, and velocity
- **Performance Scoring**: Provides 6 key metrics (height, power, explosiveness, efficiency, landing control, quality)
- **Technique Feedback**: Identifies errors and provides actionable coaching tips
- **Exercise Recommendations**: Suggests personalized exercises based on detected weaknesses
- **Confidence Scoring**: Transparent about measurement accuracy with camera positioning tips

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the API Server

```bash
python -m uvicorn src.api.server:app --reload --host 0.0.0.0 --port 8000
```

### 3. Open the Web Interface

Open `web/index.html` in your browser, or serve it with:

```bash
cd web
python -m http.server 8080
```

Then visit `http://localhost:8080`

### 4. Upload and Analyze

1. Record or upload a vertical jump video (side view recommended)
2. Click "Analyze Jump"
3. Get instant results with scores and coaching feedback!

## API Usage

### Analyze Jump Video

```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "video=@jump_video.mp4" \
  -F "user_skill=intermediate" \
  -F "training_goal=increase_height"
```

### Response Format

```json
{
  "success": true,
  "jump_metrics": {
    "height_cm": 45.2,
    "height_inches": 17.8,
    "power_score": 78.5,
    "explosiveness_rating": 82.3,
    "takeoff_efficiency": 75.0,
    "landing_control_score": 68.5,
    "quality_score": 85.0
  },
  "feedback": {
    "summary": "Jump height: 45.2cm. Quality score: 85/100.",
    "positives": [
      "Excellent left-right symmetry!",
      "Great overall technique!"
    ],
    "improvements": [
      "Land with bent knees to absorb force - aim for soft, controlled landing."
    ]
  },
  "exercise_recommendations": [
    {
      "name": "Box Drops",
      "description": "Step off box and practice soft landings with bent knees",
      "target_area": "Landing mechanics",
      "difficulty": "intermediate"
    }
  ],
  "confidence": {
    "percentage": 87,
    "explanation": "High confidence - excellent video quality and clear pose detection."
  }
}
```

## System Architecture

```
Video Input
    ↓
Pose Detection (MediaPipe)
    ↓
Feature Extraction (11+ biomechanical features)
    ↓
Analysis & Scoring
    ↓
Feedback Generation
    ↓
Results + Recommendations
```

## Key Metrics Explained

- **Jump Height**: Estimated from takeoff velocity using physics (h = v²/2g)
- **Power Score**: Combination of height and velocity
- **Explosiveness**: Based on takeoff velocity and timing
- **Takeoff Efficiency**: How well you use knee and hip angles
- **Landing Control**: Ground contact time and symmetry
- **Quality Score**: Overall technique score (100 - error penalties)

## Detected Errors

The system can identify:
- Poor depth (insufficient knee bend)
- Knee valgus (knees caving inward)
- Forward lean (torso angle issues)
- Stiff landing (insufficient shock absorption)
- Early arm swing (timing issues)

## Video Recording Tips

For best results:
- **Camera Position**: 3-5 meters away, side view (90°)
- **Lighting**: Good, even lighting (avoid backlighting)
- **Framing**: Keep entire body in frame throughout jump
- **Duration**: 2-3 seconds (includes setup, jump, landing)
- **Surface**: Flat, non-slip surface

## Requirements

- Python 3.9+
- OpenCV
- MediaPipe
- FastAPI
- NumPy

## Project Structure

```
vertical-jump-coach/
├── src/
│   ├── models/          # Data types and structures
│   ├── pose_estimation/ # MediaPipe pose detection
│   ├── features/        # Biomechanical feature extraction
│   ├── analysis/        # Jump analysis and scoring
│   └── api/             # FastAPI server
├── web/                 # Web interface
├── requirements.txt     # Python dependencies
└── README.md
```

## Future Enhancements

- ML model training on real jump dataset from Roboflow
- Progress tracking and history
- Gamification (streaks, badges, challenges)
- Real-time feedback mode
- Mobile app (React Native)
- Video visualization with skeleton overlay
- Benchmark comparisons (age groups, sport positions)

## License

MIT License

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

Built with ❤️ for athletes, coaches, and fitness enthusiasts
