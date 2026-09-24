import os
import httpx
from datetime import datetime
from fastapi import FastAPI, Form, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from twilio.twiml.messaging_response import MessagingResponse
from bson.objectid import ObjectId
import cloudinary
import cloudinary.uploader

# Import MongoDB collection
from database import patient_collection
from models import PatientStatusResponse
from triage_engine import analyze_patient_update
from typing import List
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config( 
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME"), 
    api_key = os.environ.get("CLOUDINARY_API_KEY"), 
    api_secret = os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

app = FastAPI(title="CareBridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Note: We removed the StaticFiles("/uploads") because we don't need local files anymore!

@app.get("/api/patients", response_model=List[PatientStatusResponse])
async def get_patients():
    cursor = patient_collection.find().sort("timestamp", -1)
    patients = await cursor.to_list(length=1000)
    
    for p in patients:
        p["_id"] = str(p["_id"])
    return patients

@app.get("/api/patients/{phone_number}/history", response_model=List[PatientStatusResponse])
async def get_patient_history(phone_number: str):
    decoded_phone = phone_number.replace("%2B", "+")
    cursor = patient_collection.find({"phone_number": decoded_phone}).sort("timestamp", -1)
    patients = await cursor.to_list(length=1000)
    
    for p in patients:
        p["_id"] = str(p["_id"])
    return patients

@app.patch("/api/patients/{patient_id}")
async def resolve_patient(patient_id: str):
    result = await patient_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {"$set": {"triage_color": "Green"}}
    )
    if result.modified_count == 1:
        return {"status": "success"}
    return {"status": "not found"}

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(""),
    NumMedia: int = Form(0),
    MediaUrl0: str = Form(None)
):
    triage_color = await analyze_patient_update(text=Body, image_url=MediaUrl0)
    
    permanent_image_url = None
    if MediaUrl0:
        async with httpx.AsyncClient() as client:
            response = await client.get(MediaUrl0)
            if response.status_code == 200:
                # NEW: Upload directly to Cloudinary from memory
                try:
                    upload_result = cloudinary.uploader.upload(
                        response.content, 
                        folder="carebridge_patients"
                    )
                    permanent_image_url = upload_result.get("secure_url")
                except Exception as e:
                    print("Cloudinary Upload Error:", e)
    
    # Save to MongoDB
    new_record = {
        "phone_number": From,
        "symptoms_text": Body,
        "media_url": permanent_image_url,
        "triage_color": triage_color,
        "timestamp": datetime.utcnow()
    }
    await patient_collection.insert_one(new_record)
    
    twiml = MessagingResponse()
    if triage_color == "Red":
        twiml.message("⚠️ We noticed some warning signs. A doctor has been notified and will contact you shortly. Please rest.")
    elif triage_color == "Yellow":
        twiml.message("Thank you for the update. Keep monitoring the area and send us another photo tomorrow.")
    else:
        twiml.message("✅ Your recovery looks great! Keep up the good work and stay hydrated.")
        
    return Response(content=str(twiml), media_type="application/xml")