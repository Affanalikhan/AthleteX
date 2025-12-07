# Implementation Plan

- [x] 1. Set up project structure and development environment



  - Create Python project for ML training pipeline with virtual environment
  - Create TypeScript/React Native project for mobile application
  - Set up database schema (PostgreSQL for backend, SQLite for mobile)
  - Configure Roboflow API access and credentials
  - Set up MLflow for experiment tracking
  - Initialize Git repository with appropriate .gitignore files


  - _Requirements: 1.5, 2.1, 2.2_

- [ ] 2. Implement data preprocessing module
- [ ] 2.1 Create data loading and validation interfaces
  - Implement VideoAnnotation TypeScript interfaces and Python dataclasses
  - Create DataPreprocessor class with Roboflow integration
  - Implement annotation validation logic for phase frames and joint positions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_

- [ ]* 2.2 Write property test for dataset diversity coverage
  - **Property 1: Dataset diversity coverage**
  - **Validates: Requirements 1.2, 1.3, 1.4**

- [ ]* 2.3 Write property test for phase annotation completeness
  - **Property 2: Phase annotation completeness**
  - **Validates: Requirements 2.1**

- [ ]* 2.4 Write property test for joint annotation completeness
  - **Property 3: Joint annotation completeness**
  - **Validates: Requirements 2.2**

- [ ] 2.5 Implement dataset splitting with athlete-level separation
  - Create splitDataset function that groups by athlete ID
  - Ensure no athlete appears in both train and test sets
  - _Requirements: 6.1_

- [ ]* 2.6 Write property test for athlete-level data separation
  - **Property 8: Athlete-level data separation**
  - **Validates: Requirements 6.1**

- [ ] 3. Implement pose estimation module
- [ ] 3.1 Integrate pose estimation library (MediaPipe or OpenPose)
  - Set up MediaPipe or OpenPose for video processing
  - Implement PoseEstimator interface with processVideo and processFrame methods
  - Create PoseKeypoints data structure with 17 body keypoints
  - Handle confidence scores for each keypoint
  - _Requirements: 5.1_

- [ ] 3.2 Implement video processing pipeline
  - Create video frame extraction from input files
  - Process each frame through pose estimator
  - Aggregate pose sequences with timestamps
  - Handle video format variations (MP4, MOV, etc.)
  - _Requirements: 5.1_

- [ ] 4. Implement feature extraction module
- [ ] 4.1 Create biomechanical feature calculations
  - Implement angle calculation function for three-point joints
  - Calculate knee flexion angles (left and right)
  - Calculate hip hinge depth
  - Calculate ankle plantar flexion (left and right)
  - Calculate torso alignment relative to vertical
  - _Requirements: 3.1_

- [ ] 4.2 Implement temporal and kinematic feature extraction
  - Calculate arm swing timing from shoulder/elbow/wrist positions
  - Compute center of mass trajectory across frames
  - Calculate takeoff velocity from COM movement
  - Measure ground contact time from phase detection
  - _Requirements: 3.2_

- [ ] 4.3 Implement symmetry calculations
  - Calculate left vs right leg symmetry score (0-1)
  - Compare corresponding joint angles between legs
  - _Requirements: 3.3_

- [ ] 4.4 Implement jump phase detection
  - Detect setup phase (initial crouch)
  - Detect takeoff phase (explosive extension)
  - Detect peak phase (maximum height)
  - Detect landing phase (ground contact)
  - Return frame ranges for each phase
  - _Requirements: 2.1, 4.3_

- [ ] 4.5 Add confidence scoring and error handling
  - Track which features successfully extracted
  - Reduce confidence score when extractions fail
  - Log extraction failures with details
  - _Requirements: 3.4_

- [ ]* 4.6 Write property test for complete feature extraction
  - **Property 4: Complete feature extraction**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ]* 4.7 Write property test for confidence reduction on extraction failure
  - **Property 5: Confidence reduction on extraction failure**
  - **Validates: Requirements 3.4**

- [ ] 5. Implement ML model architecture and training
- [ ] 5.1 Design and implement temporal model architecture
  - Create LSTM-based temporal model with 128 hidden units, 2 layers
  - Implement regression head for continuous outputs (height, quality, timing)
  - Implement classification head for error categories
  - Define model input/output interfaces
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5.2 Implement training pipeline
  - Create training loop with loss functions for regression and classification
  - Implement data batching and sequence padding
  - Add learning rate scheduling
  - Implement early stopping based on validation loss
  - Save model checkpoints during training
  - _Requirements: 5.3, 6.1_

