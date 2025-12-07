from flask import Flask, Response, jsonify, request, render_template
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
    return render_template('index.html')

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

@app.route('/upload_video', methods=['POST'])
def upload_video():
    global uploaded_video_path, uploaded_video_cap
    try:
        if 'video' not in request.files:
            return jsonify({'status': 'error', 'message': 'No video file provided'})
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'})
        
        upload_folder = 'uploads'
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        file_ext = os.path.splitext(video_file.filename)[1]
        uploaded_video_path = os.path.join(upload_folder, f'uploaded_video{file_ext}')
        video_file.save(uploaded_video_path)
        
        if uploaded_video_cap is not None:
            uploaded_video_cap.release()
        
        uploaded_video_cap = cv2.VideoCapture(uploaded_video_path)
        
        if not uploaded_video_cap.isOpened():
            return jsonify({'status': 'error', 'message': 'Could not open video file'})
        
        frame_count = int(uploaded_video_cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = uploaded_video_cap.get(cv2.CAP_PROP_FPS)
        width = int(uploaded_video_cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(uploaded_video_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        return jsonify({
            'status': 'success',
            'message': 'Video uploaded successfully',
            'info': {'width': width, 'height': height, 'fps': fps, 'frames': frame_count}
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Upload failed: {str(e)}'})

@app.route('/get_video_frame', methods=['GET'])
def get_video_frame():
    global uploaded_video_cap
    try:
        if uploaded_video_cap is None:
            return jsonify({'status': 'error', 'message': 'No video loaded'})
        
        uploaded_video_cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        success, frame = uploaded_video_cap.read()
        
        if not success:
            return jsonify({'status': 'error', 'message': 'Could not read frame'})
        
        ret, buffer = cv2.imencode('.jpg', frame)
        return Response(buffer.tobytes(), mimetype='image/jpeg')
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Error: {str(e)}'})

@app.route('/get_video_path', methods=['GET'])
def get_video_path():
    global uploaded_video_path
    if uploaded_video_path and os.path.exists(uploaded_video_path):
        return jsonify({'status': 'success', 'path': '/' + uploaded_video_path.replace('\\', '/')})
    return jsonify({'status': 'error', 'message': 'No video loaded'})

@app.route('/uploads/<path:filename>')
def serve_video(filename):
    from flask import send_from_directory
    return send_from_directory('uploads', filename)

@app.route('/analyze_video', methods=['POST'])
def analyze_video():
    global uploaded_video_cap, start_line, finish_line
    try:
        if uploaded_video_cap is None:
            return jsonify({'status': 'error', 'message': 'No video loaded'})
        
        data = request.json
        start_line = int(data['start_line'])
        finish_line = int(data['finish_line'])
        
        uploaded_video_cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        fps = uploaded_video_cap.get(cv2.CAP_PROP_FPS)
        
        runner_start_frame = None
        runner_finish_frame = None
        frame_count = 0
        frame_skip = 3  # Process every 3rd frame for speed
        
        while True:
            success, frame = uploaded_video_cap.read()
            if not success:
                break
            
            frame_count += 1
            if frame_count % frame_skip != 0:
                continue
            
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
                            
                            elif runner_finish_frame is None:
                                crossed = (start_line < finish_line and hip_x >= finish_line) or \
                                         (start_line > finish_line and hip_x <= finish_line)
                                
                                if crossed:
                                    runner_finish_frame = frame_count
                                    break
        
        if runner_start_frame is None:
            return jsonify({'status': 'error', 'message': 'Could not detect runner at START line'})
        
        if runner_finish_frame is None:
            return jsonify({'status': 'error', 'message': 'Runner did not cross FINISH line'})
        
        elapsed_time = (runner_finish_frame - runner_start_frame) / fps
        speed_mps = 30 / elapsed_time
        speed_kmh = speed_mps * 3.6
        
        return jsonify({
            'status': 'success',
            'finished': True,
            'time': round(elapsed_time, 2),
            'speed_mps': round(speed_mps, 2),
            'speed_kmh': round(speed_kmh, 2),
            'distance': 30
        })
    
    except Exception as e:
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

if __name__ == '__main__':
    try:
        print("\n" + "="*50)
        print("30 METER SPRINT SPEED CALCULATOR")
        print("="*50)
        print("\nStarting server...")
        print("\n📹 Open your browser: http://localhost:5000")
        print("\n" + "="*50 + "\n")
        app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
    finally:
        if camera is not None:
            camera.release()
        if uploaded_video_cap is not None:
            uploaded_video_cap.release()
        cv2.destroyAllWindows()
