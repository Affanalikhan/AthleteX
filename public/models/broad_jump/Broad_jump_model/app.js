// Global Variables
let detector = null;
let videoStream = null;
let calibrationPoints = [];
let pxPerMeter = null;
let referenceX = null;
let currentTrial = 1;
let trialResults = [];
let isTracking = false;
let animationId = null;

// Trial state
let trialState = {
    phase: 'waiting', // waiting, detecting, countdown, tracking, complete
    startX: null,
    positions: [],
    takeoffFrame: null,
    landingFrame: null
};

// Constants
const STATIC_FRAMES_REQUIRED = 5;
const STATIC_TOLERANCE = 10;
const TAKEOFF_VELOCITY = 20;
const LANDING_VELOCITY = 8;
const LANDING_STABLE_FRAMES = 4;

// Initialize
window.addEventListener('load', async () => {
    await loadModel();
    setupKeyboardControls();
});

// Load TensorFlow Pose Detection Model
async function loadModel() {
    try {
        console.log('Loading pose detection model...');
        
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        };
        
        detector = await poseDetection.createDetector(model, detectorConfig);
        
        console.log('Model loaded successfully');
        document.getElementById('loadingOverlay').classList.add('hidden');
    } catch (error) {
        console.error('Error loading model:', error);
        alert('Error loading AI model. Please refresh the page.');
    }
}

// Setup Keyboard Controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            const trialScreen = document.getElementById('trialScreen');
            if (trialScreen.classList.contains('active') && !isTracking) {
                startTrial();
            }
        }
    });
}

// Start Calibration
async function startCalibration() {
    document.getElementById('instructionsScreen').classList.remove('active');
    document.getElementById('calibrationScreen').classList.add('active');
    
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, facingMode: 'environment' }
        });
        
        const video = document.getElementById('calibrationVideo');
        video.srcObject = videoStream;
        
        const canvas = document.getElementById('calibrationCanvas');
        const ctx = canvas.getContext('2d');
        
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Cannot access camera. Please check permissions.');
    }
}

// Start Auto Calibration
async function startAutoCalibration() {
    // Get user height
    let userHeight = parseFloat(document.getElementById('userHeight').value);
    const unit = document.getElementById('heightUnit').value;
    
    if (!userHeight || userHeight <= 0) {
        alert('Please enter a valid height');
        return;
    }
    
    // Convert to meters
    if (unit === 'cm') {
        userHeight = userHeight / 100;
    } else if (unit === 'ft') {
        userHeight = userHeight * 0.3048;
    }
    
    if (userHeight < 1.0 || userHeight > 2.5) {
        alert('Height seems incorrect. Please check and try again.');
        return;
    }
    
    document.getElementById('calibrationStatus').textContent = 'Detecting your body...';
    document.getElementById('detectionCount').textContent = 'Detecting...';
    
    const video = document.getElementById('calibrationVideo');
    const canvas = document.getElementById('calibrationCanvas');
    const ctx = canvas.getContext('2d');
    
    let detectionCount = 0;
    let heightMeasurements = [];
    
    const detectHeight = async () => {
        const poses = await detector.estimatePoses(video);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (poses.length > 0) {
            const pose = poses[0];
            const keypoints = pose.keypoints;
            
            // Get head and ankle positions
            const nose = keypoints[0];
            const leftAnkle = keypoints[15];
            const rightAnkle = keypoints[16];
            
            if (nose.score > 0.3 && leftAnkle.score > 0.3 && rightAnkle.score > 0.3) {
                // Calculate body height in pixels
                const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
                const bodyHeightPx = Math.abs(avgAnkleY - nose.y);
                
                heightMeasurements.push(bodyHeightPx);
                detectionCount++;
                
                // Draw skeleton
                drawSkeleton(ctx, pose);
                
                // Draw height line
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(nose.x, nose.y);
                ctx.lineTo(nose.x, avgAnkleY);
                ctx.stroke();
                
                // Draw text
                ctx.fillStyle = '#4CAF50';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(`${bodyHeightPx.toFixed(0)} px`, nose.x + 20, (nose.y + avgAnkleY) / 2);
                
                document.getElementById('detectionCount').textContent = `${detectionCount}/10 frames`;
                
                if (detectionCount >= 10) {
                    // Calculate average
                    const avgHeightPx = heightMeasurements.reduce((a, b) => a + b, 0) / heightMeasurements.length;
                    
                    // Calculate pixels per meter
                    pxPerMeter = avgHeightPx / userHeight;
                    
                    console.log(`Auto Calibration: ${pxPerMeter.toFixed(1)} px/m`);
                    console.log(`User height: ${userHeight.toFixed(2)}m = ${avgHeightPx.toFixed(1)}px`);
                    
                    document.getElementById('calibrationStatus').textContent = 'Calibration Complete!';
                    document.getElementById('pixelDistance').textContent = `${pxPerMeter.toFixed(1)} px/m`;
                    
                    // Wait a moment then proceed
                    setTimeout(() => {
                        // Stop calibration video
                        if (videoStream) {
                            videoStream.getTracks().forEach(track => track.stop());
                        }
                        
                        // Move to trial screen
                        document.getElementById('calibrationScreen').classList.remove('active');
                        document.getElementById('trialScreen').classList.add('active');
                        document.getElementById('calibrationInfo').textContent = `${pxPerMeter.toFixed(1)} px/m`;
                        
                        // Start trial video
                        startTrialVideo();
                    }, 1500);
                    
                    return;
                }
            }
        } else {
            document.getElementById('calibrationStatus').textContent = 'Please stand in full view';
        }
        
        requestAnimationFrame(detectHeight);
    };
    
    detectHeight();
}

