from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
import time
import os

app = Flask(__name__)
CORS(app)

# Load YOLOv8 pose model
model = YOLO('yolov8s-pose.pt')

# Global variables
camera = None
start_line = None
finish_line = None
start_time = None
runner_started = False
runner_finished = False
uploaded_video_path = None
uploaded_video_cap = None

def get_camera():
    global camera
    if camera is None:
        for i in range(3):
            camera = cv2.VideoCapture(i, cv2.CAP_DSHOW)
            if camera.isOpened():
                print(f"Camera opened on index {i}")
                camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                camera.set(cv2.CAP_PROP_FPS, 30)
                break
            camera.release()
            camera = None
        if camera is None:
            print("Failed to open camera")
    return camera

def generate_frames():
    global start_line, finish_line, runner_started, runner_finished
    camera = get_camera()
    if camera is None:
        error_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(error_frame, 'Camera not available', (50, 240), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        ret, buffer = cv2.imencode('.jpg', error_frame)
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        return
    
    while True:
        success, frame = camera.read()
        if not success:
            time.sleep(0.1)
            continue
        
        results = model(frame, verbose=False)
        
        if start_line is not None:
            cv2.line(frame, (start_line, 0), (start_line, frame.shape[0]), (0, 255, 0), 4)
            cv2.putText(frame, 'START', (start_line + 10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        if finish_line is not None:
            cv2.line(frame, (finish_line, 0), (finish_line, frame.shape[0]), (0, 0, 255), 4)
            cv2.putText(frame, 'FINISH', (finish_line + 10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        if len(results) > 0 and results[0].keypoints is not None:
            keypoints = results[0].keypoints.xy.cpu().numpy()
            if len(keypoints) > 0:
                annotated_frame = results[0].plot()
                if runner_started and not runner_finished:
                    person_keypoints = keypoints[0]
                    if len(person_keypoints) > 12:
                        left_hip = person_keypoints[11]
                        right_hip = person_keypoints[12]
                        if left_hip[0] > 0 and right_hip[0] > 0:
                            hip_x = int((left_hip[0] + right_hip[0]) / 2)
                            if finish_line is not None:
                                crossed = (start_line < finish_line and hip_x >= finish_line) or \
                                         (start_line > finish_line and hip_x <= finish_line)
                                if crossed and not runner_finished:
                                    runner_finished = True
                frame = annotated_frame
        
        ret, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route('/')
def index():
    return HTML_TEMPLATE

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/calibrate', methods=['POST'])
def calibrate():
    global start_line, finish_line
    data = request.json
    if 'start_line' in data:
        start_line = int(data['start_line'])
    if 'finish_line' in data:
        finish_line = int(data['finish_line'])
    return jsonify({'status': 'success'})

@app.route('/start_test', methods=['POST'])
def start_test():
    global start_time, runner_started, runner_finished
    runner_started = True
    runner_finished = False
    start_time = time.time()
    return jsonify({'status': 'success', 'start_time': start_time})

@app.route('/check_status', methods=['GET'])
def check_status():
    global start_time, runner_started, runner_finished
    if runner_finished and start_time is not None:
        elapsed_time = time.time() - start_time
        speed_mps = 30 / elapsed_time
        speed_kmh = speed_mps * 3.6
        return jsonify({
            'finished': True, 'time': round(elapsed_time, 2),
            'speed_mps': round(speed_mps, 2), 'speed_kmh': round(speed_kmh, 2), 'distance': 30
        })
    return jsonify({'finished': False, 'started': runner_started})

@app.route('/reset', methods=['POST'])
def reset():
    global start_time, runner_started, runner_finished
    start_time = None
    runner_started = False
    runner_finished = False
    return jsonify({'status': 'success'})

@app.route('/get_runner_position', methods=['GET'])
def get_runner_position():
    global camera
    if camera is None or not camera.isOpened():
        return jsonify({'detected': False, 'position': 'unknown'})
    success, frame = camera.read()
    if not success:
        return jsonify({'detected': False, 'position': 'unknown'})
    results = model(frame, verbose=False)
    if len(results) > 0 and results[0].keypoints is not None:
        keypoints = results[0].keypoints.xy.cpu().numpy()
        if len(keypoints) > 0:
            person_keypoints = keypoints[0]
            visible_points = [kp for kp in person_keypoints if kp[0] > 0 and kp[1] > 0]
            if len(visible_points) > 0:
                avg_x = sum([kp[0] for kp in visible_points]) / len(visible_points)
                frame_width = frame.shape[1]
                position = 'left' if avg_x < frame_width/3 else 'right' if avg_x > frame_width*2/3 else 'center'
                return jsonify({'detected': True, 'position': position, 'x': int(avg_x), 'frame_width': frame_width})
    return jsonify({'detected': False, 'position': 'unknown'})

@app.route('/upload_video', methods=['POST'])
def upload_video():
    global uploaded_video_path, uploaded_video_cap
    try:
        print("Upload video request received")
        if 'video' not in request.files:
            print("Error: No video in request.files")
            return jsonify({'status': 'error', 'message': 'No video file provided'})
        
        video_file = request.files['video']
        print(f"Video file: {video_file.filename}")
        
        if video_file.filename == '':
            print("Error: Empty filename")
            return jsonify({'status': 'error', 'message': 'No file selected'})
        
        upload_folder = 'uploads'
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            print(f"Created upload folder: {upload_folder}")
        
        # Get file extension
        file_ext = os.path.splitext(video_file.filename)[1]
        uploaded_video_path = os.path.join(upload_folder, f'uploaded_video{file_ext}')
        
        print(f"Saving to: {uploaded_video_path}")
        video_file.save(uploaded_video_path)
        print(f"File saved successfully. Size: {os.path.getsize(uploaded_video_path)} bytes")
        
        # Release previous video if exists
        if uploaded_video_cap is not None:
            uploaded_video_cap.release()
        
        uploaded_video_cap = cv2.VideoCapture(uploaded_video_path)
        
        if not uploaded_video_cap.isOpened():
            print("Error: Could not open video with OpenCV")
            return jsonify({'status': 'error', 'message': 'Could not open video file. Format may not be supported.'})
        
        # Get video info
        frame_count = int(uploaded_video_cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = uploaded_video_cap.get(cv2.CAP_PROP_FPS)
        width = int(uploaded_video_cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(uploaded_video_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(f"Video opened successfully: {width}x{height}, {fps} FPS, {frame_count} frames")
        
        return jsonify({
            'status': 'success',
            'message': 'Video uploaded successfully',
            'info': {
                'width': width,
                'height': height,
                'fps': fps,
                'frames': frame_count
            }
        })
    except Exception as e:
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Upload failed: {str(e)}'})

@app.route('/get_video_frame', methods=['GET'])
def get_video_frame():
    global uploaded_video_cap
    try:
        print("Get video frame request")
        if uploaded_video_cap is None:
            print("Error: No video loaded")
            return jsonify({'status': 'error', 'message': 'No video loaded'})
        
        uploaded_video_cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        success, frame = uploaded_video_cap.read()
        
        if not success:
            print("Error: Could not read frame")
            return jsonify({'status': 'error', 'message': 'Could not read frame'})
        
        print(f"Frame read successfully: {frame.shape}")
        ret, buffer = cv2.imencode('.jpg', frame)
        
        if not ret:
            print("Error: Could not encode frame")
            return jsonify({'status': 'error', 'message': 'Could not encode frame'})
        
        return Response(buffer.tobytes(), mimetype='image/jpeg')
    except Exception as e:
        print(f"Get frame error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Error: {str(e)}'})

@app.route('/analyze_video', methods=['POST'])
def analyze_video():
    global uploaded_video_cap, start_line, finish_line
    try:
        print("Analyze video request received")
        if uploaded_video_cap is None:
            print("Error: No video loaded")
            return jsonify({'status': 'error', 'message': 'No video loaded'})
        
        data = request.json
        start_line = int(data['start_line'])
        finish_line = int(data['finish_line'])
        
        print(f"Calibration: Start={start_line}, Finish={finish_line}")
        
        uploaded_video_cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        fps = uploaded_video_cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(uploaded_video_cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        runner_start_frame = None
        runner_finish_frame = None
        frame_count = 0
        
        # SPEED OPTIMIZATION: Process every 3rd frame instead of every frame
        # This makes analysis 3x faster with minimal accuracy loss
        frame_skip = 3
        
        print(f"Analyzing video... FPS: {fps}, Total frames: {total_frames}, Processing every {frame_skip} frames")
        
        while True:
            success, frame = uploaded_video_cap.read()
            if not success:
                break
            
            frame_count += 1
            
            # Skip frames for faster processing
            if frame_count % frame_skip != 0:
                continue
            
            # Progress update every 30 frames
            if frame_count % 30 == 0:
                print(f"Processing frame {frame_count}/{total_frames}")
            
            results = model(frame, verbose=False)
            
            if len(results) > 0 and results[0].keypoints is not None:
                keypoints = results[0].keypoints.xy.cpu().numpy()
                
                if len(keypoints) > 0:
                    person_keypoints = keypoints[0]
                    
                    if len(person_keypoints) > 12:
                        left_hip = person_keypoints[11]
                        right_hip = person_keypoints[12]
                        
                        if left_hip[0] > 0 and right_hip[0] > 0:
                            hip_x = int((left_hip[0] + right_hip[0]) / 2)
                            
                            if runner_start_frame is None:
                                if abs(hip_x - start_line) < 50:
                                    runner_start_frame = frame_count
                                    print(f"✓ Runner detected at START line: frame {frame_count}, hip_x={hip_x}")
                            
                            elif runner_finish_frame is None:
                                crossed = (start_line < finish_line and hip_x >= finish_line) or \
                                         (start_line > finish_line and hip_x <= finish_line)
                                
                                if crossed:
                                    runner_finish_frame = frame_count
                                    print(f"✓ Runner crossed FINISH line: frame {frame_count}, hip_x={hip_x}")
                                    break
        
        print(f"Analysis complete. Processed {frame_count} frames")
        
        if runner_start_frame is None:
            print("Error: Could not detect runner at start line")
            return jsonify({
                'status': 'error',
                'message': f'Could not detect runner at START line. Processed {frame_count} frames. Try adjusting the start line position.'
            })
        
        if runner_finish_frame is None:
            print("Error: Could not detect runner at finish line")
            return jsonify({
                'status': 'error',
                'message': f'Runner detected at start (frame {runner_start_frame}) but did not cross FINISH line. Try adjusting the finish line position.'
            })
        
        elapsed_time = (runner_finish_frame - runner_start_frame) / fps
        speed_mps = 30 / elapsed_time
        speed_kmh = speed_mps * 3.6
        
        print(f"Results: Time={elapsed_time:.2f}s, Speed={speed_kmh:.2f} km/h")
        
        return jsonify({
            'status': 'success',
            'finished': True,
            'time': round(elapsed_time, 2),
            'speed_mps': round(speed_mps, 2),
            'speed_kmh': round(speed_kmh, 2),
            'distance': 30,
            'start_frame': runner_start_frame,
            'finish_frame': runner_finish_frame,
            'total_frames': frame_count
        })
    
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Analysis failed: {str(e)}'})  

@app.route('/reset_upload', methods=['POST'])
def reset_upload():
    global uploaded_video_path, uploaded_video_cap, start_line, finish_line
    if uploaded_video_cap is not None:
        uploaded_video_cap.release()
        uploaded_video_cap = None
    if uploaded_video_path and os.path.exists(uploaded_video_path):
        os.remove(uploaded_video_path)
        uploaded_video_path = None
    start_line = None
    finish_line = None
    return jsonify({'status': 'success'})

@app.route('/quit', methods=['POST'])
def quit_app():
    global camera
    if camera is not None:
        camera.release()
        camera = None
    import os, signal
    os.kill(os.getpid(), signal.SIGINT)
    return jsonify({'status': 'success'})

HTML_TEMPLATE = '''<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>30m Sprint Speed Calculator</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px}.container{max-width:1400px;margin:0 auto;background:white;border-radius:20px;padding:30px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}h1{text-align:center;color:#333;margin-bottom:30px;font-size:2em}.video-container{position:relative;width:100%;margin:0 auto 30px;background:#000;border-radius:10px;overflow:hidden}#videoFeed{width:100%;height:auto;display:block}#canvas{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:all}.status-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;color:white;font-size:1.5em;text-align:center;padding:20px;pointer-events:none}.status-overlay.hidden{display:none}.mode-selector{display:flex;justify-content:center;gap:10px;margin-bottom:20px}.mode-btn{padding:12px 30px;font-size:1em;border:2px solid #e2e8f0;background:white;border-radius:8px;cursor:pointer;transition:all 0.3s ease;font-weight:600}.mode-btn:hover{border-color:#667eea;transform:translateY(-2px)}.mode-btn.active{background:#667eea;color:white;border-color:#667eea}.controls{display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin-bottom:30px}.btn{padding:15px 30px;font-size:1.1em;border:none;border-radius:8px;cursor:pointer;transition:all 0.3s ease;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}.btn:disabled{opacity:0.5;cursor:not-allowed}.btn-primary{background:#667eea;color:white}.btn-primary:hover:not(:disabled){background:#5568d3;transform:translateY(-2px);box-shadow:0 5px 15px rgba(102,126,234,0.4)}.btn-secondary{background:#48bb78;color:white}.btn-secondary:hover:not(:disabled){background:#38a169;transform:translateY(-2px);box-shadow:0 5px 15px rgba(72,187,120,0.4)}.btn-success{background:#f56565;color:white}.btn-success:hover:not(:disabled){background:#e53e3e;transform:translateY(-2px);box-shadow:0 5px 15px rgba(245,101,101,0.4)}.btn-warning{background:#ed8936;color:white}.btn-warning:hover:not(:disabled){background:#dd6b20;transform:translateY(-2px);box-shadow:0 5px 15px rgba(237,137,54,0.4)}.btn-danger{background:#e53e3e;color:white}.btn-danger:hover:not(:disabled){background:#c53030;transform:translateY(-2px);box-shadow:0 5px 15px rgba(229,62,62,0.4)}.results{background:#f7fafc;padding:25px;border-radius:10px;margin-bottom:30px}.results h2{color:#2d3748;margin-bottom:20px;text-align:center}.result-item{display:flex;justify-content:space-between;padding:15px;background:white;margin-bottom:10px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}.result-item .label{font-weight:600;color:#4a5568;font-size:1.1em}.result-item .value{font-size:1.3em;color:#667eea;font-weight:700}.upload-section{background:#f7fafc;padding:20px;border-radius:10px;margin-bottom:20px}.upload-box{text-align:center;padding:20px;background:white;border-radius:8px;margin-bottom:15px}#fileName{margin-top:10px;color:#4a5568;font-weight:bold}.instructions{background:#edf2f7;padding:20px;border-radius:10px}.instructions h3{color:#2d3748;margin-bottom:15px}.instructions ol{margin-left:20px;color:#4a5568;line-height:1.8}.instructions li{margin-bottom:8px}
</style>
</head>
<body>
<div class="container">
<h1>30 Meter Standing Start Speed Test</h1>
<div class="video-container">
<img id="videoFeed" src="/video_feed" alt="Video Feed" crossorigin="anonymous">
<img id="uploadedVideoFrame" style="display:none;width:100%;height:auto;" alt="Uploaded Video">
<canvas id="canvas"></canvas>
<div id="statusOverlay" class="status-overlay"><p id="statusText">Loading camera...</p></div>
</div>
<div class="mode-selector">
<button id="liveModeBtn" class="mode-btn active">📹 Live Camera</button>
<button id="uploadModeBtn" class="mode-btn">📁 Upload Video</button>
</div>
<div id="liveMode" class="mode-content">
<div class="controls">
<button id="calibrate" class="btn btn-secondary">Calibrate 30m Distance</button>
<button id="startTest" class="btn btn-success" disabled>Start Test</button>
<button id="reset" class="btn btn-warning" disabled>Reset</button>
<button id="quit" class="btn btn-danger">Quit</button>
</div>
</div>
<div id="uploadMode" class="mode-content" style="display:none">
<div class="upload-section">
<div class="upload-box">
<input type="file" id="videoUpload" accept="video/*" style="display:none">
<button id="selectVideoBtn" class="btn btn-primary">📁 Select Video File</button>
<p id="fileName"></p>
</div>
<div class="controls">
<button id="calibrateUpload" class="btn btn-secondary" disabled>Calibrate 30m Distance</button>
<button id="analyzeVideo" class="btn btn-success" disabled>🔍 Analyze Video</button>
<button id="resetUpload" class="btn btn-warning" disabled>Reset</button>
</div>
</div>
</div>
<div class="results">
<h2>Results</h2>
<div class="result-item"><span class="label">Time:</span><span id="timeResult" class="value">--</span></div>
<div class="result-item"><span class="label">Speed:</span><span id="speedResult" class="value">--</span></div>
<div class="result-item"><span class="label">Distance:</span><span id="distanceResult" class="value">--</span></div>
</div>
<div class="instructions">
<h3>Quick Start Instructions</h3>
<ol>
<li><b>Live Camera:</b> Click "Calibrate", mark START and FINISH lines (vertical), click "Start Test"</li>
<li><b>Upload Video:</b> Switch to Upload tab, select video, calibrate, click "Analyze Video"</li>
<li>Lines should be 30 meters apart in real world</li>
<li>Camera should be perpendicular to running path</li>
</ol>
</div>
</div>
<script>
let canvas,ctx,startLine=null,finishLine=null,calibrationStep=0,isRunning=false,checkInterval=null,positionCheckInterval=null,lastPositionInstruction=0;
const synth=window.speechSynthesis;
function speak(t){const u=new SpeechSynthesisUtterance(t);u.rate=0.9;u.pitch=1;u.volume=1;synth.speak(u)}
function updateStatus(t){document.getElementById('statusText').textContent=t;document.getElementById('statusOverlay').classList.remove('hidden')}
function hideStatus(){document.getElementById('statusOverlay').classList.add('hidden')}
function drawCalibrationLines(){ctx.clearRect(0,0,canvas.width,canvas.height);if(startLine!==null){ctx.strokeStyle='#00ff00';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(startLine,0);ctx.lineTo(startLine,canvas.height);ctx.stroke();ctx.fillStyle='#00ff00';ctx.font='bold 24px Arial';ctx.fillText('START',startLine+10,30)}if(finishLine!==null){ctx.strokeStyle='#ff0000';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(finishLine,0);ctx.lineTo(finishLine,canvas.height);ctx.stroke();ctx.fillStyle='#ff0000';ctx.font='bold 24px Arial';ctx.fillText('FINISH',finishLine+10,30)}}
function startCalibration(){calibrationStep=0;startLine=null;finishLine=null;ctx.clearRect(0,0,canvas.width,canvas.height);updateStatus('Click on video to mark START line (vertical)');speak('Click on the video to mark the start line')}
function handleCanvasClick(e){const rect=canvas.getBoundingClientRect();const scaleX=canvas.width/rect.width;const x=(e.clientX-rect.left)*scaleX;const isUploadMode=document.getElementById('uploadMode').style.display!=='none';if(calibrationStep===0){startLine=Math.round(x);calibrationStep=1;fetch('/calibrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({start_line:startLine})});if(isUploadMode){loadVideoFrame();setTimeout(()=>drawCalibrationLines(),100)}else{drawCalibrationLines()}updateStatus('START line marked! Click to mark FINISH line (30m away from START)');speak('Start line marked. Now click to mark the finish line, 30 meters away from the start')}else if(calibrationStep===1){finishLine=Math.round(x);calibrationStep=2;fetch('/calibrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({start_line:startLine,finish_line:finishLine})});if(isUploadMode){loadVideoFrame();setTimeout(()=>drawCalibrationLines(),100)}else{drawCalibrationLines()}hideStatus();if(isUploadMode){document.getElementById('analyzeVideo').disabled=false;speak('Calibration complete. Click analyze video to calculate the athlete speed')}else{document.getElementById('startTest').disabled=false;speak('Calibration complete. Click start test when the athlete is ready')}}}
function startTest(){isRunning=true;document.getElementById('startTest').disabled=true;document.getElementById('calibrate').disabled=true;document.getElementById('reset').disabled=false;updateStatus('Position yourself at START line');positionCheckInterval=setInterval(checkRunnerPosition,1000);speak('Please move to the start line. I will guide you to the correct position');setTimeout(()=>speak('Stand with both feet behind the start line'),4000);setTimeout(()=>speak('Position your feet shoulder width apart'),8000);setTimeout(()=>speak('Keep your body upright. Face the direction you will run'),12000);setTimeout(()=>speak('Run parallel to the camera. Either left to right, or right to left'),16000);setTimeout(()=>speak('Place one foot slightly forward in a comfortable stance'),20000);setTimeout(()=>speak('Bend your knees slightly and lean forward'),24000);setTimeout(()=>{if(positionCheckInterval){clearInterval(positionCheckInterval);positionCheckInterval=null}speak('Get ready. The test will begin in 5 seconds');updateStatus('GET READY - Starting in 5 seconds')},28000);setTimeout(()=>{speak('3');updateStatus('3')},31000);setTimeout(()=>{speak('2');updateStatus('2')},32000);setTimeout(()=>{speak('1');updateStatus('1')},33000);setTimeout(()=>{speak('Go! Run as fast as you can to the finish line!');updateStatus('GO! RUN!');fetch('/start_test',{method:'POST',headers:{'Content-Type':'application/json'}});checkInterval=setInterval(checkTestStatus,100)},34000)}
function checkRunnerPosition(){fetch('/get_runner_position').then(r=>r.json()).then(d=>{if(d.detected){const now=Date.now();if(now-lastPositionInstruction>3000){if(d.position==='left'){speak('Move to your right to center yourself in the frame');lastPositionInstruction=now}else if(d.position==='right'){speak('Move to your left to center yourself in the frame');lastPositionInstruction=now}else if(d.position==='center'&&now-lastPositionInstruction>5000){speak('Good position. Stay there');lastPositionInstruction=now}}}else{const now=Date.now();if(now-lastPositionInstruction>4000){speak('Please stand in front of the camera so I can see you');lastPositionInstruction=now}}})}
function checkTestStatus(){fetch('/check_status').then(r=>r.json()).then(d=>{if(d.finished){clearInterval(checkInterval);displayResults(d)}})}
function displayResults(d){isRunning=false;document.getElementById('timeResult').textContent=d.time+' seconds';document.getElementById('speedResult').textContent=d.speed_kmh+' km/h ('+d.speed_mps+' m/s)';document.getElementById('distanceResult').textContent=d.distance+' meters';updateStatus('Test Complete!');speak('Test complete! Your time is '+d.time+' seconds. Your speed is '+d.speed_kmh.toFixed(1)+' kilometers per hour');document.getElementById('reset').disabled=false}
function resetTest(){isRunning=false;if(checkInterval){clearInterval(checkInterval);checkInterval=null}if(positionCheckInterval){clearInterval(positionCheckInterval);positionCheckInterval=null}fetch('/reset',{method:'POST',headers:{'Content-Type':'application/json'}});document.getElementById('timeResult').textContent='--';document.getElementById('speedResult').textContent='--';document.getElementById('distanceResult').textContent='--';document.getElementById('startTest').disabled=false;document.getElementById('calibrate').disabled=false;document.getElementById('reset').disabled=true;hideStatus();speak('Test reset. You can start a new test')}
function quitApplication(){if(confirm('Are you sure you want to quit?')){speak('Goodbye. Closing application');if(checkInterval)clearInterval(checkInterval);fetch('/quit',{method:'POST',headers:{'Content-Type':'application/json'}}).then(()=>{setTimeout(()=>{window.close();updateStatus('Application stopped. You can close this tab now')},1000)})}}
function switchToLiveMode(){document.getElementById('liveModeBtn').classList.add('active');document.getElementById('uploadModeBtn').classList.remove('active');document.getElementById('liveMode').style.display='block';document.getElementById('uploadMode').style.display='none';document.getElementById('videoFeed').style.display='block';document.getElementById('uploadedVideoFrame').style.display='none';ctx.clearRect(0,0,canvas.width,canvas.height);startLine=null;finishLine=null;calibrationStep=0}
function switchToUploadMode(){document.getElementById('uploadModeBtn').classList.add('active');document.getElementById('liveModeBtn').classList.remove('active');document.getElementById('uploadMode').style.display='block';document.getElementById('liveMode').style.display='none';document.getElementById('videoFeed').style.display='none';document.getElementById('uploadedVideoFrame').style.display='none';canvas.style.display='block';ctx.clearRect(0,0,canvas.width,canvas.height);startLine=null;finishLine=null;calibrationStep=0;document.getElementById('analyzeVideo').disabled=true;document.getElementById('calibrateUpload').disabled=true}
function uploadVideo(f){const fd=new FormData();fd.append('video',f);updateStatus('Uploading video...');speak('Uploading video. Please wait');fetch('/upload_video',{method:'POST',body:fd}).then(r=>r.json()).then(d=>{if(d.status==='success'){loadVideoFrame();setTimeout(()=>{hideStatus();document.getElementById('calibrateUpload').disabled=false;document.getElementById('resetUpload').disabled=false;speak('Video uploaded successfully. Now click calibrate to mark the start and finish points where the athlete begins and ends the run')},500)}else{updateStatus('Error uploading video: '+d.message);speak('Error uploading video')}})}
function loadVideoFrame(){fetch('/get_video_frame').then(r=>r.blob()).then(b=>{const url=URL.createObjectURL(b);const uploadedImg=document.getElementById('uploadedVideoFrame');uploadedImg.onload=()=>{uploadedImg.style.display='block';canvas.width=uploadedImg.naturalWidth;canvas.height=uploadedImg.naturalHeight;const rect=uploadedImg.getBoundingClientRect();canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';ctx.clearRect(0,0,canvas.width,canvas.height);drawCalibrationLines()};uploadedImg.src=url})}
function startUploadCalibration(){calibrationStep=0;startLine=null;finishLine=null;loadVideoFrame();setTimeout(()=>{updateStatus('Video paused. Click to mark START line (where athlete begins running)');speak('Video is paused at the first frame. Click on the video to mark the start line where the athlete begins running')},300)}
function analyzeVideo(){if(startLine===null||finishLine===null){speak('Please calibrate the start and finish lines first');updateStatus('Please calibrate first! Click Calibrate button');return}document.getElementById('analyzeVideo').disabled=true;document.getElementById('resetUpload').disabled=false;updateStatus('Analyzing video... Detecting athlete movement. This may take a moment');speak('Analyzing video. Detecting when the athlete crosses the start and finish lines. Please wait. This may take a minute');fetch('/analyze_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({start_line:startLine,finish_line:finishLine})}).then(r=>r.json()).then(d=>{if(d.status==='success'){displayResults(d);speak('Analysis complete! The athlete completed the 30 meter sprint in '+d.time+' seconds. Speed is '+d.speed_kmh.toFixed(1)+' kilometers per hour')}else{updateStatus('Error: '+d.message);speak('Error analyzing video. '+d.message);document.getElementById('analyzeVideo').disabled=false}})}
function resetUpload(){fetch('/reset_upload',{method:'POST'});document.getElementById('videoUpload').value='';document.getElementById('fileName').textContent='';document.getElementById('uploadedVideoFrame').style.display='none';document.getElementById('calibrateUpload').disabled=true;document.getElementById('analyzeVideo').disabled=true;document.getElementById('resetUpload').disabled=true;document.getElementById('timeResult').textContent='--';document.getElementById('speedResult').textContent='--';document.getElementById('distanceResult').textContent='--';ctx.clearRect(0,0,canvas.width,canvas.height);startLine=null;finishLine=null;calibrationStep=0;hideStatus();speak('Upload reset. You can select a new video')}
document.addEventListener('DOMContentLoaded',()=>{canvas=document.getElementById('canvas');ctx=canvas.getContext('2d');const videoFeed=document.getElementById('videoFeed');videoFeed.onload=()=>{canvas.width=videoFeed.naturalWidth||1280;canvas.height=videoFeed.naturalHeight||720;hideStatus();speak('Welcome to the 30 meter sprint speed test. Click calibrate to begin')};videoFeed.onerror=()=>{updateStatus('Error loading video feed. Please check camera connection');speak('Error loading video feed. Please check camera connection')};setTimeout(()=>{if(canvas.width===300){canvas.width=1280;canvas.height=720;hideStatus();speak('Welcome to the 30 meter sprint speed test. Click calibrate to begin')}},2000);document.getElementById('calibrate').addEventListener('click',startCalibration);document.getElementById('startTest').addEventListener('click',startTest);document.getElementById('reset').addEventListener('click',resetTest);document.getElementById('quit').addEventListener('click',quitApplication);canvas.addEventListener('click',handleCanvasClick);document.getElementById('liveModeBtn').addEventListener('click',switchToLiveMode);document.getElementById('uploadModeBtn').addEventListener('click',switchToUploadMode);document.getElementById('selectVideoBtn').addEventListener('click',()=>document.getElementById('videoUpload').click());document.getElementById('videoUpload').addEventListener('change',e=>{const f=e.target.files[0];if(f){document.getElementById('fileName').textContent='Selected: '+f.name;uploadVideo(f)}});document.getElementById('calibrateUpload').addEventListener('click',startUploadCalibration);document.getElementById('analyzeVideo').addEventListener('click',analyzeVideo);document.getElementById('resetUpload').addEventListener('click',resetUpload)});
setInterval(()=>{if(calibrationStep>=1&&!isRunning)drawCalibrationLines()},100);
</script>
</body></html>
'''

if __name__ == '__main__':
    try:
        print("\n" + "="*50)
        print("30 METER SPRINT SPEED CALCULATOR")
        print("="*50)
        print("\nStarting server...")
        print("\n📹 Open your browser and go to:")
        print("   http://localhost:5000")
        print("\n" + "="*50 + "\n")
        app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
    finally:
        if camera is not None:
            camera.release()
        if uploaded_video_cap is not None:
            uploaded_video_cap.release()
        cv2.destroyAllWindows()
