import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")

# Connect to MongoDB cluster
client = AsyncIOMotorClient(MONGO_URL)

# Create/Select the 'carebridge' database
db = client.carebridge

# Create/Select the 'patients' collection (similar to a SQL table)
patient_collection = db.patients