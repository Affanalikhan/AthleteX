# Design Document

## Overview

The Shuttle-Run Analyzer is a computer vision-based system that processes pre-recorded videos of 4×10 meter shuttle run attempts. The system validates video quality, calibrates measurements, tracks athlete movement through pose estimation, detects rule violations and cheating, computes performance metrics, and generates comprehensive reports with training recommendations.

The architecture follows a pipeline design with distinct stages: preflight validation, calibration, pose extraction and tracking, event detection, rule validation, scoring, and report generation. Each stage produces intermediate artifacts that feed into subsequent stages, enabling debugging and audit trails.

## Architecture

### High-Level Components

1. **Upload & Validation Service**: Handles video uploads, metadata collection, and preflight checks
2. **Calibration Engine**: Computes pixel-to-meter conversion ratios using detected markers
3. **Vision Processing Pipeline**: Extracts pose keypoints, detects lines, tracks athlete movement
4. **Event Detection Engine**: Identifies touch events, state transitions, and timing markers
5. **Rule Validation Engine**: Applies SAI/Khelo India rules and detects fouls/cheating
6. **Scoring & Rating Engine**: Computes times, ratings, agility scores using benchmark tables
7. **Suggestion Generator**: Analyzes performance weaknesses and generates training recommendations
8. **Report Generator**: Produces structured JSON output and optional human-readable reports

### Technology Stack

- **Backend Framework**: Python FastAPI for REST API endpoints
- **Video Processing**: OpenCV for frame extraction, FFmpeg for video handling
- **Pose Estimation**: MediaPipe Pose (fast, 30+ fps) or YOLOv8-Pose (more accurate)
- **Object Detection**: YOLOv8 for line/marker detection, optional SAM for segmentation
- **Tracking**: ByteTrack for maintaining athlete identity across frames
- **Inference Optimization**: ONNX Runtime or TensorRT for production deployment
- **Database**: PostgreSQL for metadata and benchmark tables, Redis for job queue
- **Storage**: S3-compatible object storage for videos and artifacts
- **Orchestration**: Celery for async job processing
- **Frontend**: React for upload UI and result visualization

### Processing Flow

```
Video Upload → Preflight Validation → Calibration → Frame Extraction
    ↓
Pose Detection (per frame) → Tracking → Line Detection
    ↓
Event Detection → State Machine → Timing Computation
    ↓
Foul Detection → Cheat Detection → Confidence Scoring
    ↓
Age-Group Rating → Agility Score → Suggestions
    ↓
JSON Output + Visual Artifacts → Report Generation
```

## Components and Interfaces

### 1. Upload & Validation Service

**Interface:**
```python
class UploadService:
    def accept_upload(
        video_file: bytes,
        metadata: AthleteMetadata,
        calibration: Optional[CalibrationData]
    ) -> UploadResponse
    
    def run_preflight_checks(video_path: str) -> PreflightResult
```

**Responsibilities:**
- Accept video uploads and validate file format/codec
- Extract video metadata (fps, resolution, duration)
- Run preflight checks: line visibility, camera stability, athlete in frame
- Return acceptance or rejection with specific reasons

**Preflight Validation Logic:**
- Decode video and verify fps ≥ 25, resolution ≥ 720p
- Sample frames at regular intervals (every 0.5s)
- Run line detection on sampled frames, require both lines visible in ≥80% of samples
- Check for camera motion by computing optical flow variance (reject if variance > threshold)
- Detect athlete presence using person detection model
- Compute overall preflight confidence score

### 2. Calibration Engine

**Interface:**
```python
class CalibrationEngine:
    def calibrate_from_markers(
        video_frames: List[np.ndarray],
        known_distance_m: float = 10.0
    ) -> CalibrationResult
    
    def calibrate_from_object(
        calibration_frames: List[np.ndarray],
        object_length_m: float
    ) -> CalibrationResult
```

**Responsibilities:**
- Detect Point A and Point B markers in pixel coordinates
- Compute pixel distance between markers
- Calculate px_to_m ratio: known_distance_m / pixel_distance
- Validate calibration stability across frames
- Return calibration confidence score

