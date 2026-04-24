import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

mongo_con = os.environ.get("MONGO_URI_LOCAL", "mongodb://localhost:27017")
client = MongoClient(mongo_con)
db = client["SurakshaSetu"]
Alert_Collection = db["Alerts"]

alert_data = {
    'alertType': 'Test Alert',
    'alertTitle': 'Test Title',
    'alertMessage': 'This is a test message',
    'alertLocation': 'Test Location',
    'alertDuration': 30,
    'targetAudience': ['Public', 'Officials']
}

result = Alert_Collection.insert_one(alert_data)
print("Inserted ID:", result.inserted_id)
