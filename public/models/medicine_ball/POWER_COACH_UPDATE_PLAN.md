# Medicine Ball Power Coach - Complete Update Plan

## 🎯 System Transformation

Transform the current real-time AI Coach system into a **video upload and analysis dashboard** matching the "Medicine Ball Power Coach" specification.

## 📋 Key Changes Required

### 1. **Input Method Change**
**FROM:** Real-time camera feed
**TO:** Video file upload (MP4, MOV, AVI, max 50MB)

**Implementation:**
- Add file upload interface
- Support drag-and-drop
- Show "Analyze Throw" button after upload
- Process entire video before showing results

### 2. **Analysis Approach Change**
**FROM:** Frame-by-frame real-time analysis
**TO:** Complete video analysis with phase detection

**New Requirements:**
- Detect 4 phases: Setup → Loading → Drive & Release → Follow-through
- Calculate timing for each phase
- Track ball throughout entire movement
- Measure angles at key moments

### 3. **Output Format Change**
**FROM:** Real-time overlay with running metrics
**TO:** Dashboard with metric tiles (like Vertical Jump Coach)

**Dashboard Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Top Section - 6 Metric Tiles (2 rows x 3 cols)    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Power    │ │Technique │ │Explosive │           │
│  │ Score    │ │ Quality  │ │  ness    │           │
│  │  0-10    │ │  0-100   │ │  0-10    │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Symmetry  │ │ Safety/  │ │   Key    │           │
│  │  Score   │ │ Control  │ │  Metric  │           │
│  │  0-10    │ │  0-10    │ │          │           │
│  └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────┤
│  📊 Your Performance                                │
│  • Throw type: Chest Pass / Overhead               │
│  • Power Score: X/10                                │
│  • Technique Quality: X/100                         │
│  • ✓ Great sequencing from legs to hips            │
│  • ✓ Solid trunk stability                          │
│  • ✓ Good left-right symmetry                       │
├─────────────────────────────────────────────────────┤
│  💡 Areas for Improvement                           │
│  • Increase knee and hip bend during loading        │
│  • Keep trunk more upright at release               │
│  • Drive through both legs evenly                   │
│  • Extend arms fully toward target                  │
├─────────────────────────────────────────────────────┤
│  🏋️ Recommended Exercises                          │
│  ┌────────────────────────────────────────┐        │
│  │ Medicine Ball Chest Pass to Wall       │        │
│  │ Target: Upper-body power                │        │
│  │ How: Stand 6ft from wall, explosive... │        │
│  │ Difficulty: Intermediate                │        │
│  └────────────────────────────────────────┘        │
│  [+ 5 more exercises]                               │
├─────────────────────────────────────────────────────┤
│  🔍 Technical Details                               │
│  Phase Timing:                                      │
│    Setup: 450ms                                     │
│    Load: 320ms                                      │
│    Drive & Release: 180ms                           │
│    Follow-through: 280ms                            │
│  Key Angles:                                        │
│    Max knee flexion: 125°                           │
│    Max hip flexion: 95°                             │
│    Trunk angle at load: 15° forward                 │
│    Shoulder angle at release: 165°                  │
│  Ball Metrics:                                      │
│    Release speed: 8.5 m/s                           │
│    Estimated distance: 4.2m                         │
│  Confidence: 92% - High confidence                  │
└─────────────────────────────────────────────────────┘
```

## 🔧 Implementation Steps

### Step 1: Create Video Upload Interface
```python
# File: video_upload_interface.py
- HTML/Flask or Streamlit interface
- File upload with validation
- "Analyze Throw" button
- Progress indicator during analysis
```

### Step 2: Update Analysis Engine
```python
# File: power_coach_analyzer.py (already started)
- Process entire video
- Detect 4 phases
- Calculate all metrics
- Generate scores (0-10, 0-100)
```

### Step 3: Create Dashboard Renderer
```python
# File: dashboard_renderer.py
- Generate metric tiles
- Format performance summary
- Create improvement list
- Generate exercise recommendations
- Display technical details
```

### Step 4: Scoring Logic
```python
# Technique Quality (0-100)
score = 100
score -= 10 if knee_bend < 120°
score -= 15 if poor_sequencing
score -= 10 if trunk_collapse > 30°
score -= 10 if asymmetry > 15°
score -= 10 if poor_followthrough

# Power Score (0-10)
power = (release_speed / 12.0) * 10  # 12 m/s = max
power *= (1 + leg_drive_quality * 0.2)

# Explosiveness (0-10)
explosiveness = 10 / (drive_phase_duration_ms / 150)

# Symmetry (0-10)
left_right_diff = abs(left_angles - right_angles)
symmetry = 10 - (left_right_diff / 20)

