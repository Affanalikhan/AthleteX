// Video Upload Jump Analysis
let detector = null;
let video = null;
let canvas = null;
let ctx = null;
let calibrationPoints = [];
let pixelsPerMeter = null;
let isAnalyzing = false;
let videoFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    video = document.getElementById('uploadedVideo');
    canvas = document.getElementById('analysisCanvas');
    ctx = canvas.getContext('2d');
    
    setupEventListeners();
    loadModel();
}

function setupEventListeners() {
    const uploadBox = document.getElementById('uploadBox');
    const videoInput = document.getElementById('videoInput');
    
    // Upload box click
    uploadBox.addEventListener('click', () => videoInput.click());
    
    // File input change
    videoInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    });
    
    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('dragover');
    });
    
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            handleFile(file);
        }
    });
    
    // Video loaded
    video.addEventListener('loadedmetadata', onVideoLoaded);
    
    // Canvas click for calibration
    canvas.addEventListener('click', handleCanvasClick);
    
    // Buttons
    document.getElementById('pauseBtn').addEventListener('click', () => {
        if (video.paused) {
            video.play();
            document.getElementById('pauseBtn').textContent = 'Pause Video';
        } else {
            video.pause();
            document.getElementById('pauseBtn').textContent = 'Play Video';
        }
    });
    
    document.getElementById('resetCalibrationBtn').addEventListener('click', resetCalibration);
    document.getElementById('confirmCalibrationBtn').addEventListener('click', confirmCalibration);
    document.getElementById('autoCalibrationBtn').addEventListener('click', autoCalibrate);
    document.getElementById('analyzeBtn').addEventListener('click', analyzeJump);
    document.getElementById('newVideoBtn').addEventListener('click', resetAll);
}

async function loadModel() {
    showStatus('Loading AI model...', 'info');
    try {
        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        showStatus('Model loaded successfully!', 'success');
    } catch (error) {
        showStatus('Error loading model: ' + error.message, 'error');
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.type.startsWith('video/')) {
        showStatus('Please select a valid video file', 'error');
        return;
    }
    
    videoFile = file;
    const url = URL.createObjectURL(file);
    video.src = url;
    
    document.getElementById('videoContainer').style.display = 'block';
    showStatus('Video loaded. Please wait for it to load completely...', 'info');
}

function onVideoLoaded() {
    // Setup canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Show calibration section
    document.getElementById('calibrationSection').style.display = 'block';
    document.getElementById('canvasContainer').style.display = 'block';
    
    // Draw first frame
    video.pause();
    video.currentTime = 0;
    drawFrame();
    
    // Only update canvas when video is playing AND calibration is not in progress
    video.addEventListener('timeupdate', () => {
        if (!isAnalyzing && calibrationPoints.length === 0) {
            drawFrame();
        }
    });
    
    showStatus('Video ready! Play/pause the video and click two points of known distance on the canvas', 'success');
}

function drawFrame() {
    // Clear and draw current video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw calibration points with larger, more visible markers
    calibrationPoints.forEach((point, index) => {
        // Outer circle (white border)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // Inner circle (red)
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Label with background
        ctx.fillStyle = '#000000';
        ctx.fillRect(point.x + 15, point.y - 25, 35, 25);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`P${index + 1}`, point.x + 20, point.y - 8);
        
        // Crosshair
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(point.x - 15, point.y);
        ctx.lineTo(point.x + 15, point.y);
        ctx.moveTo(point.x, point.y - 15);
        ctx.lineTo(point.x, point.y + 15);
        ctx.stroke();
    });
    
    // Draw line between points
    if (calibrationPoints.length === 2) {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y);
        ctx.lineTo(calibrationPoints[1].x, calibrationPoints[1].y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const distance = Math.sqrt(
            Math.pow(calibrationPoints[1].x - calibrationPoints[0].x, 2) +
            Math.pow(calibrationPoints[1].y - calibrationPoints[0].y, 2)
        );
        
        // Distance label with background
        const midX = (calibrationPoints[0].x + calibrationPoints[1].x) / 2;
        const midY = (calibrationPoints[0].y + calibrationPoints[1].y) / 2;
        
        const text = `${distance.toFixed(1)} pixels`;
        ctx.font = 'bold 20px Arial';
        const textWidth = ctx.measureText(text).width;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(midX - textWidth/2 - 10, midY - 30, textWidth + 20, 30);
        
        ctx.fillStyle = '#FFFF00';
        ctx.fillText(text, midX - textWidth/2, midY - 8);
    }
}