**Calibration Algorithm:**
- Use YOLOv8 or edge detection to locate line markers
- Compute line centroids in pixel space
- Calculate Euclidean distance between centroids
- Verify consistency across multiple frames (std dev < 5% of mean)
- If user provides calibration object, use its known length for ratio
- Confidence = 1.0 - (std_dev / mean_distance)

### 3. Vision Processing Pipeline

**Interface:**
```python
class VisionPipeline:
    def extract_poses(video_path: str) -> List[PoseFrame]
    def detect_lines(frames: List[np.ndarray]) -> LineDetectionResult
    def track_athlete(pose_frames: List[PoseFrame]) -> TrackedSequence
```

**Responsibilities:**
- Extract pose keypoints for every frame
- Detect and track line positions
- Maintain athlete identity across frames
- Compute derived metrics: foot center, speed, direction

**Pose Extraction:**
- Use MediaPipe Pose or YOLOv8-Pose
- Extract keypoints: left_ankle, right_ankle, left_foot, right_foot, left_hip, right_hip, left_shoulder, right_shoulder
- Store keypoint coordinates and confidence scores
- Compute foot_center = midpoint(left_foot, right_foot)

**Line Detection:**
- Apply edge detection (Canny) or use YOLOv8 trained on line markers
- Fit line equations using RANSAC for robustness
- Track line positions across frames using Kalman filter
- Convert pixel coordinates to meters using calibration ratio

**Tracking:**
- Use ByteTrack to maintain athlete ID across frames
- Handle occlusions and temporary detection failures
- Interpolate missing keypoints using temporal smoothing

### 4. Event Detection Engine

**Interface:**
```python
class EventDetector:
    def detect_start(tracked_sequence: TrackedSequence) -> StartEvent
    def detect_touches(
        tracked_sequence: TrackedSequence,
        lines: LineDetectionResult,
        px_to_m: float
    ) -> List[TouchEvent]
    def compute_segments(
        touches: List[TouchEvent],
        start_event: StartEvent
    ) -> SegmentTimes
```

**Responsibilities:**
- Detect start moment from acceleration or audio cue
- Identify touch events when foot crosses or approaches line
- Compute segment times between touches
- Build event timeline

**Start Detection:**
- Compute instantaneous speed from foot_center position differentiation
- Detect first frame where speed > 1.2 m/s as start candidate
- If audio GO provided, use audio timestamp
- Validate start with forward direction vector

**Touch Detection:**
- For each frame, compute distance from foot_center to each line
- Register touch when distance ≤ 0.3m OR foot keypoint crosses line pixel
- Record timestamp, which foot, distance to line, confidence
- Filter false positives using temporal consistency (touches must be ≥1.5s apart)

**Segment Computation:**
- Segment 1 (A→B): start_time to first touch at B
- Segment 2 (B→A): first touch at B to second touch at A
- Segment 3 (A→B): second touch at A to third touch at B
- Segment 4 (B→A): third touch at B to fourth touch at A
- Total time = fourth touch timestamp - start_time

### 5. Rule Validation Engine

**Interface:**
```python
class RuleValidator:
    def detect_fouls(
        tracked_sequence: TrackedSequence,
        touches: List[TouchEvent],
        lines: LineDetectionResult
    ) -> List[Foul]
    
    def detect_cheating(
        video_path: str,
        tracked_sequence: TrackedSequence,
        calibration: CalibrationResult
    ) -> CheatDetectionResult
```

**Responsibilities:**
- Apply SAI/Khelo India shuttle run rules
- Detect fouls: early turns, lane deviations, missing touches, false starts
- Detect cheating: video editing, slow motion, camera manipulation
- Compute confidence scores for each detection

**Foul Detection Logic:**

*Early Turn:*
- For each frame, compute direction vector from velocity
- Detect direction reversal (sign change in primary axis)
- Measure distance from reversal point to nearest line
- If distance > 1.5m, flag early_turn with confidence proportional to distance

*Lane Deviation:*
- Compute lane center line between Point A and B
- For each frame, calculate lateral offset from lane center
- If offset > 1.0m, flag lane_deviation with max offset value

*Diagonal Running:*
- Integrate path length from foot_center trajectory
- Expected path = 40m (4 × 10m)
- If actual_path < 0.95 × 40m, flag diagonal_running

*Missing Touches:*
- If touches_detected < 4, flag missing_touches
- Identify which touch points were missed

