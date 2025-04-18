from flask import Flask, Response, render_template, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
import cv2
from ultralytics import YOLO
import threading
from flask import Flask, jsonify, request
from pymongo import MongoClient
import json
import os
from bson import ObjectId
from utils.json_encoder import CustomJSONEncoder
from bson.json_util import dumps, loads

import uuid
from PIL import Image  # For image processing
from werkzeug.utils import secure_filename  # For secure filenames
import logging
from flask_socketio import SocketIO
import pywhatkit as kit

import datetime

import json
from flask_cors import CORS

import socket

# Add this function at the top level
def serialize_datetime(obj):
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

# Load data from JSON file
with open('config.json', 'r') as file:
    config = json.load(file)

# Access the phone number
phone_number = config.get('phone_number')

# Set up template directory and Flask app
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'templates'))
app = Flask(__name__, template_folder=template_dir)
app.json_encoder = CustomJSONEncoder
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "allow_headers": "*",
        "expose_headers": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "supports_credentials": True
    }
})

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    ping_timeout=60000,
    ping_interval=25000,
    always_connect=True,
    logger=True,
    engineio_logger=True,
    manage_session=False  # Add this
)

# Set the logging level to ERROR
app.logger.setLevel(logging.ERROR)

# Load models
violence_model = YOLO("viodec_mk1.pt")
arms_model = YOLO("arms_detect.pt")

violence_classes = ["Violence ","knife","guns","NonViolence"]    
arms_classes = ["Gun", "Knife", "Pistol", "Handgun", "Rifle"]

# Global variable to store detected objects
detected_objects = []

# Function to run inference on a frame
def detect_objects(frame):
    global detected_objects
    violence_results = violence_model(frame)
    arms_results = arms_model(frame)

    detected_objects.clear()  # Clear previous detections

    # Check for violence
    for result in violence_results:
        for box in result.boxes:
            class_id = int(box.cls)
            if violence_classes[class_id] == "Violence":
                detected_objects.append("Violence")

    # Check for arms
    for result in arms_results:
        for box in result.boxes:
            class_id = int(box.cls)
            if arms_classes[class_id] in arms_classes:
                detected_objects.append(arms_classes[class_id])

    return detected_objects

# Function to generate frames from webcam
def generate_frames():
    global detected_objects
    # camera_url = "https://192.168.137.220:4343/video"  # Replace with the URL shown in the app
    cap = cv2.VideoCapture(0) 
    while True:
        success, frame = cap.read()
        if not success:
            break
        else:
            detected_objects = detect_objects(frame)
            if detected_objects:
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"Detected: {detected_objects} at {timestamp}")
                # Save frame with timestamp
                cv2.imwrite(f"detected_{timestamp}.jpg", frame)

            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detections')
def detections():
    global detected_objects
    return jsonify({"detected_objects": detected_objects})

# Create a connection to MongoDB
mongo_con = "mongodb://localhost:27017"
client = MongoClient(mongo_con)
db = client["SurakshaSetu"]

alerts_collection = db["Alerts_Citizen"]  # For citizen-submitted reports jaha verify ke baad incident me jayega
incidents_collection = db["Incidents"]  # For police-submitted reports
Alert_Collection = db["Alerts"]
markers_collection = db["Markers"]
heatmap_collection = db["Heatmap"]

# Citizen API Routes (React Native)
@app.route('/api/citizen/rewards', methods=['GET'])
def citizen_community_engagement():
    return jsonify({"message": "Rewards data"})

@app.route('/api/citizen/geofencing', methods=['GET', 'POST'])
def citizen_geofencing():
    if request.method == 'POST':
        try:
            geofence_data = request.json
            # Add validation
            required_fields = ['name', 'radius', 'coordinate']
            if not all(field in geofence_data for field in required_fields):
                return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400

            # Convert coordinate values to float
            geofence_data['coordinate'] = {
                'latitude': float(geofence_data['coordinate']['latitude']),
                'longitude': float(geofence_data['coordinate']['longitude'])
            }
            
            result = db.geofences.insert_one(geofence_data)
            return jsonify({
                'status': 'success',
                'geofence': {
                    '_id': str(result.inserted_id),
                    'name': geofence_data['name'],
                    'radius': geofence_data['radius'],
                    'coordinate': geofence_data['coordinate']
                }
            })
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

    # GET request
    try:
        geofences = list(db.geofences.find({}))
        # Convert ObjectId and clean data
        for geofence in geofences:
            geofence['_id'] = str(geofence['_id'])
            geofence['coordinate'] = {
                'latitude': float(geofence['coordinate']['latitude']),
                'longitude': float(geofence['coordinate']['longitude'])
            }
        return jsonify({'status': 'success', 'geofences': geofences})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/citizen/alerts', methods=['GET'])