function handleCanvasClick(e) {
    if (calibrationPoints.length >= 2 || pixelsPerMeter !== null) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    calibrationPoints.push({ x, y });
    
    // Pause video immediately when first point is clicked
    if (calibrationPoints.length === 1) {
        if (!video.paused) {
            video.pause();
            document.getElementById('pauseBtn').textContent = '▶️ Play Video';
        }
        
        // Redraw with first point
        drawFrame();
        
        const pointsText = `✓ Point 1 selected at (${Math.round(x)}, ${Math.round(y)}). Click to select Point 2`;
        document.getElementById('calibrationPoints').innerHTML = 
            `<strong style="color: #4CAF50;">${pointsText}</strong>`;
        showStatus('Point 1 selected. Click on the canvas to select Point 2', 'info');
    } 
    else if (calibrationPoints.length === 2) {
        // Redraw with both points
        drawFrame();
        
        const pointsText = `✓ Both points selected!`;
        document.getElementById('calibrationPoints').innerHTML = 
            `<strong style="color: #4CAF50;">${pointsText}</strong>`;
        
        document.getElementById('calibrationInput').style.display = 'block';
        showStatus('Perfect! Now enter the real distance between these two points in meters', 'success');
    }
}

function resetCalibration() {
    calibrationPoints = [];
    pixelsPerMeter = null;
    document.getElementById('calibrationPoints').innerHTML = '';
    document.getElementById('calibrationInput').style.display = 'none';
    document.getElementById('analysisControls').style.display = 'none';
    
    // Clear canvas and redraw current frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    showStatus('Calibration reset. Click two points again', 'info');
}

function confirmCalibration() {
    const realDistance = parseFloat(document.getElementById('realDistance').value);
    
    if (!realDistance || realDistance <= 0) {
        showStatus('Please enter a valid distance', 'error');
        return;
    }
    
    const pixelDistance = Math.sqrt(
        Math.pow(calibrationPoints[1].x - calibrationPoints[0].x, 2) +
        Math.pow(calibrationPoints[1].y - calibrationPoints[0].y, 2)
    );
    
    pixelsPerMeter = pixelDistance / realDistance;
    
    showStatus(`✓ Manual calibration complete! Scale: ${pixelsPerMeter.toFixed(2)} pixels per meter`, 'success');
    document.getElementById('calibrationSection').style.display = 'none';
    document.getElementById('analysisControls').style.display = 'flex';
}

