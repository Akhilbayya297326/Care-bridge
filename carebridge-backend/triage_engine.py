import os
import json
import httpx
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Notice the return type is now a dictionary, not just a string
async def analyze_patient_update(text: str, image_url: str = None) -> dict:
    system_instruction = (
        "You are an AI medical triage assistant for the CareBridge rural health platform. "
        "Analyze the patient's symptoms (text) and/or surgical site image. "
        "You MUST respond ONLY with a valid JSON object. Do not use markdown blocks."
    )
    
    prompt = """Analyze the input and return a JSON object with exactly these three keys:
    {
      "triage_color": "Red" | "Yellow" | "Green",
      "detected_symptoms": "A short, 1-sentence summary of the main medical symptoms observed.",
      "clinical_recommendation": "A 1-sentence recommended action for the attending doctor."
    }
    
    CLASSIFICATION RULES:
    - Red: Severe symptoms (bleeding, extreme swelling, severe pain, pus, fever).
    - Yellow: Moderate symptoms (mild redness, slight discomfort, itching).
    - Green: Normal recovery (no pain, feeling good, looking clean).
    """

    contents = [prompt]
    if text:
        contents.append(f"Patient input: {text}")
        
    if image_url:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(image_url)
            if response.status_code == 200:
                contents.append(
                    types.Part.from_bytes(
                        data=response.content,
                        mime_type="image/jpeg"
                    )
                )
                
    try:
        # We use response_mime_type="application/json" to force JSON output
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.0,
                response_mime_type="application/json", 
            )
        )
        
        # Parse the JSON string into a Python dictionary
        result_dict = json.loads(response.text)
        
        # Guardrail check
        if result_dict.get("triage_color") not in ["Green", "Yellow", "Red"]:
            result_dict["triage_color"] = "Yellow"
            
        return result_dict
        
    except Exception as e:
        print(f"AI Engine Error: {e}")
        return {
            "triage_color": "Yellow",
            "detected_symptoms": "AI Analysis Failed.",
            "clinical_recommendation": "Manual review required by doctor."
        }
