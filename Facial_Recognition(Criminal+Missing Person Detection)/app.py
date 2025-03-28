from flask import Flask, render_template, Response, jsonify, request, redirect
import cv2
import numpy as np
from deepface import DeepFace
import tensorflow as tf
import threading
import time
import logging
import os
from werkzeug.utils import secure_filename

print("TensorFlow version:", tf.__version__)

app = Flask(__name__)
app.logger.setLevel(logging.ERROR)

# Configuration
UPLOAD_FOLDER = 'uploads'
EMBEDDINGS_FOLDER = 'embeddings'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['EMBEDDINGS_FOLDER'] = EMBEDDINGS_FOLDER

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EMBEDDINGS_FOLDER, exist_ok=True)

# Initialize face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Global variables
current_alert = None
last_frame = None
lock = threading.Lock()

# Function to load all embeddings from the 'embeddings' folder
def load_offender_db():
    offender_db = {}
    for filename in os.listdir(EMBEDDINGS_FOLDER):
        if filename.endswith('_embedding.npy'):
            name = filename.split('_')[0]
            embedding = np.load(os.path.join(EMBEDDINGS_FOLDER, filename))
            offender_db[name] = embedding
    return offender_db

# Load offender database from embeddings folder
offender_db = load_offender_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def video_processing():
    global current_alert, last_frame
    cap = cv2.VideoCapture("arbbaaz.mp4")  # Use 0 for webcam or camera URL
    
    while True:
        success, frame = cap.read()
        if not success:
            break
        else:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)

            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
                face = frame[y:y+h, x:x+w]
                
                try:
                    embedding = DeepFace.represent(face, model_name="Facenet")[0]["embedding"]
                except:
                    continue

                # Compare the new embedding with the offenders' embeddings
                for name, offender_embedding in offender_db.items():
                    similarity = np.dot(embedding, offender_embedding) / (
                        np.linalg.norm(embedding) * np.linalg.norm(offender_embedding))
                    print(f"Similarity with {name}: {similarity}")
                    if similarity > 0.7:
                        with lock:
                            current_alert = f"ALERT: {name} detected!"
                            print(f"ALERT: Match found - {name}")
            
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            last_frame = frame

    cap.release()

def generate_frames():
    while True:
        if last_frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + last_frame + b'\r\n')
        else:
            time.sleep(0.1)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_alert')
def get_alert():
    global current_alert
    with lock:
        alert = current_alert
        current_alert = None  # Clear alert after sending
    return jsonify(alert=alert)

@app.route('/upload')
def upload_form():
    return render_template('uploads_photo.html')  # New page for photo upload

@app.route('/upload_photo', methods=['POST'])
def upload_file():
    if 'file' not in request.files or 'name' not in request.form:
        return render_template('upload_photos.html', error="No file or name provided.")
    
    file = request.files['file']
    name = request.form['name'].strip()
    
    if name == '':
        return render_template('upload_photos.html', error="Please enter a name.")
    
    if file.filename == '':
        return render_template('upload_photos.html', error="No selected file.")
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Generate embedding using DeepFace
            embedding = DeepFace.represent(img_path=filepath, model_name='Facenet')[0]["embedding"]
        except:
            return render_template('upload_photos.html', error="No face detected or error processing image.")
        
        # Convert to numpy array and save
        embedding_file_path = os.path.join(app.config['EMBEDDINGS_FOLDER'], f"{name}_embedding.npy")
        np.save(embedding_file_path, np.array(embedding))
        
        # Reload the offender database after adding the new embedding
        global offender_db
        offender_db = load_offender_db()
        
        return render_template('upload_photos.html', success=f'Embedding for {name} generated and saved successfully!')
    
    return render_template('upload_photos.html', error='Invalid file type.')


if __name__ == '__main__':
    processing_thread = threading.Thread(target=video_processing)
    processing_thread.daemon = True
    processing_thread.start()
    app.run(host='0.0.0.0', port=5001, threaded=True)
