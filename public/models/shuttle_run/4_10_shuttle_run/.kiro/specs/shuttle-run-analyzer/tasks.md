# Implementation Plan

- [x] 1. Set up project structure and dependencies







  - Create Python project with FastAPI, OpenCV, MediaPipe/YOLOv8-Pose, ByteTrack, Hypothesis
  - Set up directory structure: src/upload, src/calibration, src/vision, src/events, src/rules, src/scoring, src/suggestions, src/reports, tests/
  - Configure ONNX Runtime or TensorRT for inference optimization
  - Set up PostgreSQL database schema for benchmarks and results
  - Configure Redis for Celery task queue
  - Set up S3-compatible storage client
  - _Requirements: All_

- [ ] 2. Implement core data models
  - [x] 2.1 Create data model classes


    - Write Python dataclasses for AthleteMetadata, CalibrationData, PreflightResult, CalibrationResult, PoseKeypoints, PoseFrame, TouchEvent, Foul, CheatDetectionResult, SegmentTimes, Suggestion, AnalysisResult
    - Implement JSON serialization/deserialization for all models
    - Add validation logic for required fields and value ranges
    - _Requirements: 1.2, 11.1_



  - [x] 2.2 Write property test for metadata capture

    - **Property 2: Metadata capture completeness**
    - **Validates: Requirements 1.2**

  - [x] 2.3 Write property test for numeric formatting

    - **Property 29: Numeric formatting precision**
    - **Validates: Requirements 11.2**

- [ ] 3. Implement upload and validation service
  - [ ] 3.1 Create upload API endpoint
    - Implement FastAPI endpoint POST /api/upload accepting multipart form data

    - Accept video file and athlete metadata JSON
    - Store uploaded video to temporary location
    - Generate unique session_id for tracking
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_



  - [ ] 3.2 Implement video format validation
    - Use OpenCV to decode video and extract metadata (fps, resolution, duration, codec)
    - Validate file format is .mp4, .mov, or .webm
    - Return error for unsupported formats
    - _Requirements: 1.1_

  - [ ] 3.3 Write property test for video format acceptance
    - **Property 1: Video format acceptance**
    - **Validates: Requirements 1.1**

  - [ ] 3.4 Implement preflight validation checks
    - Check frame rate ≥ 25 fps
    - Check resolution ≥ 720p (1280×720)
    - Sample frames at 0.5s intervals
    - Run person detection to verify athlete in frame for ≥80% of samples
    - Compute optical flow variance to detect camera panning
    - Run preliminary line detection to check marker visibility
    - Build PreflightResult with pass/fail and specific reasons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ] 3.5 Write property tests for preflight validation
    - **Property 3: Frame rate validation threshold**
    - **Validates: Requirements 2.1**

  - [ ] 3.6 Write property test for resolution validation
    - **Property 4: Resolution validation threshold**
    - **Validates: Requirements 2.2**

  - [ ] 3.7 Write property test for marker detection
    - **Property 5: Marker detection completeness**
    - **Validates: Requirements 2.3**

  - [ ] 3.8 Write property test for preflight failure explanation
    - **Property 6: Preflight failure explanation**
    - **Validates: Requirements 2.6**

- [ ] 4. Implement calibration engine
  - [ ] 4.1 Create line detection module
    - Implement edge detection using Canny algorithm
    - Fit line equations using RANSAC for robustness
    - Detect Point A and Point B marker positions in pixel coordinates
    - Track line positions across frames using Kalman filter
    - _Requirements: 3.1, 5.1, 5.2_

  - [ ] 4.2 Implement pixel-to-meter calibration
    - Compute pixel distance between detected Point A and Point B centroids
    - Calculate px_to_m ratio: known_distance_m (10.0) / pixel_distance
    - If user provides calibration data, use provided measurements
    - Validate calibration stability across multiple frames (std dev < 5% of mean)
    - Compute confidence score: 1.0 - (std_dev / mean_distance)
    - Set distance_verified flag based on confidence threshold (0.8)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 4.3 Write property test for calibration ratio computation
    - **Property 7: Calibration ratio computation**
    - **Validates: Requirements 3.1, 3.2**

  - [ ] 4.4 Write property test for low confidence flagging
    - **Property 8: Low confidence calibration flagging**
    - **Validates: Requirements 3.3**