// Draw Skeleton
function drawSkeleton(ctx, pose) {
    const keypoints = pose.keypoints;
    
    // Draw keypoints
    keypoints.forEach(kp => {
        if (kp.score > 0.3) {
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    
    // Draw connections
    const connections = [
        [0, 1], [0, 2], [1, 3], [2, 4], // Head
        [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // Arms
        [5, 11], [6, 12], [11, 12], // Torso
        [11, 13], [13, 15], [12, 14], [14, 16] // Legs
    ];
    
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    
    connections.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];
        
        if (kp1.score > 0.3 && kp2.score > 0.3) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
        }
    });
}

// Start Trial Video
async function startTrialVideo() {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, facingMode: 'environment' }
        });
        
        const video = document.getElementById('trialVideo');
        video.srcObject = videoStream;
        
        const canvas = document.getElementById('trialCanvas');
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Cannot access camera');
    }
}

// Start Trial
async function startTrial() {
    if (isTracking) return;
    
    isTracking = true;
    document.getElementById('startTrialBtn').disabled = true;
    document.getElementById('trialStatus').textContent = 'Active';
    document.getElementById('trialStatus').classList.add('active');
    
    // Reset trial state
    trialState = {
        phase: 'detecting',
        startX: null,
        positions: [],
        takeoffFrame: null,
        landingFrame: null,
        staticCount: 0,
        prevX: null
    };
    
    // Phase 1: Detect start position
    await detectStartPosition();
    
    if (trialState.startX === null) {
        alert('Could not detect start position. Please try again.');
        resetTrial();
        return;
    }
    
    // Phase 2: Countdown
    await showCountdown();
    
    // Phase 3: Track jump
    await trackJump();
    
    // Calculate result
    const result = calculateResult();
    
    if (result) {
        trialResults.push(result);
        showTrialResult(result);
        
        // Move to next trial or results
        if (currentTrial < 3) {
            currentTrial++;
            document.getElementById('currentTrial').textContent = currentTrial;
            resetTrial();
        } else {
            showFinalResults();
        }
    } else {
        alert('Jump not detected. Please try again.');
        resetTrial();
    }
}

// Detect Start Position
function detectStartPosition() {
    return new Promise((resolve) => {
        const video = document.getElementById('trialVideo');
        const canvas = document.getElementById('trialCanvas');
        const ctx = canvas.getContext('2d');
        
        document.getElementById('statusDisplay').textContent = 'Stand still in starting position...';
        document.getElementById('detectionStatus').textContent = 'Detecting position';
        
        const timeout = setTimeout(() => {
            cancelAnimationFrame(animationId);
            resolve();
        }, 15000);
        
        const detect = async () => {
            if (trialState.phase !== 'detecting') {
                clearTimeout(timeout);
                resolve();
                return;
            }
            
            const poses = await detector.estimatePoses(video);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (poses.length > 0) {
                const pose = poses[0];
                const anklePos = getAnklePosition(pose);
                
                if (anklePos) {
                    const { x, y, left, right } = anklePos;
                    
                    // Draw ankles
                    drawCircle(ctx, left.x, left.y, 10, '#4CAF50');
                    drawCircle(ctx, right.x, right.y, 10, '#4CAF50');
                    drawCircle(ctx, x, y, 12, '#FF00FF');
                    
                    // Check if static
                    if (trialState.prevX !== null) {
                        if (Math.abs(x - trialState.prevX) < STATIC_TOLERANCE) {
                            trialState.staticCount++;
                        } else {
                            trialState.staticCount = Math.max(0, trialState.staticCount - 1);
                        }
                    }
                    
                    trialState.prevX = x;
                    
                    // Update UI
                    document.getElementById('statusDisplay').textContent = 
                        `Hold still: ${trialState.staticCount}/${STATIC_FRAMES_REQUIRED}`;
                    
                    if (trialState.staticCount >= STATIC_FRAMES_REQUIRED) {
                        trialState.startX = x;
                        trialState.phase = 'countdown';
                        clearTimeout(timeout);
                        resolve();
                        return;
                    }
                }
            }
            
            animationId = requestAnimationFrame(detect);
        };
        
        detect();
    });
}

