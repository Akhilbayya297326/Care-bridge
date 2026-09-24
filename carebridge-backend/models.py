from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class PatientStatusResponse(BaseModel):
    id: str = Field(alias="_id")
    phone_number: str
    symptoms_text: str = ""
    media_url: Optional[str] = None
    
    # We now expect three detailed fields from the AI
    triage_color: str
    ai_detected_symptoms: str = "Awaiting detail"
    ai_recommendation: str = "Awaiting detail"
    
    timestamp: datetime
    
    model_config = ConfigDict(populate_by_name=True)