async function autoCalibrate() {
    if (!detector) {
        showStatus('AI model not loaded yet. Please wait...', 'error');
        return;
    }
    
    const personHeight = parseFloat(document.getElementById('personHeight').value);
    
    if (!personHeight || personHeight <= 0 || personHeight > 3) {
        showStatus('Please enter a valid height (between 1.0 and 2.5 meters)', 'error');
        return;
    }
    
    showStatus('Detecting person in video... Please wait', 'info');
    document.getElementById('autoCalibrationBtn').disabled = true;
    
    // Seek to middle of video for better detection
    video.currentTime = video.duration / 2;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
        const poses = await detector.estimatePoses(video);
        
        if (poses.length === 0) {
            showStatus('No person detected in video. Please use manual calibration.', 'error');
            document.getElementById('autoCalibrationBtn').disabled = false;
            return;
        }
        
        const pose = poses[0];
        
        // Get head and ankle keypoints
        const nose = pose.keypoints.find(kp => kp.name === 'nose');
        const leftAnkle = pose.keypoints.find(kp => kp.name === 'left_ankle');
        const rightAnkle = pose.keypoints.find(kp => kp.name === 'right_ankle');
        
        if (!nose || nose.score < 0.3) {
            showStatus('Could not detect head clearly. Please use manual calibration.', 'error');
            document.getElementById('autoCalibrationBtn').disabled = false;
            return;
        }
        
        let ankle = null;
        if (leftAnkle && leftAnkle.score > 0.3) {
            ankle = leftAnkle;
        } else if (rightAnkle && rightAnkle.score > 0.3) {
            ankle = rightAnkle;
        }
        
        if (!ankle) {
            showStatus('Could not detect feet clearly. Please use manual calibration.', 'error');
            document.getElementById('autoCalibrationBtn').disabled = false;
            return;
        }
        
        // Calculate person's height in pixels
        const heightInPixels = Math.abs(ankle.y - nose.y);
        
        // Calculate pixels per meter
        pixelsPerMeter = heightInPixels / personHeight;
        
        // Draw visualization
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Draw height line
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(nose.x, nose.y);
        ctx.lineTo(ankle.x, ankle.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw markers
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(nose.x, nose.y, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ankle.x, ankle.y, 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 400, 80);
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`✓ Auto-calibration successful!`, 20, 35);
        ctx.fillText(`Height: ${personHeight}m = ${heightInPixels.toFixed(1)} pixels`, 20, 60);
        ctx.fillText(`Scale: ${pixelsPerMeter.toFixed(2)} pixels/meter`, 20, 85);
        
        showStatus(`✓ Auto-calibration complete! Scale: ${pixelsPerMeter.toFixed(2)} pixels per meter`, 'success');
        document.getElementById('calibrationSection').style.display = 'none';
        document.getElementById('analysisControls').style.display = 'flex';
        
    } catch (error) {
        showStatus('Error during auto-calibration: ' + error.message, 'error');
        console.error(error);
    }
    
    document.getElementById('autoCalibrationBtn').disabled = false;
}

async function analyzeJump() {
    if (!detector) {
        showStatus('AI model not loaded yet', 'error');
        return;
    }
    
    if (!pixelsPerMeter) {
        showStatus('Please complete calibration first', 'error');
        return;
    }
    
    isAnalyzing = true;
    document.getElementById('analyzeBtn').disabled = true;
    document.getElementById('progressBar').style.display = 'block';
    showStatus('Analyzing video... This may take a moment', 'info');
    
    video.currentTime = 0;
    await video.play();
    
    const positions = [];
    const frameInterval = 1 / 30; // Process every frame (30 FPS)
    
    const processFrame = async () => {
        if (video.ended || !isAnalyzing) {
            await finishAnalysis(positions);
            return;
        }
        
        try {
            const poses = await detector.estimatePoses(video);
            
            if (poses.length > 0) {
                const pose = poses[0];
                const leftAnkle = pose.keypoints.find(kp => kp.name === 'left_ankle');
                const rightAnkle = pose.keypoints.find(kp => kp.name === 'right_ankle');
                const leftHeel = pose.keypoints.find(kp => kp.name === 'left_heel');
                const rightHeel = pose.keypoints.find(kp => kp.name === 'right_heel');
                
                // Use the furthest forward point (ankle or heel)
                let leftX = null, rightX = null;
                
                if (leftAnkle && leftAnkle.score > 0.3) {
                    leftX = leftAnkle.x;
                }
                if (leftHeel && leftHeel.score > 0.3 && (!leftX || leftHeel.x > leftX)) {
                    leftX = leftHeel.x;
                }
                
                if (rightAnkle && rightAnkle.score > 0.3) {
                    rightX = rightAnkle.x;
                }
                if (rightHeel && rightHeel.score > 0.3 && (!rightX || rightHeel.x > rightX)) {
                    rightX = rightHeel.x;
                }
                
                if (leftX !== null && rightX !== null) {
                    // Use the furthest forward foot
                    const maxX = Math.max(leftX, rightX);
                    const minX = Math.min(leftX, rightX);
                    const avgX = (leftX + rightX) / 2;
                    
                    positions.push({
                        time: video.currentTime,
                        x: avgX,
                        maxX: maxX,  // Furthest forward point
                        minX: minX,  // Furthest back point
                        leftAnkle: leftAnkle,
                        rightAnkle: rightAnkle,
                        leftX: leftX,
                        rightX: rightX
                    });
                }
            }
            
            // Update progress
            const progress = (video.currentTime / video.duration) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressFill').textContent = Math.round(progress) + '%';
            
            // Draw current frame with pose
            drawFrame();
            if (poses.length > 0) {
                drawPose(poses[0]);
            }
            
        } catch (error) {
            console.error('Error processing frame:', error);
        }
        
        requestAnimationFrame(processFrame);
    };
    
    processFrame();
}