*False Start:*
- Check for forward movement > 0.3m before start_time
- Flag false_start if detected

**Cheat Detection Logic:**

*Video Editing:*
- Extract frame timestamps from video metadata
- Check for non-monotonic timestamps or large gaps
- Compute pose keypoint displacement between consecutive frames
- If displacement > threshold (e.g., 200px), flag possible_edit
- Detect duplicated frames using perceptual hashing

*Slow Motion:*
- Analyze frame time intervals (should be consistent at declared fps)
- Compute motion signature: acceleration peaks and frequency spectrum
- Compare to expected signature for human running
- If acceleration peaks suppressed or frequency shifted, flag possible_slow_motion

*Camera Manipulation:*
- Track calibration ratio across video
- If ratio variance > 10%, flag camera_move or zoom
- Detect panning using optical flow analysis

### 6. Scoring & Rating Engine

**Interface:**
```python
class ScoringEngine:
    def get_age_group(age: int) -> str
    def get_benchmark(age_group: str, gender: str) -> Benchmark
    def compute_rating(total_time: float, benchmark: Benchmark) -> str
    def compute_agility_score(
        total_time: float,
        segments: SegmentTimes,
        tracked_sequence: TrackedSequence
    ) -> float
```

**Responsibilities:**
- Map athlete age to age group classification
- Retrieve benchmark thresholds from database
- Compute performance rating (Excellent/Good/Average/Poor)
- Calculate normalized agility score (0-100)

**Age Group Mapping:**
```python
age_groups = {
    (4, 5): "U6",
    (6, 7): "U8",
    (8, 9): "U10",
    (10, 11): "U12",
    (12, 13): "U14",
    (14, 15): "U16",
    (16, 17): "U18",
    (18, 19): "U20",
    (20, 34): "Senior",
    (35, 44): "Masters-35-44",
    (45, 54): "Masters-45-54",
    (55, 120): "Masters-55-plus"
}
```

**Benchmark Table Schema:**
```sql
CREATE TABLE benchmarks (
    age_group VARCHAR(20),
    gender VARCHAR(10),
    excellent_max_s DECIMAL(5,2),
    good_max_s DECIMAL(5,2),
    average_max_s DECIMAL(5,2),
    PRIMARY KEY (age_group, gender)
);
```

**Rating Logic:**
- If total_time ≤ excellent_max_s: rating = "Excellent"
- Else if total_time ≤ good_max_s: rating = "Good"
- Else if total_time ≤ average_max_s: rating = "Average"
- Else: rating = "Poor"

**Agility Score Computation:**
```python
# Normalize time component (0-50 points)
time_score = 50 * (1 - (total_time - excellent_max_s) / (average_max_s - excellent_max_s))
time_score = max(0, min(50, time_score))

# Turn efficiency component (0-30 points)
turn_times = compute_turn_times(segments, tracked_sequence)
avg_turn_time = mean(turn_times)
optimal_turn_time = 0.4  # seconds
turn_score = 30 * (1 - (avg_turn_time - optimal_turn_time) / optimal_turn_time)
turn_score = max(0, min(30, turn_score))

# Acceleration component (0-20 points)
max_speed = max(tracked_sequence.speeds)
optimal_max_speed = 8.0  # m/s
accel_score = 20 * (max_speed / optimal_max_speed)
accel_score = max(0, min(20, accel_score))

agility_score = time_score + turn_score + accel_score
```

### 7. Suggestion Generator

**Interface:**
```python
class SuggestionGenerator:
    def analyze_weaknesses(
        segments: SegmentTimes,
        tracked_sequence: TrackedSequence,
        fouls: List[Foul]
    ) -> List[Suggestion]
```

**Responsibilities:**
- Analyze segment times for imbalances
- Identify turn efficiency issues
- Detect acceleration weaknesses
- Generate specific training recommendations

**Suggestion Rules:**

*Turn Efficiency:*
- Compute turn times (time from line touch to resuming 80% max speed)
- If avg_turn_time > 0.5s:
  - Suggestion: "Practice 180° quick-turn drills; focus on faster decel + re-accel"

*Lane Control:*
- If lane_deviation foul detected:
  - Suggestion: "Use cone drills to reduce lateral drift; keep body lean low through the turn"