- [ ] 5. Implement vision processing pipeline
  - [ ] 5.1 Set up pose detection
    - Integrate MediaPipe Pose or YOLOv8-Pose model
    - Extract keypoints for each frame: left_ankle, right_ankle, left_foot, right_foot, left_hip, right_hip, left_shoulder, right_shoulder
    - Store keypoint coordinates and confidence scores
    - Handle missing keypoints with interpolation from adjacent frames
    - _Requirements: 4.1_

  - [ ] 5.2 Implement athlete tracking
    - Integrate ByteTrack for maintaining athlete identity across frames
    - Handle occlusions and temporary detection failures
    - Ensure consistent tracking ID throughout video
    - _Requirements: 4.2_

  - [ ] 5.3 Compute derived metrics from pose data
    - Calculate foot_center as midpoint of left_foot and right_foot keypoints
    - Convert foot_center from pixel coordinates to meters using px_to_m ratio
    - Compute instantaneous speed by differentiating foot_center position over time
    - Compute direction vector from velocity components
    - Calculate lateral offset from lane center line
    - _Requirements: 4.3, 4.4, 4.5, 5.3_

  - [ ] 5.4 Write property test for foot center computation
    - **Property 9: Foot center midpoint computation**
    - **Validates: Requirements 4.3**

  - [ ] 5.5 Write property test for speed computation
    - **Property 10: Speed computation from position**
    - **Validates: Requirements 4.4**

- [ ] 6. Implement event detection engine
  - [ ] 6.1 Create start detection logic
    - Compute instantaneous speed for each frame
    - Detect first frame where speed > 1.2 m/s as start candidate
    - If audio GO timestamp provided in metadata, use that as start time
    - Validate start with forward direction vector
    - Record start_time and create start event
    - _Requirements: 6.4_

  - [ ] 6.2 Implement touch detection
    - For each frame, compute distance from foot_center to Point A and Point B
    - Register touch event when distance ≤ 0.3m OR foot keypoint crosses line pixel
    - Record timestamp, which foot (left/right), line (A/B), distance, confidence
    - Filter false positives: touches must be ≥1.5s apart
    - _Requirements: 5.4, 5.5_

  - [ ] 6.3 Write property test for touch event detection
    - **Property 11: Touch event detection and recording**
    - **Validates: Requirements 5.4, 5.5**

  - [ ] 6.4 Implement state machine for shuttle run phases
    - Initialize state machine with states: WAIT_FOR_READY, WAIT_FOR_START, LEG1, LEG2, LEG3, LEG4, FINISH
    - Transition states on touch events following sequence: START → LEG1 (touch B) → LEG2 (touch A) → LEG3 (touch B) → LEG4 (touch A) → FINISH
    - Compute segment time on each transition: current_timestamp - previous_segment_start
    - Record end_time when fourth touch at Point A is detected
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [ ] 6.5 Write property test for state transition sequence
    - **Property 12: State transition sequence**
    - **Validates: Requirements 6.2**

  - [ ] 6.6 Write property test for segment time computation
    - **Property 13: Segment time computation**
    - **Validates: Requirements 6.3**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement rule validation engine for fouls
  - [ ] 8.1 Create early turn detection
    - For each frame, compute direction vector from velocity
    - Detect direction reversal (sign change in primary movement axis)
    - Measure distance from reversal point to nearest line
    - If distance > 1.5m, create early_turn foul with confidence proportional to distance
    - Include explanation with measured distance
    - _Requirements: 7.1_

  - [ ] 8.2 Write property test for early turn detection
    - **Property 14: Early turn detection**
    - **Validates: Requirements 7.1**

  - [ ] 8.3 Create lane deviation detection
    - Compute lane center line between Point A and Point B
    - For each frame, calculate lateral offset from lane center
    - Track maximum offset during run
    - If max offset > 1.0m, create lane_deviation foul with max offset value
    - Include explanation with maximum offset measurement
    - _Requirements: 7.2_

  - [ ] 8.4 Write property test for lane deviation detection
    - **Property 15: Lane deviation detection**
    - **Validates: Requirements 7.2**

  - [ ] 8.5 Create diagonal running detection
    - Integrate path length from foot_center trajectory across all frames
    - Expected path length = 40m (4 legs × 10m)
    - If actual_path < 0.95 × 40m (38m), create diagonal_running foul
    - Include explanation with actual path length
    - _Requirements: 7.3_

  - [ ] 8.6 Write property test for diagonal running detection
    - **Property 16: Diagonal running detection**
    - **Validates: Requirements 7.3**

  - [ ] 8.7 Create missing touches detection
    - Count total touch events detected
    - If count < 4, create missing_touches foul
    - Identify which touch points were missed based on state machine
    - Include explanation listing missing touches
    - _Requirements: 7.4_

  - [ ] 8.8 Write property test for missing touches detection
    - **Property 17: Missing touches detection**
    - **Validates: Requirements 7.4**

  - [ ] 8.9 Create false start detection
    - Check for forward movement > 0.3m before recorded start_time
    - If detected, create false_start foul
    - Include explanation with distance moved before start
    - _Requirements: 7.5_

  - [ ] 8.10 Write property test for false start detection
    - **Property 18: False start detection**
    - **Validates: Requirements 7.5**

  - [ ] 8.11 Write property test for foul reporting completeness
    - **Property 19: Foul reporting completeness**
    - **Validates: Requirements 7.6**

