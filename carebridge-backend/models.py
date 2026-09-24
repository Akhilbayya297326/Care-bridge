from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class PatientStatusResponse(BaseModel):
    id: str = Field(alias="_id") # Maps MongoDB's _id to id for React
    phone_number: str
    symptoms_text: str = ""
    media_url: Optional[str] = None
    triage_color: str
    timestamp: datetime
    
    model_config = ConfigDict(populate_by_name=True)