# Safety/Control (0-10)
safety = 10
safety -= 2 if knee_valgus
safety -= 3 if unstable_landing
safety -= 2 if extreme_trunk_angle
```

### Step 5: Exercise Recommendations
```python
exercises = {
    'shallow_knee_bend': [
        'Goblet Squats',
        'Medicine Ball Squat to Press',
        'Box Jumps'
    ],
    'poor_symmetry': [
        'Single-Leg Romanian Deadlifts',
        'Split Squats',
        'Single-Arm Medicine Ball Throws'
    ],
    'weak_trunk_control': [
        'Pallof Press',
        'Dead Bugs',
        'Anti-Rotation Chops'
    ],
    'low_power': [
        'Medicine Ball Slams',
        'Plyometric Push-ups',
        'Box Jumps'
    ]
}
```

## 📊 New Data Structures

### ThrowAnalysis Object
```python
{
    'throw_type': 'chest_pass',  # or 'overhead'
    'power_score': 7.5,  # 0-10
    'technique_quality': 82,  # 0-100
    'explosiveness': 8.2,  # 0-10
    'symmetry_score': 7.8,  # 0-10
    'safety_control': 9.1,  # 0-10
    'key_metric': 'Release Velocity: 8.5 m/s',
    
    'phase_metrics': {
        'setup_ms': 450,
        'load_ms': 320,
        'drive_release_ms': 180,
        'followthrough_ms': 280
    },
    
    'angle_metrics': {
        'max_knee_flexion': 125,
        'max_hip_flexion': 95,
        'trunk_angle_at_load': 15,
        'shoulder_angle_at_release': 165,
        'elbow_angle_at_release': 175
    },
    
    'ball_metrics': {
        'release_speed_mps': 8.5,
        'estimated_distance_m': 4.2,
        'trajectory_angle': 35
    },
    
    'confidence': 92,
    
    'strengths': [
        'Great sequencing from legs to hips to upper body',
        'Solid trunk stability during release',
        'Good left-right symmetry in leg drive',
        'Excellent control on landing'
    ],
    
    'improvements': [
        'Increase knee and hip bend during loading phase',
        'Keep trunk more upright at release',
        'Drive through both legs evenly',
        'Extend arms fully toward target'
    ],
    
    'recommended_exercises': [
        {
            'name': 'Medicine Ball Chest Pass to Wall',
            'target': 'Upper-body power and coordination',
            'how_to': 'Stand 6 feet from wall...',
            'difficulty': 'intermediate'
        },
        # ... more exercises
    ]
}
```

## 🎨 UI/UX Requirements

### Tone & Style
- **Supportive and clear** - like a friendly professional coach
- **Actionable** - specific cues, not just descriptions
- **Progressive** - emphasize improvement potential
- **Safe** - soft language for risky movements

### Visual Design
- **Metric tiles** - Large, clear numbers with subtitles
- **Color coding:**
  - Green (✓) for strengths
  - Orange/Yellow for improvements
  - Red for safety concerns
- **Cards** for exercises
- **Clean layout** - similar to vertical jump coach

### Text Examples

**Good:**
- "Great sequencing from legs to hips to upper body"
- "Increase knee and hip bend during loading - aim for deeper flexion"
- "Your technique is solid; with deeper loading you can add a lot of power"

**Avoid:**
- Technical jargon
- Medical claims
- Negative language

## 🔄 Migration Path

### Phase 1: Core Analysis (Current)
✓ Pose detection working
✓ Ball detection working
✓ Angle calculations working
✓ Basic scoring logic

### Phase 2: Video Processing (New)
- [ ] Video upload interface
- [ ] Complete video analysis
- [ ] Phase detection algorithm
- [ ] Timing calculations

### Phase 3: Dashboard (New)
- [ ] Metric tile renderer
- [ ] Performance summary generator
- [ ] Improvement list generator
- [ ] Exercise recommendation engine

### Phase 4: Polish
- [ ] Confidence scoring
- [ ] Error handling
- [ ] Export functionality
- [ ] Mobile responsiveness

## 📝 File Structure (Updated)

```
medicine_ball_power_coach/
├── power_coach_analyzer.py      # Main analysis engine
├── dashboard_renderer.py        # Dashboard UI generator
├── video_processor.py           # Video upload & processing
├── scoring_engine.py            # All scoring logic
├── exercise_recommender.py      # Exercise database & logic
├── phase_detector.py            # Movement phase detection
├── web_interface.py             # Flask/Streamlit app
├── templates/
│   └── dashboard.html           # Dashboard template
├── static/
│   ├── css/
│   └── js/
└── requirements.txt
```

## 🚀 Quick Start (After Implementation)

```bash
# Install dependencies
pip install -r requirements.txt

# Run web interface
python web_interface.py

# Open browser to localhost:5000
# Upload video
# Click "Analyze Throw"
# View dashboard results
```

## 📊 Success Metrics

- **Analysis Time:** < 30 seconds for 10-second video
- **Accuracy:** 85%+ confidence on clear videos
- **User Experience:** Dashboard loads in < 2 seconds
- **Actionability:** 3-5 specific improvement cues
- **Exercise Relevance:** Recommendations match weaknesses

## 🎯 Next Steps

1. **Complete power_coach_analyzer.py** with all methods
2. **Create dashboard_renderer.py** for UI generation
3. **Build web_interface.py** for video upload
4. **Test with sample videos**
5. **Refine scoring thresholds**
6. **Polish UI/UX**

---

**This plan transforms the real-time system into a comprehensive video analysis dashboard matching the Medicine Ball Power Coach specification.**