*Acceleration:*
- Compute acceleration in first 2m of each leg
- If avg_acceleration < threshold:
  - Suggestion: "Work on explosive starts; practice sprint technique with resistance bands"

*Segment Imbalance:*
- Compute variance across segments
- If variance > threshold:
  - Suggestion: "Focus on pacing consistency; practice maintaining speed across all legs"

### 8. Report Generator

**Interface:**
```python
class ReportGenerator:
    def generate_json(analysis_result: AnalysisResult) -> dict
    def generate_pdf(analysis_result: AnalysisResult) -> bytes
```

**Responsibilities:**
- Format all analysis results into structured JSON
- Generate human-readable PDF reports (optional)
- Include visual artifacts and evidence frames

**JSON Output Schema:**
```json
{
  "session_id": "uuid",
  "uploaded_by": "user_id",
  "athlete": {
    "name": "string",
    "age": "integer",
    "gender": "string"
  },
  "video_meta": {
    "filename": "string",
    "fps": "integer",
    "resolution": "string",
    "duration_s": "float"
  },
  "preflight": {
    "lines_visible": "boolean",
    "distance_verified_m": "float",
    "calibration_confidence": "float",
    "video_quality": "string",
    "comments": "string"
  },
  "events": [
    {
      "name": "string",
      "time_s": "float",
      "meta": "object"
    }
  ],
  "segments": {
    "A_to_B_1": "float",
    "B_to_A_2": "float",
    "A_to_B_3": "float",
    "B_to_A_4": "float"
  },
  "total_time_s": "float",
  "touches_detected": "integer",
  "fouls": [
    {
      "type": "string",
      "time_s": "float",
      "confidence": "float",
      "explanation": "string"
    }
  ],
  "cheat_detected": "boolean",
  "cheat_reasons": ["string"],
  "age_group": "string",
  "rating": "string",
  "agility_score": "float",
  "confidence": "float",
  "suggestions": [
    {
      "type": "string",
      "advice": "string"
    }
  ],
  "visual_debug": {
    "keyframe_images": ["string"],
    "pose_plots": ["string"]
  }
}
```

## Data Models

### Core Data Structures