function drawPose(pose) {
    pose.keypoints.forEach(keypoint => {
        if (keypoint.score > 0.3) {
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    
    // Highlight ankles
    const leftAnkle = pose.keypoints.find(kp => kp.name === 'left_ankle');
    const rightAnkle = pose.keypoints.find(kp => kp.name === 'right_ankle');
    
    if (leftAnkle && leftAnkle.score > 0.3) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(leftAnkle.x, leftAnkle.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    if (rightAnkle && rightAnkle.score > 0.3) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rightAnkle.x, rightAnkle.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

async function finishAnalysis(positions) {
    video.pause();
    isAnalyzing = false;
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('progressBar').style.display = 'none';
    
    if (positions.length < 10) {
        showStatus('Not enough data points detected. Please ensure the person is clearly visible in the video', 'error');
        return;
    }
    
    // Find start and end positions
    const startPos = findStartPosition(positions);
    const endPos = findEndPosition(positions);
    
    if (!startPos || !endPos) {
        showStatus('Could not detect jump start and end positions', 'error');
        return;
    }
    
    // Calculate distance using multiple methods for accuracy
    
    // Method 1: Average position (center of mass)
    const pixelDistanceAvg = Math.abs(endPos.x - startPos.x);
    
    // Method 2: Maximum forward position (most accurate for broad jump)
    const pixelDistanceMax = Math.abs(endPos.maxX - startPos.minX);
    
    // Method 3: Conservative estimate (back foot to back foot)
    const pixelDistanceMin = Math.abs(endPos.minX - startPos.minX);
    
    // Use the maximum distance method as primary (most accurate for broad jump rules)
    const pixelDistance = pixelDistanceMax;
    const distanceMeters = pixelDistance / pixelsPerMeter;
    
    // Calculate alternative measurements for reference
    const distanceAvg = pixelDistanceAvg / pixelsPerMeter;
    const distanceMin = pixelDistanceMin / pixelsPerMeter;
    
    // Show results
    displayResults(distanceMeters, startPos, endPos, positions, {
        primary: distanceMeters,
        average: distanceAvg,
        conservative: distanceMin,
        pixelDistance: pixelDistance
    });
    
    // Draw visualization
    video.currentTime = endPos.time;
    await new Promise(resolve => setTimeout(resolve, 100));
    drawFinalVisualization(startPos, endPos, positions);
}

function findStartPosition(positions) {
    // Apply smoothing filter to reduce noise
    const smoothed = smoothPositions(positions);
    
    // Find stable starting position in first 30% of video
    const startSegment = smoothed.slice(0, Math.floor(smoothed.length * 0.3));
    if (startSegment.length === 0) return null;
    
    // Calculate median position for stability
    const sortedX = startSegment.map(p => p.x).sort((a, b) => a - b);
    const medianX = sortedX[Math.floor(sortedX.length / 2)];
    
    // Find the most stable position (least variance)
    let bestPos = startSegment[0];
    let minVariance = Infinity;
    
    for (let i = 0; i < startSegment.length - 5; i++) {
        const window = startSegment.slice(i, i + 5);
        const avgX = window.reduce((sum, p) => sum + p.x, 0) / window.length;
        const variance = window.reduce((sum, p) => sum + Math.pow(p.x - avgX, 2), 0) / window.length;
        
        if (variance < minVariance) {
            minVariance = variance;
            bestPos = window[0];
        }
    }
    
    return bestPos;
}

function findEndPosition(positions) {
    // Apply smoothing filter
    const smoothed = smoothPositions(positions);
    
    // Find the maximum forward position (using maxX for most accurate landing point)
    let maxPos = smoothed[0];
    let maxDistance = smoothed[0].maxX;
    
    for (let i = 0; i < smoothed.length; i++) {
        if (smoothed[i].maxX > maxDistance) {
            maxDistance = smoothed[i].maxX;
            maxPos = smoothed[i];
        }
    }
    
    // Verify this is a stable landing (check next few frames)
    const maxIndex = smoothed.indexOf(maxPos);
    if (maxIndex < smoothed.length - 5) {
        const afterLanding = smoothed.slice(maxIndex, maxIndex + 5);
        const avgAfter = afterLanding.reduce((sum, p) => sum + p.maxX, 0) / afterLanding.length;
        
        // If position is stable after landing, use average
        if (Math.abs(avgAfter - maxDistance) < 30) {
            maxPos.x = avgAfter;
            maxPos.maxX = avgAfter;
        }
    }
    
    return maxPos;
}

function smoothPositions(positions) {
    // Apply moving average filter to reduce noise
    const windowSize = 3;
    const smoothed = [];
    
    for (let i = 0; i < positions.length; i++) {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(positions.length, i + Math.ceil(windowSize / 2));
        const window = positions.slice(start, end);
        
        const avgX = window.reduce((sum, p) => sum + p.x, 0) / window.length;
        const avgMaxX = window.reduce((sum, p) => sum + p.maxX, 0) / window.length;
        const avgMinX = window.reduce((sum, p) => sum + p.minX, 0) / window.length;
        
        smoothed.push({
            ...positions[i],
            x: avgX,
            maxX: avgMaxX,
            minX: avgMinX
        });
    }
    
    return smoothed;
}

function displayResults(distance, startPos, endPos, positions, measurements) {
    document.getElementById('resultBox').style.display = 'block';
    document.getElementById('distanceDisplay').textContent = distance.toFixed(3) + ' meters';
    
    const details = `
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #2e7d32;">📊 Measurement Details</h3>
            <p><strong>Official Distance (Furthest Point):</strong> ${measurements.primary.toFixed(3)} m</p>
            <p><strong>Center of Mass Distance:</strong> ${measurements.average.toFixed(3)} m</p>
            <p><strong>Conservative Estimate:</strong> ${measurements.conservative.toFixed(3)} m</p>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #1976D2;">🔍 Technical Data</h3>
            <p><strong>Start Time:</strong> ${startPos.time.toFixed(2)}s</p>
            <p><strong>Landing Time:</strong> ${endPos.time.toFixed(2)}s</p>
            <p><strong>Jump Duration:</strong> ${(endPos.time - startPos.time).toFixed(2)} seconds</p>
            <p><strong>Pixel Distance:</strong> ${measurements.pixelDistance.toFixed(1)} pixels</p>
            <p><strong>Calibration Scale:</strong> ${pixelsPerMeter.toFixed(2)} pixels/meter</p>
            <p><strong>Frames Analyzed:</strong> ${positions.length} frames</p>
            <p><strong>Video FPS:</strong> ${(positions.length / video.duration).toFixed(1)} fps</p>
        </div>
        
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #e65100;">ℹ️ Measurement Method</h3>
            <p>Distance measured from the back of the starting position to the furthest forward landing point, following official broad jump measurement rules.</p>
        </div>
    `;
    
    document.getElementById('detailsDisplay').innerHTML = details;
    showStatus('Analysis complete!', 'success');
    
    // Scroll to results
    document.getElementById('resultBox').scrollIntoView({ behavior: 'smooth' });
}

function drawFinalVisualization(startPos, endPos, positions) {
    drawFrame();
    
    // Draw trajectory (center of mass)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    positions.forEach((pos, i) => {
        const y = pos.leftAnkle ? pos.leftAnkle.y : canvas.height / 2;
        if (i === 0) {
            ctx.moveTo(pos.x, y);
        } else {
            ctx.lineTo(pos.x, y);
        }
    });
    ctx.stroke();
    
    // Draw maximum extent trajectory (furthest forward points)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    positions.forEach((pos, i) => {
        const y = pos.leftAnkle ? pos.leftAnkle.y : canvas.height / 2;
        if (i === 0) {
            ctx.moveTo(pos.maxX, y);
        } else {
            ctx.lineTo(pos.maxX, y);
        }
    });
    ctx.stroke();
    
    // Draw start position markers
    const startY = startPos.leftAnkle ? startPos.leftAnkle.y : canvas.height / 2;
    
    // Start back foot marker
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(startPos.minX, startY, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(startPos.minX, startY, 12, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Start label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(startPos.minX - 40, startY - 50, 80, 30);
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('START', startPos.minX - 30, startY - 28);
    
    // Draw end position markers
    const endY = endPos.leftAnkle ? endPos.leftAnkle.y : canvas.height / 2;
    
    // End furthest foot marker
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(endPos.maxX, endY, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(endPos.maxX, endY, 12, 0, 2 * Math.PI);
    ctx.stroke();
    
    // End label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(endPos.maxX - 40, endY - 50, 80, 30);
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('LANDING', endPos.maxX - 35, endY - 28);
    
    // Draw measurement line (from back of start to front of landing)
    const measureY = canvas.height - 80;
    
    // Vertical lines
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startPos.minX, startY);
    ctx.lineTo(startPos.minX, measureY);
    ctx.moveTo(endPos.maxX, endY);
    ctx.lineTo(endPos.maxX, measureY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Horizontal measurement line
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startPos.minX, measureY);
    ctx.lineTo(endPos.maxX, measureY);
    ctx.stroke();
    
    // Arrow heads
    const arrowSize = 15;
    // Left arrow
    ctx.beginPath();
    ctx.moveTo(startPos.minX, measureY);
    ctx.lineTo(startPos.minX + arrowSize, measureY - arrowSize/2);
    ctx.lineTo(startPos.minX + arrowSize, measureY + arrowSize/2);
    ctx.closePath();
    ctx.fillStyle = '#FFFF00';
    ctx.fill();
    // Right arrow
    ctx.beginPath();
    ctx.moveTo(endPos.maxX, measureY);
    ctx.lineTo(endPos.maxX - arrowSize, measureY - arrowSize/2);
    ctx.lineTo(endPos.maxX - arrowSize, measureY + arrowSize/2);
    ctx.closePath();
    ctx.fill();
    
    // Draw distance text
    const distance = Math.abs(endPos.maxX - startPos.minX) / pixelsPerMeter;
    const midX = (startPos.minX + endPos.maxX) / 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(midX - 100, measureY - 50, 200, 40);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.font = 'bold 28px Arial';
    ctx.strokeText(`${distance.toFixed(3)} m`, midX - 80, measureY - 20);
    
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(`${distance.toFixed(3)} m`, midX - 80, measureY - 20);
    
    // Add legend
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 280, 90);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('📏 Measurement Method:', 20, 30);
    ctx.font = '12px Arial';
    ctx.fillText('• Green: Starting position (back foot)', 20, 50);
    ctx.fillText('• Red: Landing position (front foot)', 20, 68);
    ctx.fillText('• Yellow: Official jump distance', 20, 86);
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = 'status-message ' + type;
    statusEl.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

function resetAll() {
    video.src = '';
    calibrationPoints = [];
    pixelsPerMeter = null;
    isAnalyzing = false;
    
    document.getElementById('videoContainer').style.display = 'none';
    document.getElementById('calibrationSection').style.display = 'none';
    document.getElementById('canvasContainer').style.display = 'none';
    document.getElementById('analysisControls').style.display = 'none';
    document.getElementById('resultBox').style.display = 'none';
    document.getElementById('progressBar').style.display = 'none';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showStatus('Ready for new video', 'info');
}