- [ ] 9. Implement cheat detection logic
  - [ ] 9.1 Create video editing detection
    - Extract frame timestamps from video metadata
    - Check for non-monotonic timestamps or gaps > expected frame interval
    - Compute pose keypoint displacement between consecutive frames
    - If displacement > 200px threshold, flag possible_edit
    - Use perceptual hashing to detect duplicated frames
    - Include evidence frame pointers
    - _Requirements: 8.1_

  - [ ] 9.2 Write property test for video editing detection
    - **Property 20: Video editing detection**
    - **Validates: Requirements 8.1**

  - [ ] 9.3 Create slow motion detection
    - Analyze frame time intervals (should be consistent at declared fps)
    - Compute motion signature: acceleration peaks and frequency spectrum
    - Compare to expected signature for human running
    - If acceleration peaks suppressed or frequency shifted, flag possible_slow_motion
    - Include confidence score and explanation
    - _Requirements: 8.2_

  - [ ] 9.4 Write property test for slow motion detection
    - **Property 21: Slow motion detection**
    - **Validates: Requirements 8.2**

  - [ ] 9.5 Create camera manipulation detection
    - Track calibration px_to_m ratio across all frames
    - Compute variance of ratio
    - If variance > 10% of mean, flag camera_move or zoom
    - Include explanation with variance measurement
    - _Requirements: 8.3_

  - [ ] 9.6 Write property test for camera manipulation detection
    - **Property 22: Camera manipulation detection**
    - **Validates: Requirements 8.3**

- [ ] 10. Implement scoring and rating engine
  - [ ] 10.1 Create database schema for benchmarks
    - Define benchmarks table with columns: age_group, gender, excellent_max_s, good_max_s, average_max_s
    - Create indexes on (age_group, gender) for fast lookups
    - Seed database with initial benchmark data for all age groups
    - _Requirements: 12.1, 12.4_

  - [ ] 10.2 Implement age group classification
    - Create mapping function from athlete age to age group
    - Support age groups: U6 (4-5), U8 (6-7), U10 (8-9), U12 (10-11), U14 (12-13), U16 (14-15), U18 (16-17), U20 (18-19), Senior (20-34), Masters-35-44, Masters-45-54, Masters-55-plus
    - Ensure every age maps to exactly one group
    - _Requirements: 9.1_

  - [ ] 10.3 Write property test for age group classification
    - **Property 23: Age group classification uniqueness**
    - **Validates: Requirements 9.1**

  - [ ] 10.4 Implement benchmark retrieval and rating assignment
    - Query database for benchmark thresholds based on age_group and gender
    - Compare total_time to thresholds
    - Assign rating: Excellent if time ≤ excellent_max_s, Good if ≤ good_max_s, Average if ≤ average_max_s, else Poor
    - Handle missing benchmarks with appropriate error
    - _Requirements: 9.2, 9.3_

  - [ ] 10.5 Write property test for rating assignment
    - **Property 24: Rating assignment uniqueness**
    - **Validates: Requirements 9.3**

  - [ ] 10.6 Implement agility score computation
    - Compute time component (0-50 points) normalized against benchmarks
    - Compute turn efficiency component (0-30 points) based on turn times
    - Compute acceleration component (0-20 points) based on max speed
    - Sum components and clamp to [0, 100] range
    - Include overall confidence score for analysis
    - _Requirements: 9.4, 9.5_

  - [ ] 10.7 Write property test for agility score bounds
    - **Property 25: Agility score bounds**
    - **Validates: Requirements 9.4**

- [ ] 11. Implement suggestion generator
  - [ ] 11.1 Create performance analysis logic
    - Compute turn times (time from line touch to resuming 80% max speed)
    - Calculate average turn time across all turns
    - Compute acceleration in first 2m of each leg
    - Calculate segment time variance
    - _Requirements: 10.1_

  - [ ] 11.2 Implement suggestion generation rules
    - If avg_turn_time > 0.5s, generate turn_efficiency suggestion: "Practice 180° quick-turn drills; focus on faster decel + re-accel"
    - If lane_deviation foul detected, generate lane_control suggestion: "Use cone drills to reduce lateral drift; keep body lean low through the turn"
    - If avg_acceleration < threshold, generate acceleration suggestion: "Work on explosive starts; practice sprint technique with resistance bands"
    - If segment variance > threshold, generate pacing suggestion: "Focus on pacing consistency; practice maintaining speed across all legs"
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

  - [ ] 11.3 Write property test for turn inefficiency suggestions
    - **Property 26: Suggestion generation for turn inefficiency**
    - **Validates: Requirements 10.2**

  - [ ] 11.4 Write property test for lane deviation suggestions
    - **Property 27: Suggestion generation for lane deviation**
    - **Validates: Requirements 10.3**