def citizen_alerts():
    try:
        alerts = list(Alert_Collection.find().sort('_id', -1))
        for alert in alerts:
            alert['_id'] = str(alert['_id'])  # Convert ObjectId to string
        return jsonify({'status': 'success', 'alerts': alerts})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/citizen/incident-alerts', methods=['GET'])
def citizen_incident_alerts():
    incidents = list(incidents_collection.find().sort("created_at", -1))
    for incident in incidents:
        incident["_id"] = str(incident["_id"])
    return jsonify({"status": "success", "incidents": incidents})

@app.route('/api/citizen/incident-report', methods=['POST'])
def citizen_incident_report():
    try:
        # Create evidence directory if it doesn't exist
        evidence_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads', 'evidence')
        os.makedirs(evidence_dir, exist_ok=True)

        # Handle file upload 
        evidence_file = request.files.get('evidence')
        evidence_path = None
        
        if evidence_file and evidence_file.filename:
            # Generate secure filename
            filename = secure_filename(f"evidence_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg")
            filepath = os.path.join(evidence_dir, filename)
            evidence_file.save(filepath)
            evidence_path = f"/static/uploads/evidence/{filename}"

            # Create thumbnail
            try:
                from PIL import Image
                img = Image.open(filepath)
                img.thumbnail((300, 300))
                thumb_path = os.path.join(evidence_dir, f"thumb_{filename}")
                img.save(thumb_path)
            except Exception as e:
                app.logger.error(f"Error creating thumbnail: {str(e)}")

        # Prepare geo data
        geo_data = None
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        timestamp = request.form.get('timestamp')
        
        if latitude and longitude:
            geo_data = {
                'latitude': float(latitude),
                'longitude': float(longitude),
                'timestamp': timestamp or datetime.datetime.utcnow().isoformat()
            }

        # Create alert document
        alert_data = {
            'alert_id': str(uuid.uuid4()),
            'incident_type': request.form.get('incidentType'),
            'date_time': request.form.get('dateTime'),  # Already string from form
            'location': request.form.get('location'),
            'reporting_citizen': request.form.get('reportingCitizen'),
            'priority_type': request.form.get('priorityType'),
            'notice': request.form.get('notice'),
            'description': request.form.get('description'),
            'report_status': 'pending',
            'created_at': datetime.datetime.utcnow().isoformat(),  # Convert to ISO string
            'updated_at': datetime.datetime.utcnow().isoformat(),  # Convert to ISO string
            'evidence_type': 'geotagged_photo' if evidence_path else None,
            'geo_data': geo_data  # Ensure this doesn't contain datetime objects
        }

        if evidence_path:
            alert_data['evidence_files'] = {
                'original': evidence_path,
                'thumbnail': f"/static/uploads/evidence/thumb_{filename}" if os.path.exists(os.path.join(evidence_dir, f"thumb_{filename}")) else None
            }

        # Insert into database
        alerts_collection.insert_one(alert_data)

        # Notify police dashboard
        socketio.emit('new_incident_report', {
            'alert_id': alert_data['alert_id'],
            'incident_type': alert_data['incident_type'],
            'location': alert_data['location'],
            'priority': alert_data['priority_type'],
            'has_evidence': bool(evidence_path),
            'timestamp': alert_data['created_at']
        }, room='police')

        return jsonify({
            'message': 'Report submitted successfully',
            'alert_id': alert_data['alert_id'],
            'timestamp': datetime.datetime.utcnow().isoformat()  # Ensure string format
        }), 201

    except Exception as e:
        app.logger.error(f"Error in incident report: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/citizen/real-time-map', methods=['GET'])
def citizen_real_time_map():
    return jsonify({"message": "Real-time map data"})

@app.route('/api/citizen/safewalk', methods=['GET'])
def citizen_safewalk():
    return jsonify({"message": "Safewalk data"})

@app.route('/api/citizen/sos', methods=['GET', 'POST'])
def citizen_sos():
    if request.method == 'POST':
        try:
            sos_data = request.json
            timestamp = sos_data.get('timestamp')
            if not timestamp:
                timestamp = datetime.datetime.utcnow().isoformat()
            
            # Prepare data for database
            db_data = {
                'location': sos_data.get('location'),
                'citizen_id': sos_data.get('citizenId'),
                'timestamp': timestamp,
                'status': 'active'
            }
            
            # Save to database
            result = db.sos_alerts.insert_one(db_data)
            
            # Create response with string ID
            response_data = {
                **db_data,
                '_id': str(result.inserted_id)
            }
            
            # Emit socket event with serialized data
            socketio.emit('sos_alert', json.loads(dumps(response_data)), room='police')
            
            return jsonify({
                'status': 'success',
                'message': 'SOS alert sent successfully',
                'data': response_data
            })
            
        except Exception as e:
            print('SOS Error:', str(e))
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
            
    # GET request
    try:
        alerts = list(db.sos_alerts.find())
        return Response(
            dumps(alerts),
            mimetype='application/json'
        )
    except Exception as e:
        print('Error fetching SOS alerts:', str(e))
        return jsonify([])

@app.route('/api/citizen/sos', methods=['GET'])
def get_sos_alerts():
    try:
        # Get only active SOS alerts
        alerts = list(db.sos_alerts.find({'status': 'active'}))  # Only get active alerts
        
        # Format the response
        formatted_alerts = []
        for alert in alerts:
            # Only include if status is active
            if alert.get('status') == 'active':
                formatted_alerts.append({
                    'citizen_id': alert.get('citizen_id'),
                    'location': {
                        'latitude': float(alert['location']['latitude']),
                        'longitude': float(alert['location']['longitude'])
                    },
                    'timestamp': alert.get('timestamp'),
                    'status': alert.get('status'),
                    '_id': str(alert['_id'])
                })
        
        return jsonify(formatted_alerts)
    except Exception as e:
        print('Error fetching SOS alerts:', str(e))
        return jsonify([])

@app.route('/api/citizen/crime-heatmap', methods=['GET'])
def citizen_crime_heatmap():
    return jsonify({"message": "Crime heatmap data"})

@app.route('/api/crime-data', methods=['GET'])
def get_crime_data():
    try:
        # Add some default data if collection is empty
        if db.heatmap.count_documents({}) == 0:
            default_data = [
                {
                    "lat": "19.0760",
                    "lng": "72.8777",
                    "type": "Theft",
                    "severity": "medium",
                    "description": "Sample incident",
                    "intensity": 0.5
                }
            ]
            db.heatmap.insert_many(default_data)
        
        data = list(db.heatmap.find({}, {"_id": 0}))
        return jsonify(data)
    except Exception as e:
        print("Error fetching crime data:", e)
        return jsonify([])  # Return empty array instead of error

@app.route('/api/report-crime', methods=['POST'])
def report_crime():
    crime_data = request.get_json()
    crime_data['reported_at'] = datetime.datetime.utcnow().isoformat()
    result = db.heatmap.insert_one(crime_data)
    # Add MongoDB ID and emit
    crime_data['_id'] = str(result.inserted_id)
    socketio.emit('new_crime', crime_data)
    return jsonify({"message": "Crime location saved!"})


@app.route('/api/citizen/index', methods=['GET'])
def citizen_Index():
    return jsonify({"message": "Citizen index data"})

# Police Side Routes
@app.route('/police')
def police_index():
    return render_template("Police/index.html")

@app.route('/police/cctv-feeds')
def police_cctv_feeds():
    return render_template("Police/cctv-feeds.html")

@app.route('/police/crime-locator')
def police_crime_locator():
    return render_template("Police/crime-locator.html")

@app.route('/police/crime-heatmap')
def police_crime_heatmap():
    return render_template("Police/crime-heatmap.html")

@app.route('/police/incident-verify', methods=['GET', 'POST'])
def police_incident_verify():
    if request.method == "GET":
        try:
            # Fetch all incidents with status "pending" from the Alerts collection
            pending_alerts = list(alerts_collection.find({"report_status": "pending"}).sort("created_at", -1))
            for alert in pending_alerts:
                alert["_id"] = str(alert["_id"])  
            return render_template("Police/incident-verify.html", incidents=pending_alerts)
        except Exception as e:
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    if request.method == "POST":
        try:
            # Process Accept or Reject actions
            data = request.get_json()
            alert_id = data.get("alert_id")
            action = data.get("action")

            # Ensure the alert exists
            alert = alerts_collection.find_one({"alert_id": alert_id})
            if not alert:
                return jsonify({"error": "Alert not found"}), 404

            if action == "accept":
                incidents_collection.insert_one(alert)
                alerts_collection.delete_one({"alert_id": alert_id})
                message = "Incident accepted and moved to Incidents collection."
            elif action == "reject":
                alerts_collection.update_one(
                    {"alert_id": alert_id},
                    {"$set": {"report_status": "rejected", "updated_at": datetime.datetime.utcnow()}}
                )
                message = "Incident rejected."
            else:
                return jsonify({"error": "Invalid action"}), 400

            return jsonify({"message": message}), 200
        except Exception as e:
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/police/incident-alerts', methods=['GET'])
def police_incident_alerts():
    incidents = list(incidents_collection.find().sort("created_at", -1))
    for incident in incidents:
        incident["_id"] = str(incident["_id"])
    return render_template("Police/incident-alerts.html", incidents=incidents)

@app.route('/police/update-incident-status/<incident_id>', methods=['POST'])
def update_incident_status(incident_id):
    try:
        new_status = request.json.get("status")
        result = incidents_collection.update_one(
            {"_id": ObjectId(incident_id)}, {"$set": {"status_type": new_status}}
        )
        if result.modified_count > 0:
            return jsonify({"message": "Status updated successfully!"}), 200
        else:
            return jsonify({"error": "Incident not found or no changes made"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/police/incident-report', methods=['GET', 'POST'])
def police_incident_report():
    if request.method == "POST":
        try:
            # Log form and file data
            print("Form data received:", request.form)
            print("Files received:", request.files)

            # Extract data
            incident_type = request.form.get("incidentType")
            date_time = request.form.get("dateTime")
            location = request.form.get("location")
            reporting_officer = request.form.get("reportingOfficer")
            status_type = request.form.get("statusType")
            priority_type = request.form.get("priorityType")
            notice = request.form.get("notice")
            description = request.form.get("description")

            # Handle file uploads
            evidence_files = request.files.getlist("evidence")
            evidence_file_paths = []
            evidence_dir = "backend/static/uploads/evidence"  # Save in static directory
            os.makedirs(evidence_dir, exist_ok=True)

            for evidence in evidence_files:
                if evidence.filename != "":
                    file_path = os.path.join(evidence_dir, evidence.filename)
                    evidence.save(file_path)
                    # Save public URL for the file
                    evidence_file_paths.append(f"/backend/static/uploads/evidence/{evidence.filename}")

            # Create the document to insert into MongoDB
            incident_data = {
                "incident_type": incident_type,
                "date_time": date_time,
                "location": location,
                "reporting_officer": reporting_officer,
                "status_type": status_type,
                "priority_type": priority_type,
                "notice": notice,
                "description": description,
                "evidence_files": evidence_file_paths,
                "created_at": datetime.datetime.utcnow(),
                "updated_at": datetime.datetime.utcnow(),
            }

            # Insert into MongoDB
            result = incidents_collection.insert_one(incident_data)
         
            return jsonify({
                "message": "Incident report submitted successfully!",
                "incident_id": str(result.inserted_id),
            }), 201
        except Exception as e:
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    # Render the form for GET requests
    return render_template("Police/incident-report.html")

@app.route('/police/login', methods=['GET', 'POST'])
def police_login():
    if request.method == 'POST':
        username = request.form.get('admin')
        password = request.form.get('admin')
        # Add your authentication logic here
        return redirect(url_for('police_index'))
    return render_template('Police/Login.html')

@app.route('/police/offender-database')
def police_offender_database():
    return render_template("Police/offender-database.html")

@app.route('/police/police-analytics')
def police_analytics():
    return render_template("Police/police-analytics.html")

@app.route('/police/sos-notifications')
def police_sos_notifications():
    return render_template("Police/sos-notifications.html")

@app.route('/Police/Missing_Person_Database')
def Police_Missing_Person_Database():
    return render_template("Police/Mpdb.html")

@app.route('/Police/Broadcast_Alert')    
def Police_Broadcast_Alert():
    return render_template("Police/Broadcast_Alert.html")  

@app.route('/submit_alert', methods=['POST'])
def submit_alert():
    try:
        # Get form data
        alert_data = {
            'alertType': request.form.get('alertType'),
            'alertTitle': request.form.get('alertTitle'),
            'alertMessage': request.form.get('alertMessage'),
            'location': request.form.get('location'),
            'alertDuration': int(request.form.get('alertDuration') or 0),
            'targetAudience': request.form.getlist('targetAudience'),
            'status_type' : "pending" , 
            'priority_type' : "high",
            'date_time' : request.form.get("dateTime"),
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow(),
        }

        # Insert into MongoDB
        result = incidents_collection.insert_one(alert_data)
        alert_data['_id'] = str(result.inserted_id)

        # Broadcast the new alert to all connected clients
        socketio.emit('new_alert', alert_data)

        # Send WhatsApp message
        whatsapp_message = (
            f"🚨 New Alert 🚨\n"
            f"Type: {alert_data['alertType']}\n"
            f"Title: {alert_data['alertTitle']}\n"
            f"Message: {alert_data['alertMessage']}\n"
            f"Location: {alert_data['location']}\n"
            f"Duration: {alert_data['alertDuration']} hours\n"
            f"Target Audience: {', '.join(alert_data['targetAudience'])}"
        )

        # Schedule the message to be sent in 1 minute
        now =  datetime.datetime.now()
        send_time = now + datetime.timedelta(minutes=2)
        kit.sendwhatmsg(phone_number, whatsapp_message, send_time.hour, send_time.minute)

        return jsonify({
            'status': 'success',
            'message': 'Alert submitted and WhatsApp message scheduled successfully',
            'inserted_id': str(result.inserted_id)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/markers', methods=['POST'])
def save_marker():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    title = data.get('title')
    priority = data.get('priority')

    if not lat or not lng or not title or not priority:
        return jsonify({'error': 'Latitude, longitude, title, and priority are required'}), 400

    # Insert marker into MongoDB
    marker = {'lat': lat, 'lng': lng, 'title': title, 'priority': priority}
    markers_collection.insert_one(marker)

    return jsonify(marker), 201

# API to fetch all markers
@app.route('/api/markers', methods=['GET'])
def get_markers():
    markers = list(markers_collection.find({}, {'_id': 0}))  # Exclude MongoDB _id field
    return jsonify(markers), 200

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected with SID:', request.sid)
    emit('connect_response', {'status': 'connected'})

@socketio.on('error')
def handle_error(error):
    print('Socket error:', error)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected:', request.sid)

@socketio.on('sos_triggered')
def handle_sos(data):
    try:
        # Check if this is a deactivation request
        if data.get('status') == 'deactivated':
            # Update all active alerts for this citizen to deactivated
            db.sos_alerts.update_many(
                {'citizen_id': data.get('citizenId'), 'status': 'active'},
                {'$set': {'status': 'deactivated'}}
            )
            
            # Notify police to remove marker and update UI
            emit('sos_deactivated', {
                'citizen_id': data.get('citizenId')
            }, broadcast=True, room='police')  # Add broadcast=True
            
            return {'status': 'success', 'message': 'SOS deactivated'}

        # Get existing alert
        existing_alert = db.sos_alerts.find_one({
            'citizen_id': data.get('citizenId'),
            'status': 'active'
        })

        # If this is a location update for an existing alert
        if existing_alert:
            db.sos_alerts.update_one(
                {'_id': existing_alert['_id']},
                {'$set': {
                    'location': data.get('location'),
                    'timestamp': data.get('timestamp') or datetime.datetime.utcnow().isoformat()
                }}
            )
            return {'status': 'success', 'message': 'Location updated'}

        # If this is a new alert
        sos_data = {
            'location': data.get('location'),
            'citizen_id': data.get('citizenId', str(uuid.uuid4())),
            'timestamp': data.get('timestamp') or datetime.datetime.utcnow().isoformat(),
            'status': 'active'
        }
        
        # Save to database
        result = db.sos_alerts.insert_one(sos_data)
        sos_data['_id'] = str(result.inserted_id)
        
        # Broadcast only new alerts
        emit('sos_alert', json.loads(dumps(sos_data)), room='police', include_self=False)
        
        return {'status': 'success', 'message': 'SOS alert sent'}
    except Exception as e:
        print('Error in handle_sos:', str(e))
        return {'status': 'error', 'message': str(e)}

@socketio.on('join_police_room')
def handle_police_join():
    join_room('police')

@socketio.on('leave_police_room')
def handle_police_leave():
    leave_room('police')

# Fix the root route to serve the login page
@app.route('/')
def index():
    return render_template('Police/Login.html')

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    local_ip = get_local_ip()
    print(f"Server IP: {local_ip}")
    print("Template folder path:", app.template_folder)  # Debug print
    print("Starting Socket.IO server...")
    socketio.run(
        app,
        host=local_ip,  # Use the actual IP instead of 0.0.0.0
        port=5000,
        debug=True,
        allow_unsafe_werkzeug=True,  # Add this for development
        log_output=True,
        use_reloader=False  # Add this to prevent duplicate connections
    )