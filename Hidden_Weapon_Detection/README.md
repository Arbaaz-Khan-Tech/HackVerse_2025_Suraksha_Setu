# **Hidden Weapon Detection System**  

### **🚀 Overview**  
This project uses **infrared sensors and machine learning** to detect concealed weapons (guns, knives, etc.) in real-time. The system analyzes infrared scans to identify potential threats and alerts security personnel via a dashboard.  

### **✨ Features**  
✔ **Infrared-Based Detection** – Uses thermal imaging to identify hidden weapons.  
✔ **ML-Powered Recognition** – Trained model to classify guns, knives, and other threats.  
✔ **Real-Time Alerts** – Sends notifications when a weapon is detected.  
✔ **User-Friendly Dashboard** – Built with **Streamlit** for easy monitoring.  

---

## **🛠 Installation & Setup**  

### **Prerequisites**  
- Python 3.8+  
- OpenCV (`cv2`)  
- TensorFlow/PyTorch (for ML model)  
- Streamlit (for dashboard)  

### **1. Clone the Repository**  
```bash  
cd hidden-weapon-detection  
```  

### **2. Install Dependencies**  
```bash  
pip install -r requirements.txt  
```  

### **3. Run the Application**  
```bash  
streamlit run app.py  
```  
- The dashboard will open at **`http://localhost:8501`**  

---

## **🔫 How It Works**  
1. **Infrared Scanning**  
   - Uses thermal imaging to detect concealed metallic objects.  
2. **ML Model Prediction**  
   - A pre-trained model analyzes the scan to classify weapons.  
3. **Alert Generation**  
   - If a weapon is detected, an alert is sent to the dashboard.  

---

## **📂 Adding Custom Data**  
To improve detection, you can:  
1. **Add new weapon images** to the `training_data` folder.  
2. **Retrain the model** (optional):  
   ```bash  
   python train_model.py  
   ```  

---

## **⚙️ Customization**  
- **Change detection sensitivity** in `config.py`.  
- **Integrate with CCTV feeds** by modifying `app.py`.  
- **Enable email/SMS alerts** by adding API integrations.  

---

## **📜 License**  
MIT License - Free for non-commercial and research use.  

---

## **🤝 Contribute**  
Found a bug? Want to improve accuracy?  
- **Open an issue**  
- **Submit a pull request**  

---

**🚨 Making public spaces safer with AI-powered threat detection.**  
📧 **Contact:** [your.email@example.com]  

[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/Arbaaz-Kham-Tech/)  

--- 

**Note:** Ensure compliance with local laws regarding surveillance and weapon detection.