```python
@dataclass
class AthleteMetadata:
    age: int
    gender: str  # "M", "F", "other"
    name: Optional[str] = None
    athlete_id: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None

@dataclass
class CalibrationData:
    known_distance_m: float = 10.0
    pixel_distance: Optional[int] = None
    calibration_frames: Optional[List[np.ndarray]] = None

@dataclass
class PreflightResult:
    valid: bool
    lines_visible: bool
    camera_stable: bool
    athlete_in_frame: bool
    fps: int
    resolution: Tuple[int, int]
    comments: List[str]

@dataclass
class CalibrationResult:
    px_to_m: float
    confidence: float
    line_a_px: Tuple[float, float]
    line_b_px: Tuple[float, float]
    distance_verified_m: float

@dataclass
class PoseKeypoints:
    left_ankle: Tuple[float, float, float]  # x, y, confidence
    right_ankle: Tuple[float, float, float]
    left_foot: Tuple[float, float, float]
    right_foot: Tuple[float, float, float]
    left_hip: Tuple[float, float, float]
    right_hip: Tuple[float, float, float]
    left_shoulder: Tuple[float, float, float]
    right_shoulder: Tuple[float, float, float]

@dataclass
class PoseFrame:
    frame_idx: int
    timestamp_s: float
    keypoints: PoseKeypoints
    foot_center_px: Tuple[float, float]
    foot_center_m: Tuple[float, float]
    speed_m_s: float
    direction_vector: Tuple[float, float]

@dataclass
class TouchEvent:
    event_name: str
    time_s: float
    frame_idx: int
    foot: str  # "left" or "right"
    line: str  # "A" or "B"
    distance_to_line_m: float
    confidence: float

@dataclass
class Foul:
    type: str
    time_s: float
    frame_idx: int
    confidence: float
    explanation: str
    evidence_frames: List[int]

@dataclass
class CheatDetectionResult:
    cheat_detected: bool
    cheat_reasons: List[str]
    confidence: float
    evidence: Dict[str, Any]

@dataclass
class SegmentTimes:
    A_to_B_1: float
    B_to_A_2: float
    A_to_B_3: float
    B_to_A_4: float

@dataclass
class Suggestion:
    type: str
    advice: str

@dataclass
class AnalysisResult:
    session_id: str
    athlete: AthleteMetadata
    video_meta: dict
    preflight: PreflightResult
    calibration: CalibrationResult
    events: List[TouchEvent]
    segments: SegmentTimes
    total_time_s: float
    touches_detected: int
    fouls: List[Foul]
    cheat_detection: CheatDetectionResult
    age_group: str
    rating: str
    agility_score: float
    confidence: float
    suggestions: List[Suggestion]
    visual_debug: dict
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework analysis, several opportunities for consolidation emerge:

- Properties 1.1-1.4 (upload validation) can be combined into a comprehensive input validation property
- Properties 4.3-4.5 (frame processing computations) are related mathematical derivations that can be tested together
- Properties 5.4-5.5 (touch event detection and recording) can be combined into a single touch detection property
- Properties 7.1-7.5 (individual foul types) should remain separate as each tests distinct detection logic
- Properties 11.3-11.4 (event and foul output structure) can be combined into a single output completeness property

The consolidated properties below eliminate redundancy while maintaining comprehensive coverage.

### Correctness Properties

Property 1: Video format acceptance
*For any* uploaded file, the system should accept .mp4, .mov, and .webm formats and reject all other formats
**Validates: Requirements 1.1**

Property 2: Metadata capture completeness
*For any* athlete metadata submission, the system should capture all required fields (age, gender) and preserve all provided optional fields (name, athlete_id, weight, height)
**Validates: Requirements 1.2**

Property 3: Frame rate validation threshold
*For any* uploaded video, if the frame rate is below 25 fps, the preflight check should fail with an explicit frame rate reason
**Validates: Requirements 2.1**

Property 4: Resolution validation threshold
*For any* uploaded video, if the resolution is below 720p (1280×720), the preflight check should fail with an explicit resolution reason
**Validates: Requirements 2.2**

Property 5: Marker detection completeness
*For any* video processed during preflight, the system should detect both Point A and Point B markers or fail validation with an explicit marker visibility reason
**Validates: Requirements 2.3**

Property 6: Preflight failure explanation
*For any* failed preflight validation, the system should return at least one explicit reason explaining which prerequisite was not met
**Validates: Requirements 2.6**

Property 7: Calibration ratio computation
*For any* detected marker positions with known distance, the computed pixel-to-meter ratio should equal known_distance_m divided by pixel_distance with tolerance for measurement error
**Validates: Requirements 3.1, 3.2**

Property 8: Low confidence calibration flagging
*For any* calibration result, if confidence is below 0.8, then distance_verified should be false and comments should be non-empty
**Validates: Requirements 3.3**

Property 9: Foot center midpoint computation
*For any* frame with detected left and right foot keypoints, the foot_center position should equal the midpoint of the two foot positions
**Validates: Requirements 4.3**

Property 10: Speed computation from position
*For any* sequence of frames with foot center positions, the instantaneous speed at frame N should equal the distance between positions at frames N and N-1 divided by the time interval
**Validates: Requirements 4.4**

Property 11: Touch event detection and recording
*For any* frame where distance from foot center to a line is ≤ 0.3 meters OR a foot keypoint crosses the line pixel position, a touch event should be registered with timestamp, foot identifier, line identifier, and distance recorded
**Validates: Requirements 5.4, 5.5**

Property 12: State transition sequence
*For any* sequence of touch events in a valid shuttle run, state transitions should follow the exact order: WAIT_FOR_START → LEG1 → LEG2 → LEG3 → LEG4 → FINISH
**Validates: Requirements 6.2**

Property 13: Segment time computation
*For any* state transition, the computed segment time should equal the current timestamp minus the previous segment start timestamp
**Validates: Requirements 6.3**

Property 14: Early turn detection
*For any* direction change (velocity vector sign flip) that occurs more than 1.5 meters before a line, the system should flag an early_turn foul with the measured distance included
**Validates: Requirements 7.1**

Property 15: Lane deviation detection
*For any* frame where lateral offset from lane center exceeds 1.0 meter, the system should flag a lane_deviation foul with the maximum offset value included
**Validates: Requirements 7.2**

Property 16: Diagonal running detection
*For any* completed run, if the integrated path length is less than 95% of 40 meters (38 meters), the system should flag a diagonal_running foul
**Validates: Requirements 7.3**

Property 17: Missing touches detection
*For any* completed run, if fewer than 4 touch events are detected, the system should flag a missing_touches foul
**Validates: Requirements 7.4**

Property 18: False start detection
*For any* run, if forward movement exceeds 0.3 meters before the recorded start time, the system should flag a false_start foul
**Validates: Requirements 7.5**

Property 19: Foul reporting completeness
*For any* detected foul, the output should include foul type, timestamp, confidence score, and natural language explanation
**Validates: Requirements 7.6**

Property 20: Video editing detection
*For any* video with non-monotonic frame timestamps OR pose keypoint displacement exceeding threshold between consecutive frames, the system should flag possible_edit in cheat_reasons
**Validates: Requirements 8.1**

Property 21: Slow motion detection
*For any* video with inconsistent frame intervals OR suppressed acceleration peaks in motion signature, the system should flag possible_slow_motion in cheat_reasons
**Validates: Requirements 8.2**

Property 22: Camera manipulation detection
*For any* video where pixel-to-meter calibration ratio variance exceeds 10% across frames, the system should flag camera_move or zoom in cheat_reasons
**Validates: Requirements 8.3**

Property 23: Age group classification uniqueness
*For any* athlete age, the system should map to exactly one age group from the defined bands (U6, U8, U10, U12, U14, U16, U18, U20, Senior, Masters-35-44, Masters-45-54, Masters-55-plus)
**Validates: Requirements 9.1**

Property 24: Rating assignment uniqueness
*For any* total time and benchmark thresholds, the system should assign exactly one rating from (Excellent, Good, Average, Poor)
**Validates: Requirements 9.3**

Property 25: Agility score bounds
*For any* computed agility score, the value should be in the range [0, 100]
**Validates: Requirements 9.4**

Property 26: Suggestion generation for turn inefficiency
*For any* run where average turn time exceeds 0.5 seconds, the system should generate at least one suggestion with type "turn_efficiency"
**Validates: Requirements 10.2**

Property 27: Suggestion generation for lane deviation
*For any* run with a lane_deviation foul, the system should generate at least one suggestion with type "lane_control"
**Validates: Requirements 10.3**

Property 28: JSON output completeness
*For any* completed analysis, the JSON output should contain all required top-level fields: session_id, athlete, video_meta, preflight, events, segments, total_time_s, touches_detected, fouls, cheat_detected, cheat_reasons, age_group, rating, agility_score, confidence, suggestions, visual_debug
**Validates: Requirements 11.1**

Property 29: Numeric formatting precision
*For any* time value in the output, it should be formatted with exactly 2 decimal places, and for any confidence value, it should be in the range [0.00, 1.00]
**Validates: Requirements 11.2**

Property 30: Event and foul output structure
*For any* event in the events array, it should contain name, time_s, and meta fields, and for any foul in the fouls array, it should contain type, time_s, confidence, and explanation fields
**Validates: Requirements 11.3, 11.4**

Property 31: Keyframe evidence capture
*For any* detected foul or cheat, the output should include at least one frame evidence pointer in the visual_debug section
**Validates: Requirements 13.2**

## Error Handling

### Error Categories

1. **Upload Errors**
   - Invalid file format → HTTP 400 with message "Unsupported video format. Please upload .mp4, .mov, or .webm"
   - File too large → HTTP 413 with message "Video file exceeds maximum size limit"
   - Corrupted video → HTTP 400 with message "Video file is corrupted or unreadable"

2. **Preflight Validation Errors**
   - Low frame rate → Return PreflightResult with valid=False, comments=["Frame rate {fps} below minimum 25 fps"]
   - Low resolution → Return PreflightResult with valid=False, comments=["Resolution {res} below minimum 720p"]
   - Missing markers → Return PreflightResult with valid=False, comments=["Point A not visible", "Point B not visible"]
   - Camera panning → Return PreflightResult with valid=False, comments=["Camera movement detected during run"]
   - Athlete out of frame → Return PreflightResult with valid=False, comments=["Athlete not visible in {pct}% of frames"]

3. **Calibration Errors**
   - Markers not detected → Set calibration confidence to 0.0, distance_verified=False, comments=["Unable to detect line markers"]
   - Inconsistent measurements → Set confidence < 0.8, distance_verified=False, comments=["Marker positions inconsistent across frames"]

4. **Processing Errors**
   - Pose detection failure → Log warning, interpolate missing keypoints from adjacent frames
   - Tracking loss → Attempt re-identification, flag frames with low confidence
   - No touches detected → Flag missing_touches foul, return partial results with confidence < 0.5

5. **Database Errors**
   - Benchmark not found → HTTP 500 with message "Benchmark data not available for age group {age_group} and gender {gender}"
   - Connection failure → Retry with exponential backoff, return HTTP 503 if all retries fail

### Error Recovery Strategies

- **Graceful Degradation**: If pose detection fails for some frames, interpolate keypoints and mark confidence lower
- **Partial Results**: If analysis cannot complete fully, return partial results with explicit flags indicating what failed
- **Retry Logic**: For transient failures (network, database), implement exponential backoff with max 3 retries
- **Logging**: Log all errors with context (session_id, timestamp, stack trace) for debugging
- **User Feedback**: Always provide actionable error messages that explain what went wrong and how to fix it

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases for individual components:

**Upload Service:**
- Test acceptance of valid .mp4, .mov, .webm files
- Test rejection of invalid formats (.avi, .mkv)
- Test metadata validation (age must be positive integer, gender must be M/F/other)
- Test handling of missing optional fields

**Calibration Engine:**
- Test calibration with known marker positions (e.g., 1000px = 10m → ratio = 0.01)
- Test confidence computation with stable vs. unstable marker positions
- Test edge case: markers very close together (low pixel distance)
- Test edge case: markers at image boundaries

**Event Detector:**
- Test start detection with clear acceleration spike
- Test touch detection at exact line crossing
- Test touch detection within 0.3m tolerance
- Test filtering of false positive touches (too close in time)
- Test edge case: athlete stops before reaching line

**Rule Validator:**
- Test early turn detection with turn at 2.0m before line (should flag)
- Test early turn detection with turn at 1.0m before line (should not flag)
- Test lane deviation with offset of 1.2m (should flag)
- Test diagonal running with path length of 37m (should flag)
- Test false start with 0.5m movement before start (should flag)

**Scoring Engine:**
- Test age group mapping for boundary ages (e.g., age 10 → U12, age 11 → U12, age 12 → U14)
- Test rating assignment with time exactly at threshold
- Test agility score computation with known inputs
- Test edge case: agility score clamping to [0, 100] range

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using the **Hypothesis** library for Python.

**Configuration:**
- Each property test should run a minimum of 100 iterations
- Use appropriate generators for domain-specific data (e.g., valid ages 4-100, valid coordinates within frame bounds)
- Tag each test with the property number and text from the design document

**Test Implementation Guidelines:**

```python
from hypothesis import given, strategies as st
import pytest

