# carebridge-backend/seed_db.py
from database import SessionLocal
from models import PatientStatusDB
from datetime import datetime, timedelta

def seed_database():
    db = SessionLocal()
    
    # Generate dates
    now = datetime.utcnow()
    two_days_ago = now - timedelta(days=2)
    yesterday = now - timedelta(days=1)
    
    test_patients = [
        # Patient 1: Wound got worse over 3 days (Timeline test)
        PatientStatusDB(phone_number="+919876543210", symptoms_text="Feeling okay, minor pain.", triage_color="Green", timestamp=two_days_ago),
        PatientStatusDB(phone_number="+919876543210", symptoms_text="It's a bit more swollen today.", triage_color="Yellow", timestamp=yesterday),
        PatientStatusDB(phone_number="+919876543210", symptoms_text="Very red, hot to touch, and painful.", triage_color="Red", timestamp=now),
        
        # Patient 2: Normal recovery
        PatientStatusDB(phone_number="+919998887776", symptoms_text="No pain, looks clean.", triage_color="Green", timestamp=yesterday),
        PatientStatusDB(phone_number="+919998887776", symptoms_text="Still looking good.", triage_color="Green", timestamp=now),
        
        # Patient 3: Yellow watch alert
        PatientStatusDB(phone_number="+918887776665", symptoms_text="A little itchy around the stitches.", triage_color="Yellow", timestamp=now)
    ]
    
    db.add_all(test_patients)
    db.commit()
    db.close()
    print("✅ Real test data successfully injected into CareBridge SQLite Database!")

if __name__ == "__main__":
    seed_database()