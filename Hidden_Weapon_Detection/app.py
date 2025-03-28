import streamlit as st
from ultralytics import YOLO
import cv2
from PIL import Image
import numpy as np
import tempfile
import os

# Set page configuration
st.set_page_config(
    page_title="Thermal Pistol Detection",
    page_icon="🔫",
    layout="wide"
)

# Title and description
st.title("Thermal Pistol Detection using YOLOv8")
st.markdown("""
    Upload an image/video or use webcam to detect thermal pistols in real-time.
    **Note:** Model trained on thermal imaging data.
""")

# Sidebar controls
st.sidebar.header("Controls")
confidence_threshold = st.sidebar.slider("Confidence Threshold", 0.0, 1.0, 0.5, 0.01)
class_names = st.sidebar.multiselect("Select Classes", ["pistol"], default=["pistol"])
class_filter = [0]  # Update based on your model's class IDs

# Load model with caching
@st.cache_resource
def load_model():
    return YOLO("best.pt")  # Ensure correct model path

model = load_model()

# Session state for webcam control
if 'camera_active' not in st.session_state:
    st.session_state.camera_active = False

# File uploader
uploaded_file = st.file_uploader("Choose media", type=["jpg", "jpeg", "png", "mp4", "mov"])
def process_image(image):
    """Process and annotate single image"""
    # Convert RGBA to RGB if needed
    if image.shape[-1] == 4:  # Check if image has 4 channels
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
    
    # Ensure 3-channel format
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)  # Convert PIL RGB to OpenCV BGR
    results = model(image, conf=confidence_threshold, classes=class_filter)
    plotted = results[0].plot(line_width=2, font_size=10)
    return plotted, results[0].boxes

# In the main image processing block:
if uploaded_file.type.startswith('image'):
    # Read and convert image properly
    image = Image.open(uploaded_file).convert('RGB')  # Force RGB conversion
    image_np = np.array(image)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.image(image_np, caption="Original Image", use_column_width=True, channels="RGB")
        
    with st.spinner("Detecting..."):
        plotted, boxes = process_image(image_np)
        
    with col2:
        st.image(plotted, caption="Processed Image", use_column_width=True, channels="BGR")


        
def process_video(video_path):
    """Process video and create annotated version"""
    cap = cv2.VideoCapture(video_path)
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    out = cv2.VideoWriter(temp_file.name, cv2.VideoWriter_fourcc(*'mp4v'), fps, (frame_width, frame_height))
    
    progress_bar = st.progress(0)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    processed_frames = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        results = model(frame, conf=confidence_threshold, classes=class_filter)
        plotted = results[0].plot()
        out.write(plotted)
        
        processed_frames += 1
        progress_bar.progress(processed_frames / total_frames)
    
    cap.release()
    out.release()
    progress_bar.empty()
    return temp_file.name

# Webcam handling
def webcam_handler():
    """Handle webcam input and processing"""
    if st.session_state.camera_active:
        st.session_state.cap = cv2.VideoCapture(0)
        st.session_state.frame_window = st.empty()
        
        while st.session_state.camera_active:
            ret, frame = st.session_state.cap.read()
            if not ret:
                st.error("Webcam Error")
                break
                
            results = model(frame, conf=confidence_threshold)
            plotted = results[0].plot()
            st.session_state.frame_window.image(plotted, channels="BGR")
            
        if 'cap' in st.session_state:
            st.session_state.cap.release()
            del st.session_state.cap

# Main processing logic
if uploaded_file is not None:
    if uploaded_file.type.startswith('image'):
        # Image processing
        image = Image.open(uploaded_file).convert('RGB')
        col1, col2 = st.columns(2)
        
        with col1:
            st.image(image, caption="Original Image", use_column_width=True)
            
        with st.spinner("Detecting..."):
            plotted, boxes = process_image(np.array(image))
            
        with col2:
            st.image(plotted, caption="Processed Image", use_column_width=True)
            
        if boxes:
            st.subheader("Detection Details")
            for box in boxes:
                st.write(f"Confidence: {box.conf[0]:.2f}, BBox: {box.xyxy[0].tolist()}")

    elif uploaded_file.type.startswith('video'):
        # Video processing
        tfile = tempfile.NamedTemporaryFile(delete=False)
        tfile.write(uploaded_file.read())
        
        st.video(tfile.name)
        output_path = process_video(tfile.name)
        st.video(output_path)
        
        with open(output_path, 'rb') as f:
            st.download_button("Download Processed Video", f, "processed_video.mp4")
            
        os.unlink(tfile.name)
        os.unlink(output_path)

else:
    # Webcam interface
    st.sidebar.header("Live Webcam")
    if st.sidebar.button("Start Webcam" if not st.session_state.camera_active else "Stop Webcam"):
        st.session_state.camera_active = not st.session_state.camera_active
        webcam_handler()

    st.info("Please upload media or enable webcam to begin detection")

# Instructions sidebar
st.sidebar.header("Instructions")
st.sidebar.markdown("""
1. Upload image/video or enable webcam
2. Adjust confidence threshold as needed
3. View detection results in main panel
4. Download processed files when available
""")