# Example property test structure
@given(
    age=st.integers(min_value=4, max_value=100),
    gender=st.sampled_from(["M", "F", "other"])
)
@pytest.mark.property_test
def test_property_23_age_group_classification_uniqueness(age, gender):
    """
    Feature: shuttle-run-analyzer, Property 23: Age group classification uniqueness
    For any athlete age, the system should map to exactly one age group
    """
    age_group = scoring_engine.get_age_group(age)
    
    # Verify exactly one age group is returned
    assert age_group in [
        "U6", "U8", "U10", "U12", "U14", "U16", "U18", "U20",
        "Senior", "Masters-35-44", "Masters-45-54", "Masters-55-plus"
    ]
    
    # Verify deterministic mapping (same age always maps to same group)
    assert scoring_engine.get_age_group(age) == age_group
```

**Property Test Coverage:**

Each correctness property from the design document must be implemented as a property-based test:

- Property 1: Test with generated file extensions
- Property 2: Test with generated metadata dictionaries
- Property 3-6: Test with generated video metadata
- Property 7-8: Test with generated marker positions and distances
- Property 9-10: Test with generated keypoint sequences
- Property 11: Test with generated position and line data
- Property 12-13: Test with generated touch event sequences
- Property 14-18: Test with generated movement trajectories
- Property 19-22: Test with generated foul and cheat scenarios
- Property 23-25: Test with generated ages and times
- Property 26-27: Test with generated performance data
- Property 28-31: Test with generated analysis results

**Generators for Domain-Specific Data:**

```python
# Custom Hypothesis strategies for shuttle run domain
@st.composite
def pose_keypoints(draw):
    """Generate valid pose keypoints within frame bounds"""
    width, height = 1920, 1080
    return PoseKeypoints(
        left_ankle=(draw(st.floats(0, width)), draw(st.floats(0, height)), draw(st.floats(0.5, 1.0))),
        right_ankle=(draw(st.floats(0, width)), draw(st.floats(0, height)), draw(st.floats(0.5, 1.0))),
        # ... other keypoints
    )

