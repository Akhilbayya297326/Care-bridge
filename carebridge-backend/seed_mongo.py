import asyncio
from datetime import datetime, timedelta
from database import patient_collection # Connects to your MongoDB setup

async def seed_database():
    now = datetime.utcnow()
    two_days_ago = now - timedelta(days=2)
    yesterday = now - timedelta(days=1)
    
    test_patients = [
        {
            "phone_number": "+919876543210",
            "symptoms_text": "Feeling okay, minor pain.",
            "media_url": None,
            "triage_color": "Green",
            "timestamp": two_days_ago
        },
        {
            "phone_number": "+919876543210",
            "symptoms_text": "It's a bit more swollen today.",
            "media_url": None,
            "triage_color": "Yellow",
            "timestamp": yesterday
        },
        {
            "phone_number": "+919876543210",
            "symptoms_text": "Very red, hot to touch, and painful.",
            "media_url": "https://res.cloudinary.com/demo/image/upload/sample.jpg", # Sample Cloudinary image
            "triage_color": "Red",
            "timestamp": now
        },
        {
            "phone_number": "+919998887776",
            "symptoms_text": "No pain, looks clean.",
            "media_url": None,
            "triage_color": "Green",
            "timestamp": yesterday
        },
        {
            "phone_number": "+918887776665",
            "symptoms_text": "A little itchy around the stitches.",
            "media_url": None,
            "triage_color": "Yellow",
            "timestamp": now
        }
    ]
    
    # Insert test data
    await patient_collection.insert_many(test_patients)
    print("✅ Real test data successfully injected into MongoDB!")

if __name__ == "__main__":
    asyncio.run(seed_database())