- [ ] 5.3 Implement model evaluation metrics
  - Calculate Mean Absolute Error (MAE) for jump height
  - Calculate classification accuracy for error types
  - Measure inter-session consistency
  - Generate evaluation reports
  - _Requirements: 6.2, 6.3_

- [ ]* 5.4 Write property test for dual output optimization
  - **Property 7: Dual output optimization**
  - **Validates: Requirements 5.3**

- [ ]* 5.5 Write property test for MAE calculation completeness
  - **Property 9: MAE calculation completeness**
  - **Validates: Requirements 6.2**

- [ ]* 5.6 Write property test for complete model predictions
  - **Property 6: Complete model predictions**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 5.7 Train initial model on dataset
  - Load preprocessed training data
  - Train model for sufficient epochs to converge
  - Validate on test set
  - Export trained model to ONNX format
  - Document model performance metrics
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2, 6.3, 6.4_

- [ ] 6. Checkpoint - Ensure ML pipeline tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement feedback engine module
- [ ] 7.1 Create error-to-feedback mapping system
  - Define feedback templates for each error type (poor_depth, early_arm_swing, knee_valgus, forward_lean, stiff_landing)
  - Implement generateFeedback function that converts predictions to coaching messages
  - Create exercise recommendation database with squats, plyometrics, mobility drills
  - _Requirements: 9.1, 11.2_

- [ ] 7.2 Implement feedback prioritization and limiting
  - Create prioritizeCorrections function that ranks errors by severity
  - Limit corrections to maximum of 3 per session
  - Ensure positive reinforcement appears before corrections
  - _Requirements: 9.2, 9.3_

- [ ]* 7.3 Write property test for feedback includes actionable instructions
  - **Property 12: Feedback includes actionable instructions**
  - **Validates: Requirements 9.1**

- [ ]* 7.4 Write property test for correction limit enforcement
  - **Property 13: Correction limit enforcement**
  - **Validates: Requirements 9.2**

- [ ]* 7.5 Write property test for positive-first feedback ordering
  - **Property 14: Positive-first feedback ordering**
  - **Validates: Requirements 9.3**

- [ ] 7.3 Implement personalized recommendations
  - Tailor exercise recommendations based on user skill level
  - Adjust difficulty and volume based on user profile
  - Support different training goals (increase height, landing safety, speed/reactivity)
  - _Requirements: 11.1, 11.3_

- [ ]* 7.6 Write property test for training goal validation
  - **Property 16: Training goal validation**
  - **Validates: Requirements 11.1**

- [ ]* 7.7 Write property test for exercise recommendation generation
  - **Property 17: Exercise recommendation generation**
  - **Validates: Requirements 11.2**

- [ ]* 7.8 Write property test for personalized recommendations
  - **Property 18: Personalized recommendations**
  - **Validates: Requirements 11.3**

- [ ] 7.4 Implement safety mode adjustments
  - Create mode-specific recommendation filters for knee-safe mode
  - Create mode-specific recommendation filters for rehab mode
  - Implement risky pattern detection and warning generation
  - _Requirements: 15.1, 15.2, 15.3_

- [ ]* 7.9 Write property test for safety mode recommendation adjustment
  - **Property 27: Safety mode recommendation adjustment**
  - **Validates: Requirements 15.1, 15.2**

- [ ]* 7.10 Write property test for risky pattern warning generation
  - **Property 28: Risky pattern warning generation**
  - **Validates: Requirements 15.3**

- [ ] 7.5 Implement real-time and post-jump feedback modes
  - Create generateAudioCue function for real-time mode
  - Implement detailed explanation generation for post-jump mode
  - Ensure measurement consistency across modes
  - _Requirements: 10.1, 10.2, 10.3_

- [ ]* 7.11 Write property test for cross-mode measurement consistency
  - **Property 15: Cross-mode measurement consistency**
  - **Validates: Requirements 10.3**

- [ ] 8. Implement visualization generator module
- [ ] 8.1 Create skeleton overlay visualization
  - Draw skeleton connections between keypoints on video frames
  - Color-code skeleton based on detected errors
  - Render skeleton overlay on original video
  - _Requirements: 8.2_

