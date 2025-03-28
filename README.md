# **SurakshaSetu - AI-Powered Public Safety System**  
### **Bridging the Gap Between Citizens and Police with Real-Time Threat Detection**  

![SurakshaSetu Banner](https://via.placeholder.com/1200x400?text=SurakshaSetu+-+AI+for+Public+Safety)  

## **🚀 Overview**  
**SurakshaSetu** is an **autonomous surveillance system** that fuses data from multiple sensors (CCTV, LIDAR, buried optical fiber, UGS) with **AI-powered analytics** to detect threats (violence, weapons, criminals) in real-time. It provides:  
- **👮 Police Dashboard**: AI-monitored CCTV, crime heatmaps, SOS alerts, and facial recognition.  
- **👥 Citizen App**: Real-time crime alerts, emergency SOS, and community reporting.  
- **🤖 AI Detection Modules**:  
  - **Facial Recognition** (Criminals/Missing Persons)  
  - **Hidden Weapon Detection** (Infrared + ML)  
  - **UGS & LIDAR Intrusion Detection**  

📹 **Demo Video:** [Watch Here](https://drive.google.com/file/d/1T77e_ZAXrupJhO2dTGwlxG-A8mNdjK5B/view?usp=sharing)  
📂 **Documentation & PPT:** [View on Canva](https://www.canva.com/design/DAGcJ-MxZ9Q/Cs8OkeK9EVkfnYHU87Dd6w/edit)  
💻 **GitHub Repo:** [https://github.com/Arbaaz-Khan-Tech/HackVerse_2025_Suraksha_Setu.git](https://github.com/Arbaaz-Khan-Tech/HackVerse_2025_Suraksha_Setu.git)  

---

## **⚡ Unique Selling Proposition (USP)**  
✅ **AI-Powered Threat Detection** (YOLOv8 for weapons/violence)  
✅ **Real-Time Criminal Recognition** (Facial matching with police database)  
✅ **Infrared Weapon Detection** (Hidden guns/knives in restricted zones)  
✅ **UGS Vibration Sensing** (Optical fiber detects footsteps in secure areas)  
✅ **Two-Way Alert System** (Police ↔ Citizen notifications via SMS/WhatsApp)  
✅ **Crime Heatmaps & Predictive Policing**  

---

## **🛠️ System Architecture**  
![System Architecture Diagram](https://via.placeholder.com/800x400?text=SurakshaSetu+System+Flow)  

### **👮 Police Dashboard (Web-Based)**  
- Live CCTV AI Monitoring  
- Crime Heatmaps & SOS Triangulation  
- Facial Recognition for Criminals/Missing Persons  
- Incident Verification & Broadcast  

### **👥 Citizen Safety App (Expo React Native)**  
- Real-Time Threat Alerts (Even when app is closed)  
- One-Tap SOS with Location Sharing  
- Incident Reporting with Evidence  
- Safe Walk Feature (Live location tracking)  

---

## **⚙️ Installation & Setup**  

### **Prerequisites**  
- Python 3.8+  
- MongoDB Atlas/Compass  
- Twilio Account (for SMS alerts)  
- **NVIDIA GPU Recommended** (For YOLO models)  

### **1. Clone Repository**  
```bash  
git clone https://github.com/Arbaaz-Khan-Tech/HackVerse_2025_Suraksha_Setu.git  
cd HackVerse_2025_Suraksha_Setu  
```  

### **2. Install Dependencies**  
```bash  
pip install -r requirements.txt  
```  

### **3. Configure `config.json`**  
```json  
{
    "phone_number": "+91XXXXXXXXXX",  // Your Twilio-registered number  
    "mongodb_uri": "YOUR_MONGODB_URI"  
}  
```  

---

## **🚀 How to Run**  

### **1. Police Dashboard (Flask Backend)**  
```bash  
cd backend  
python app.py  
```  
Access at: `http://localhost:5000`  

### **2. Facial Recognition (Criminal/Missing Person Detection)**  
```bash  
cd F:\HackVerse\Facial_Recognition(Criminal+Missing_Person_Detection)  
python app.py  
```  

### **3. Hidden Weapon Detection (Streamlit)**  
```bash  
cd F:\HackVerse\Hidden_Weapon_Detection  
streamlit run app.py  
```  

### **4. Citizen App (Expo React Native)**  
```bash  
cd citizen  
npm install  
expo start  
```  
Scan QR code in **Expo Go App** (Android/iOS).  

---

## **🌟 Benefits**  

### **👮 For Police:**  
✔ **Faster Response Times** – AI detects threats before manual reporting.  
✔ **Automated Alerts** – Real-time weapon/criminal detection.  
✔ **Crime Prediction** – Heatmaps identify high-risk zones.  

### **👥 For Citizens:**  
✔ **Instant SOS Alerts** – Police notified with live location.  
✔ **Community Awareness** – Real-time crime notifications.  
✔ **Safe Walk Feature** – Share live location with trusted contacts.  

---

## **📜 License**  
**MIT License** - Free for non-commercial & research use.  

---

## **🚀 Future Roadmap**  
📲 **WhatsApp/SMS Alert Escalation**  
🔍 **Predictive Crime Mapping**  
📱 **Mobile App for Field Officers**  

---

**🤝 Contribute**  
Found a bug? Want to improve AI accuracy? **Open an issue or PR!**  
 

[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/Arbaaz-Khan-Tech/HackVerse_2025_Suraksha_Setu)  

---  
**"Empowering safer communities through AI-driven vigilance."** 🚨
