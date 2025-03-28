import cv2
import tensorflow as tf
print("TensorFlow version:", tf.__version__)
import numpy as np
from deepface import DeepFace

# Download the Facenet model
DeepFace.build_model("Facenet")

# Load offender database (precomputed embeddings)
offender_db = {
    "person1": np.load("person1_embedding.npy"),
    "pranu_rane": np.load("ranu.npy"),
}

# Initialize face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Replace with your HTTP camera URL
# camera_url = "http://192.168.137.227:4747/video"  # Replace with the URL shown in the app
cap = cv2.VideoCapture(0)  # Use 0 for webcam or replace with camera URL

if not cap.isOpened():
    print("Error: Could not open camera stream.")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        print("Error: Failed to grab frame.")
        break

    # Detect faces
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    for (x, y, w, h) in faces:
        face = frame[y:y+h, x:x+w]
        # Generate embedding for the detected face
        try:
            embedding = DeepFace.represent(face, model_name="Facenet")[0]["embedding"]
        except:
            continue  # Skip if no face is detected or embedding fails

        # Compare with offender database
        for name, offender_embedding in offender_db.items():
            similarity = np.dot(embedding, offender_embedding) / (np.linalg.norm(embedding) * np.linalg.norm(offender_embedding))
            print(f"Similarity with {name}: {similarity}")
            if similarity > 0.7:  # Adjust threshold (e.g., 0.8 for 80% similarity)
                print(f"ALERT: Match found - {name}")

    # Display the frame
    cv2.imshow("CCTV Feed", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
q