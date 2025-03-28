# Facial Recognition for Criminal and Missing Person Detection  

![Project Banner](https://via.placeholder.com/800x300?text=Facial+Recognition+for+Public+Safety)  

A real-time facial recognition system designed to detect criminals and missing persons from CCTV feeds and alert law enforcement via a dashboard for immediate action.  

## Features  
✔ **Real-time Detection** – Works with live CCTV feeds or webcam.  
✔ **Automated Alerts** – Notifies police via dashboard when a match is found.  
✔ **Dynamic Database** – Add new faces (criminals/missing persons) via an upload portal.  
✔ **User-Friendly Interface** – Built with Streamlit for easy interaction.  

## How It Works  
1. **Capture & Compare**: The system scans live video frames and compares detected faces against a database.  
2. **Match Found?**: If a criminal/missing person is identified, an alert is sent to the police dashboard.  
3. **Add New Data**: Authorities can upload new photos (with names) to expand the database.  

---

## 🚀 Installation & Setup  

### Prerequisites  
- Python 3.8+  
- OpenCV, Streamlit, Face Recognition libraries  

### Steps  
1. **Clone the repository**:  
   ```bash  
   git clone https://github.com/yourusername/Facial_Recognition-Criminal-Missing-Person-Detection.git  
   ```  

2. **Install dependencies**:  
   ```bash  
   pip install -r requirements.txt  
   ```  

3. **Run the application**:  
   ```bash  
   cd Facial_Recognition(Criminal+Missing_Person_Detection)  
   streamlit run app.py  
   ```  

4. **Access the web interface**:  
   - Open `http://localhost:5001` in your browser.  
   - Use `/upload` to add new faces to the database.  

### Switching to Webcam  
Modify `app.py`:  
```python  
cv2.VideoCapture(0)  # Change index if using external webcam  
```  

---

## 📂 Adding New Faces  
1. Go to `http://localhost:5001/upload`.  
2. Upload a clear photo of the person along with their name.  
3. The system will now detect this person in future scans.  

---

## 🛠️ Customization  
- **Adjust Confidence Threshold**: Modify the similarity threshold in the code.  
- **Integrate APIs**: Connect to police databases or emergency alert systems.  

---

## 📜 License  
This project is licensed under the **MIT License**.  

---

## 🙌 Contribute  
Found a bug? Want a new feature? Open an **issue** or submit a **PR**!  

---
-Tech
**👮♂️ Making communities safer, one face at a time.**  
*For queries, contact: [arbukhan1971@gmail.com]*  

---  

[![forthebadge](https://forthebadge.com/images/badges/built-with-science.svg)](https://github.com/Arbaaz-Khan-Tech)  

---  

💡 **Tip**: For better accuracy, ensure the reference images are high-resolution and well-lit.  

---  

Replace placeholder links (e.g., GitHub repo, banner image) with your actual project details. Let me know if you’d like any modifications! 🚀