- [ ] 8.2 Implement phase breakdown visualization
  - Create visual markers for each jump phase (Setup, Takeoff, Peak, Landing)
  - Generate frame-by-frame phase annotations
  - Use distinct colors for each phase
  - _Requirements: 8.1_

- [ ] 8.3 Create center of mass trajectory visualization
  - Calculate and draw COM trajectory line across frames
  - Highlight peak height point
  - Show trajectory arc
  - _Requirements: 8.3_

- [ ] 8.4 Implement symmetry comparison visualization
  - Create side-by-side or overlay comparison of left vs right leg
  - Generate charts showing symmetry scores over time
  - Highlight asymmetries visually
  - _Requirements: 8.4_

- [ ]* 8.5 Write property test for complete visualization generation
  - **Property 11: Complete visualization generation**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ] 9. Implement progress tracker module
- [ ] 9.1 Create database models and storage layer
  - Implement User, JumpSession, JumpRecord, Achievement database models
  - Create saveJump function with error handling and retry logic
  - Implement getSessionHistory query function
  - _Requirements: 12.1, 13.1, 13.2_

- [ ] 9.2 Implement session aggregate calculations
  - Calculate best jump height for session
  - Calculate average jump height for session
  - Calculate consistency score (standard deviation-based)
  - _Requirements: 12.1_

- [ ]* 9.3 Write property test for session aggregate metrics
  - **Property 19: Session aggregate metrics**
  - **Validates: Requirements 12.1**

- [ ] 9.4 Implement fatigue detection
  - Analyze performance degradation within session
  - Calculate fatigue indicator (0-1 score)
  - Track fatigue patterns across sessions
  - _Requirements: 12.2_

- [ ]* 9.5 Write property test for fatigue detection execution
  - **Property 20: Fatigue detection execution**
  - **Validates: Requirements 12.2**

- [ ] 9.6 Implement benchmark calculations
  - Calculate personal best from history
  - Load age group norms from reference data
  - Optionally load sport position benchmarks
  - Generate comparison metrics
  - _Requirements: 12.3_

- [ ]* 9.7 Write property test for progress comparison completeness
  - **Property 21: Progress comparison completeness**
  - **Validates: Requirements 12.3**

- [ ] 9.8 Implement streak tracking
  - Track consecutive days with jump activity
  - Reset streak on missed days
  - Store streak in user profile
  - _Requirements: 13.1_

- [ ]* 9.9 Write property test for streak calculation accuracy
  - **Property 22: Streak calculation accuracy**
  - **Validates: Requirements 13.1**

- [ ] 9.10 Implement achievement and badge system
  - Define milestone achievements (height clubs, consistency awards)
  - Detect when milestones are reached
  - Award badges exactly once per milestone
  - Store achievements in database
  - _Requirements: 13.2_

- [ ]* 9.11 Write property test for milestone badge awarding
  - **Property 23: Milestone badge awarding**
  - **Validates: Requirements 13.2**

- [ ] 10. Checkpoint - Ensure backend logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement results processor and confidence scoring
- [ ] 11.1 Create results formatting and unit conversion
  - Convert jump height to both cm and inches
  - Format all core metrics (power, explosiveness, takeoff efficiency, landing control)
  - Create result card data structures
  - _Requirements: 7.1, 7.2_

- [ ]* 11.2 Write property test for complete results display
  - **Property 10: Complete results display**
  - **Validates: Requirements 7.1, 7.2**

- [ ] 11.3 Implement confidence scoring system
  - Calculate confidence based on pose estimation quality
  - Reduce confidence for failed feature extractions
  - Include confidence percentage in all predictions
  - _Requirements: 14.1, 3.4_

- [ ]* 11.4 Write property test for confidence score inclusion
  - **Property 24: Confidence score inclusion**
  - **Validates: Requirements 14.1**

- [ ] 11.5 Implement confidence explanation generation
  - Create explanations for confidence scores
  - List factors affecting confidence (lighting, occlusion, etc.)
  - Make explanations available on request
  - _Requirements: 14.2, 14.3_

- [ ]* 11.6 Write property test for confidence explanation availability
  - **Property 25: Confidence explanation availability**
  - **Validates: Requirements 14.2**

- [ ] 11.7 Implement low confidence handling
  - Detect when confidence < 80%
  - Generate camera positioning tips
  - Display tips to user
  - _Requirements: 14.4_