@st.composite
def valid_shuttle_run_sequence(draw):
    """Generate a valid sequence of touch events for a shuttle run"""
    start_time = draw(st.floats(0.5, 2.0))
    touches = []
    current_time = start_time
    
    for i, line in enumerate(["B", "A", "B", "A"]):
        current_time += draw(st.floats(2.0, 4.0))  # Segment time
        touches.append(TouchEvent(
            event_name=f"touch_{line}_leg{i+1}",
            time_s=current_time,
            frame_idx=int(current_time * 30),
            foot=draw(st.sampled_from(["left", "right"])),
            line=line,
            distance_to_line_m=draw(st.floats(0.0, 0.3)),
            confidence=draw(st.floats(0.8, 1.0))
        ))
    
    return touches
```

### Integration Testing

Integration tests will verify that components work together correctly:

- **End-to-end pipeline test**: Upload valid video → verify complete JSON output with all required fields
- **Preflight to calibration**: Failed preflight should prevent calibration from running
- **Calibration to pose extraction**: Calibration ratio should be used in distance calculations
- **Event detection to scoring**: Detected touches should produce correct segment times
- **Foul detection to suggestions**: Detected fouls should trigger appropriate suggestions

### Test Data Requirements

- **Synthetic videos**: Generate test videos with known ground truth (controlled athlete positions, known times)
- **Real videos**: Collect 50+ real shuttle run videos across age groups for validation
- **Edge case videos**: Create videos with specific issues (panning camera, missing markers, edited frames)
- **Benchmark data**: Populate test database with realistic benchmark tables for all age groups

### Acceptance Criteria for Testing

- All unit tests pass (target: 100% pass rate)
- All property tests pass with 100 iterations each (target: 100% pass rate)
- Integration tests pass for happy path and major error scenarios
- Test coverage ≥ 85% for core processing logic
- Performance: Process 30-second video in < 60 seconds on standard hardware

## Deployment Considerations

### Infrastructure

- **Compute**: GPU-enabled instances for pose detection (e.g., AWS g4dn.xlarge, GCP n1-standard-4 with T4 GPU)
- **Storage**: S3-compatible object storage for videos and artifacts
- **Database**: PostgreSQL with read replicas for benchmark queries
- **Queue**: Redis for Celery task queue
- **API**: FastAPI behind Nginx reverse proxy with rate limiting

### Scalability

- **Horizontal scaling**: Multiple Celery workers can process videos in parallel
- **Batch processing**: Support bulk uploads with priority queue
- **Caching**: Cache benchmark tables in Redis to reduce database load
- **CDN**: Serve static assets (keyframe images) through CDN

### Monitoring

- **Metrics**: Track processing time, success rate, error types, queue depth
- **Logging**: Structured logging with session_id for traceability
- **Alerts**: Alert on high error rate, long queue depth, processing failures
- **Dashboards**: Grafana dashboards for real-time monitoring

### Security

- **Input validation**: Sanitize all user inputs, validate video files for malicious content
- **Authentication**: JWT-based authentication for API endpoints
- **Authorization**: Role-based access control (athlete, coach, admin)
- **Data privacy**: Encrypt videos at rest and in transit, support GDPR deletion requests
- **Rate limiting**: Prevent abuse with per-user rate limits

### Performance Optimization

- **Model optimization**: Use ONNX or TensorRT for faster inference
- **Frame sampling**: Process every Nth frame for non-critical analysis (e.g., preflight checks)
- **Parallel processing**: Run pose detection and line detection in parallel
- **Lazy loading**: Only load full video when preflight passes
- **Result caching**: Cache analysis results to avoid reprocessing identical videos