// Show Countdown
function showCountdown() {
    return new Promise((resolve) => {
        const countdownEl = document.getElementById('countdownDisplay');
        const statusEl = document.getElementById('statusDisplay');
        statusEl.style.display = 'none';
        
        const countdown = ['READY', '3', '2', '1', 'START!'];
        let index = 0;
        
        const showNext = () => {
            if (index >= countdown.length) {
                countdownEl.textContent = '';
                countdownEl.classList.remove('start');
                statusEl.style.display = 'block';
                trialState.phase = 'tracking';
                resolve();
                return;
            }
            
            const text = countdown[index];
            countdownEl.textContent = text;
            
            if (text === 'START!') {
                countdownEl.classList.add('start');
            }
            
            index++;
            setTimeout(showNext, text === 'READY' ? 500 : 800);
        };
        
        showNext();
    });
}

// Track Jump
function trackJump() {
    return new Promise((resolve) => {
        const video = document.getElementById('trialVideo');
        const canvas = document.getElementById('trialCanvas');
        const ctx = canvas.getContext('2d');
        
        document.getElementById('statusDisplay').textContent = 'TRACKING JUMP...';
        document.getElementById('detectionStatus').textContent = 'Tracking';
        
        let tookOff = false;
        let prevSmooth = null;
        let stable = 0;
        let maxX = trialState.startX;
        
        const startTime = Date.now();
        
        const track = async () => {
            if (Date.now() - startTime > 10000) {
                cancelAnimationFrame(animationId);
                resolve();
                return;
            }
            
            const poses = await detector.estimatePoses(video);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw start line
            if (referenceX) {
                ctx.strokeStyle = '#FFFF00';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(referenceX, 0);
                ctx.lineTo(referenceX, canvas.height);
                ctx.stroke();
            }
            
            if (poses.length > 0) {
                const pose = poses[0];
                const anklePos = getAnklePosition(pose);
                
                if (anklePos) {
                    const { x, y } = anklePos;
                    
                    // Smooth position
                    const xSmooth = prevSmooth !== null ? 
                        0.3 * x + 0.7 * prevSmooth : x;
                    
                    trialState.positions.push(xSmooth);
                    
                    // Track max
                    if (xSmooth > maxX) {
                        maxX = xSmooth;
                    }
                    
                    if (prevSmooth !== null) {
                        const velocity = xSmooth - prevSmooth;
                        
                        if (!tookOff) {
                            if (Math.abs(velocity) > TAKEOFF_VELOCITY) {
                                tookOff = true;
                                trialState.takeoffFrame = trialState.positions.length;
                                console.log('Takeoff detected');
                            }
                        } else {
                            if (Math.abs(velocity) < LANDING_VELOCITY) {
                                stable++;
                            } else {
                                stable = 0;
                            }
                            
                            if (stable >= LANDING_STABLE_FRAMES) {
                                trialState.landingFrame = trialState.positions.length;
                                trialState.landingX = maxX;
                                console.log('Landing detected');
                                cancelAnimationFrame(animationId);
                                resolve();
                                return;
                            }
                        }
                    }
                    
                    prevSmooth = xSmooth;
                    
                    // Draw tracking
                    drawCircle(ctx, xSmooth, y, 15, '#4CAF50');
                    drawCircle(ctx, xSmooth, y, 18, '#FFFFFF', false);
                }
            }
            
            animationId = requestAnimationFrame(track);
        };
        
        track();
    });
}