- [ ]* 11.8 Write property test for low confidence triggers tips
  - **Property 26: Low confidence triggers tips**
  - **Validates: Requirements 14.4**

- [ ] 12. Implement mobile user interface
- [ ] 12.1 Create home screen with one-tap recording
  - Design home screen layout with prominent record button
  - Implement one-tap jump recording start
  - Display quick stats (recent best, streak)
  - _Requirements: 16.1, 13.3_

- [ ] 12.2 Create recording screen with real-time feedback
  - Implement minimal UI during recording
  - Add audio cue playback for real-time mode
  - Show recording timer
  - _Requirements: 10.1, 16.2_

- [ ] 12.3 Create results screen with performance cards
  - Design card layout for jump metrics
  - Add color indicators for performance levels
  - Display jump height in both units
  - Show all core metrics with short explanations
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 12.4 Create feedback screen with coaching tips
  - Display positive reinforcement section
  - Display corrections section (max 3)
  - Show exercise recommendations with descriptions
  - Add links to exercise demonstration videos
  - _Requirements: 9.1, 9.2, 9.3, 11.2_

- [ ] 12.5 Create visual breakdown screen
  - Display video with skeleton overlay
  - Show phase markers and timeline
  - Display COM trajectory visualization
  - Show symmetry comparison chart
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12.6 Create progress screen with charts and benchmarks
  - Display jump history chart
  - Show best/average/consistency metrics
  - Display benchmark comparisons
  - Show streak counter and achievements
  - _Requirements: 12.1, 12.3, 12.4, 13.1, 13.2, 13.3_

- [ ] 12.7 Create settings screen for profile and preferences
  - User profile form (age, gender, height, weight, skill level)
  - Training goal selection
  - Safety mode selection (standard, knee-safe, rehab)
  - _Requirements: 11.1, 15.1, 15.2_

- [ ] 12.8 Implement confidence and explanation UI
  - Display confidence percentage on results
  - Add "Why this score?" button
  - Show explanation modal with factors
  - Display camera positioning tips when confidence low
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 13. Implement error handling throughout application
- [ ] 13.1 Add video processing error handling
  - Handle corrupted/unreadable video files
  - Handle pose estimation failures
  - Validate video duration (1-3 seconds)
  - Provide user-friendly error messages
  - _Requirements: All video processing requirements_

- [ ] 13.2 Add feature extraction error handling
  - Handle missing keypoints with interpolation
  - Detect impossible biomechanical values
  - Apply bounds checking
  - Reduce confidence appropriately
  - _Requirements: 3.4_

- [ ] 13.3 Add model prediction error handling
  - Catch inference exceptions
  - Implement retry logic
  - Apply sanity checks to predictions
  - Clip values to reasonable ranges
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 13.4 Add data storage error handling
  - Implement retry with exponential backoff
  - Cache locally on failure
  - Sync when connection restored
  - Handle storage quota exceeded
  - _Requirements: 12.1, 13.1, 13.2_

- [ ] 13.5 Add network error handling
  - Queue operations for offline mode
  - Retry cloud sync in background
  - Handle model download failures
  - Show offline indicators
  - _Requirements: 1.5_

- [ ] 13.6 Add user input validation
  - Validate profile data (positive values, reasonable ranges)
  - Enforce safety mode mutual exclusivity
  - Show inline error messages
  - Prevent invalid submissions
  - _Requirements: 11.1, 15.1, 15.2_

- [ ] 14. Implement backend API services
- [ ] 14.1 Create user management API endpoints
  - POST /users - Create user profile
  - GET /users/:id - Get user profile
  - PUT /users/:id - Update user profile
  - _Requirements: User profile management_

- [ ] 14.2 Create jump analysis API endpoints
  - POST /jumps/analyze - Upload video and get analysis
  - GET /jumps/:id - Get jump details
  - GET /users/:id/jumps - Get user's jump history
  - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 8.4_

- [ ] 14.3 Create progress tracking API endpoints
  - GET /users/:id/progress - Get progress metrics
  - GET /users/:id/benchmarks - Get benchmark comparisons
  - GET /users/:id/achievements - Get earned badges
  - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2_

- [ ] 14.4 Implement model serving endpoint
  - Load trained ONNX model
  - Accept feature vectors
  - Return predictions with confidence
  - Handle inference errors gracefully
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 14.1_

- [ ] 15. Final checkpoint - End-to-end integration testing
  - Ensure all tests pass, ask the user if questions arise.
