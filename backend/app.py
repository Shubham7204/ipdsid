from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import mss
import base64
import time
import threading
from datetime import datetime
import os
from PIL import Image
from io import BytesIO

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Global variables to control capture
capture_thread = None
is_capturing = False
captured_frames = []

def capture_screen():
    global is_capturing, captured_frames
    
    # Create frames directory if it doesn't exist
    output_folder = 'frames'
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    with mss.mss() as sct:
        # Get the first monitor
        monitor = sct.monitors[1]
        
        while is_capturing:
            try:
                # Capture screenshot
                screenshot = sct.grab(monitor)
                
                # Convert to PIL Image
                img = Image.frombytes('RGB', screenshot.size, screenshot.rgb)
                
                # Save frame
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                frame_path = f"frames/frame_{timestamp}.png"
                img.save(frame_path)
                
                # Convert to base64 for frontend
                buffer = BytesIO()
                img.save(buffer, format='PNG')
                base64_frame = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                # Store frame data
                frame_data = {
                    'timestamp': timestamp,
                    'path': frame_path,
                    'image': base64_frame
                }
                
                captured_frames.append(frame_data)
                
                # Keep only last 50 frames
                if len(captured_frames) > 50:
                    # Remove old file
                    old_frame = captured_frames.pop(0)
                    try:
                        os.remove(old_frame['path'])
                    except:
                        pass
                
                time.sleep(2)  # Capture every 10 seconds
                
            except Exception as e:
                print(f"Error capturing screen: {e}")
                break

@app.route('/api/capture/start', methods=['POST'])
def start_capture():
    global capture_thread, is_capturing
    
    if not is_capturing:
        is_capturing = True
        capture_thread = threading.Thread(target=capture_screen)
        capture_thread.start()
        return jsonify({
            'status': 'success',
            'message': 'Screen capture started'
        })
    
    return jsonify({
        'status': 'error',
        'message': 'Capture already in progress'
    })

@app.route('/api/capture/stop', methods=['POST'])
def stop_capture():
    global is_capturing, capture_thread
    
    if is_capturing:
        is_capturing = False
        if capture_thread:
            capture_thread.join()
        
        return jsonify({
            'status': 'success',
            'message': 'Screen capture stopped'
        })
    
    return jsonify({
        'status': 'error',
        'message': 'No capture in progress'
    })

@app.route('/api/capture/status', methods=['GET'])
def get_capture_status():
    return jsonify({
        'is_capturing': is_capturing,
        'frames_count': len(captured_frames)
    })

@app.route('/api/frames/recent', methods=['GET'])
def get_recent_frames():
    # Return the most recent frames (last 6)
    return jsonify({
        'frames': captured_frames[-6:] if captured_frames else []
    })

@app.route('/api/frames/all', methods=['GET'])
def get_all_frames():
    # Get all PNG files from the frames directory
    frames_dir = 'frames'
    frames_data = []
    
    if os.path.exists(frames_dir):
        for filename in os.listdir(frames_dir):
            if filename.endswith('.png'):
                filepath = os.path.join(frames_dir, filename)
                try:
                    # Read the image and convert to base64
                    with open(filepath, 'rb') as img_file:
                        img_data = base64.b64encode(img_file.read()).decode('utf-8')
                        
                    # Extract timestamp from filename (frame_YYYYMMDD_HHMMSS.png)
                    timestamp = filename.replace('frame_', '').replace('.png', '')
                    
                    frames_data.append({
                        'timestamp': timestamp,
                        'image': img_data,
                        'path': filepath
                    })
                except Exception as e:
                    print(f"Error processing {filename}: {e}")
    
    # Sort frames by timestamp, newest first
    frames_data.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({
        'frames': frames_data
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 