// Calculate Result
function calculateResult() {
    if (!trialState.takeoffFrame || !trialState.landingFrame) {
        return null;
    }
    
    const startPos = referenceX || trialState.startX;
    const pixelDistance = Math.abs(trialState.landingX - startPos);
    const distanceMeters = pixelDistance / pxPerMeter;
    
    if (distanceMeters < 0.2 || distanceMeters > 5.0) {
        return null;
    }
    
    return {
        trial: currentTrial,
        distance: distanceMeters,
        pixelDistance: pixelDistance,
        takeoffFrame: trialState.takeoffFrame,
        landingFrame: trialState.landingFrame
    };
}

// Show Trial Result
function showTrialResult(result) {
    const statusEl = document.getElementById('statusDisplay');
    statusEl.innerHTML = `
        <div style="font-size: 1.5rem; color: #4CAF50;">
            TRIAL ${result.trial} COMPLETE<br>
            <span style="font-size: 2.5rem; font-weight: bold;">
                ${result.distance.toFixed(3)} meters
            </span>
        </div>
    `;
    
    setTimeout(() => {
        statusEl.textContent = '';
    }, 3000);
}

// Reset Trial
function resetTrial() {
    isTracking = false;
    document.getElementById('startTrialBtn').disabled = false;
    document.getElementById('trialStatus').textContent = 'Ready';
    document.getElementById('trialStatus').classList.remove('active');
    document.getElementById('detectionStatus').textContent = 'Waiting';
    document.getElementById('statusDisplay').textContent = '';
    
    const canvas = document.getElementById('trialCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Skip Trial
function skipTrial() {
    if (currentTrial < 3) {
        currentTrial++;
        document.getElementById('currentTrial').textContent = currentTrial;
        resetTrial();
    } else {
        showFinalResults();
    }
}

// Show Final Results
function showFinalResults() {
    // Stop video
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    
    document.getElementById('trialScreen').classList.remove('active');
    document.getElementById('resultsScreen').classList.add('active');
    
    // Calculate statistics
    const validResults = trialResults.filter(r => r !== null);
    
    if (validResults.length > 0) {
        const distances = validResults.map(r => r.distance);
        const best = Math.max(...distances);
        const avg = distances.reduce((a, b) => a + b, 0) / distances.length;
        
        document.getElementById('bestJump').textContent = best.toFixed(3);
        document.getElementById('avgJump').textContent = avg.toFixed(3);
        document.getElementById('validTrials').textContent = validResults.length;
        
        // Fill table
        const tbody = document.getElementById('resultsTableBody');
        tbody.innerHTML = '';
        
        for (let i = 1; i <= 3; i++) {
            const result = trialResults[i - 1];
            const row = tbody.insertRow();
            
            row.insertCell(0).textContent = `Trial ${i}`;
            
            if (result) {
                row.insertCell(1).textContent = `${result.distance.toFixed(3)} m`;
                const statusCell = row.insertCell(2);
                statusCell.textContent = '✓ Valid';
                statusCell.className = 'status-success';
            } else {
                row.insertCell(1).textContent = '-';
                const statusCell = row.insertCell(2);
                statusCell.textContent = '✗ Invalid';
                statusCell.className = 'status-failed';
            }
        }
    } else {
        document.getElementById('bestJump').textContent = '-';
        document.getElementById('avgJump').textContent = '-';
        document.getElementById('validTrials').textContent = '0';
    }
}

// Download Results
function downloadResults() {
    let csv = 'Trial,Distance (m),Status\n';
    
    for (let i = 1; i <= 3; i++) {
        const result = trialResults[i - 1];
        if (result) {
            csv += `${i},${result.distance.toFixed(3)},Valid\n`;
        } else {
            csv += `${i},-,Invalid\n`;
        }
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `broad_jump_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// Restart Test
function restartTest() {
    location.reload();
}

// Helper Functions
function getAnklePosition(pose) {
    try {
        const keypoints = pose.keypoints;
        const leftAnkle = keypoints[15];  // Left ankle
        const rightAnkle = keypoints[16]; // Right ankle
        
        if (leftAnkle.score > 0.3 && rightAnkle.score > 0.3) {
            const forwardX = Math.max(leftAnkle.x, rightAnkle.x);
            const avgY = (leftAnkle.y + rightAnkle.y) / 2;
            
            return {
                x: forwardX,
                y: avgY,
                left: leftAnkle,
                right: rightAnkle
            };
        }
    } catch (error) {
        console.error('Error getting ankle position:', error);
    }
    return null;
}

function drawCircle(ctx, x, y, radius, color, fill = true) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    
    if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
