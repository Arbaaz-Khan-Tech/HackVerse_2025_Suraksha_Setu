import cv2
import torch
import numpy as np

def process_video(video_path, model):
    # Open the video file
    cap = cv2.VideoCapture(video_path)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Convert the frame to grayscale
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Prepare the frame for the model (make sure the frame dimensions are correct)
        input_tensor = torch.from_numpy(gray_frame).unsqueeze(0).unsqueeze(0).float()  # Shape: (1, 1, H, W)

        # Perform inference (assumes your model outputs bounding boxes)
        with torch.no_grad():
            predictions = model(input_tensor)  # Perform inference on the grayscale frame

        # Assuming predictions are in format (x1, y1, x2, y2) bounding boxes
        for box in predictions:
            x1, y1, x2, y2 = box
            cv2.rectangle(gray_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)

        # Convert grayscale frame back to BGR for visualization
        bgr_frame = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2BGR)

        # Encode frame to JPEG
        ret, jpeg = cv2.imencode('.jpg', bgr_frame)
        if not ret:
            break

        # Yield the JPEG image as a byte stream (for streaming to browser)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')

    cap.release()