- [ ] 12. Implement report generator
  - [ ] 12.1 Create JSON output formatter
    - Build complete JSON structure with all required fields
    - Format times with 2 decimal places
    - Format confidence scores in range [0.00, 1.00]
    - Include all events, segments, fouls, cheat_reasons, suggestions
    - Add visual_debug section with keyframe image references
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 12.2 Write property test for JSON output completeness
    - **Property 28: JSON output completeness**
    - **Validates: Requirements 11.1**

  - [ ] 12.3 Write property test for event and foul output structure
    - **Property 30: Event and foul output structure**
    - **Validates: Requirements 11.3, 11.4**

  - [ ] 12.4 Implement keyframe capture and storage
    - Capture keyframes at significant events: start frame, each touch frame, foul frames
    - Store at least 3 keyframes per analysis
    - Save keyframe images to S3 storage
    - Include S3 URLs in visual_debug section
    - For each foul/cheat, include frame evidence pointers
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 12.5 Write property test for keyframe evidence capture
    - **Property 31: Keyframe evidence capture**
    - **Validates: Requirements 13.2**

- [ ] 13. Implement orchestration and API
  - [ ] 13.1 Create Celery task for async processing
    - Define Celery task that accepts session_id and video path
    - Orchestrate full pipeline: preflight → calibration → vision → events → rules → scoring → suggestions → report
    - Handle errors at each stage with appropriate recovery
    - Update job status in database (pending, processing, completed, failed)
    - Store final AnalysisResult to database
    - _Requirements: All_

  - [ ] 13.2 Create API endpoints for job management
    - POST /api/upload - accepts video and metadata, returns session_id, queues Celery task
    - GET /api/status/{session_id} - returns job status (pending/processing/completed/failed)
    - GET /api/result/{session_id} - returns full JSON analysis result
    - GET /api/benchmarks - returns available benchmark data (admin only)
    - POST /api/benchmarks - imports new benchmark data (admin only)
    - _Requirements: 1.1, 11.1, 12.1, 12.2_

  - [ ] 13.3 Implement authentication and authorization
    - Add JWT-based authentication for API endpoints
    - Implement role-based access control (athlete, coach, admin)
    - Protect admin endpoints (benchmark management)
    - Add rate limiting per user
    - _Requirements: All (security)_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Create admin tools for benchmark management
  - [ ] 15.1 Implement benchmark import functionality
    - Create CLI tool or admin API endpoint to import CSV/JSON benchmark data
    - Validate imported data (required fields, valid ranges)
    - Support bulk insert/update of benchmark tables
    - _Requirements: 12.2_

  - [ ] 15.2 Implement historical result re-evaluation
    - Create admin endpoint to trigger re-evaluation of past results
    - Fetch stored analysis data and recompute ratings with updated benchmarks
    - Update database with new ratings while preserving original timing data
    - _Requirements: 12.3_

- [ ] 16. Implement error handling and logging
  - [ ] 16.1 Add comprehensive error handling
    - Wrap all processing stages in try-except blocks
    - Return appropriate HTTP status codes and error messages
    - Implement graceful degradation (e.g., interpolate missing keypoints)
    - Return partial results when full analysis cannot complete
    - _Requirements: All_

  - [ ] 16.2 Set up structured logging
    - Log all processing stages with session_id for traceability
    - Log errors with full context (stack trace, input data)
    - Log performance metrics (processing time per stage)
    - Configure log levels (DEBUG, INFO, WARNING, ERROR)
    - _Requirements: All_

- [ ] 17. Create deployment configuration
  - [ ] 17.1 Set up Docker containers
    - Create Dockerfile for FastAPI application
    - Create Dockerfile for Celery worker with GPU support
    - Create docker-compose.yml for local development (API, worker, PostgreSQL, Redis)
    - _Requirements: All_

  - [ ] 17.2 Configure production infrastructure
    - Set up GPU-enabled compute instances for Celery workers
    - Configure S3-compatible object storage
    - Set up PostgreSQL with read replicas
    - Configure Redis for Celery queue
    - Set up Nginx reverse proxy with rate limiting
    - _Requirements: All_

  - [ ] 17.3 Implement monitoring and alerting
    - Add Prometheus metrics for processing time, success rate, error types, queue depth
    - Create Grafana dashboards for real-time monitoring
    - Set up alerts for high error rate, long queue depth, processing failures
    - _Requirements: All_

- [ ] 18. Final checkpoint - End-to-end validation
  - Ensure all tests pass, ask the user if questions arise.
  - Run end-to-end test with real video
  - Verify complete JSON output with all required fields
  - Validate performance (process 30s video in < 60s)
  - Confirm all acceptance criteria met
