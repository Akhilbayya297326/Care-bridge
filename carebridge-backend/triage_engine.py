import os
import httpx
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Initialize the new GenAI client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

async def analyze_patient_update(text: str, image_url: str = None) -> str:
    # 1. Define the System Instruction for strict role adherence
    system_instruction = (
        "You are an AI medical triage assistant for the CareBridge rural health platform. "
        "Analyze the patient's symptoms (text) and/or surgical site image."
    )
    
    # 2. Define the exact prompt and classification rules
    prompt = """CLASSIFICATION RULES:
- Red: Severe symptoms. Mentions of bleeding, extreme swelling, severe pain, pus, fever, or phrases like "very red and swollen".
- Yellow: Moderate symptoms. Mild redness, slight discomfort, itching, or general questions.
- Green: Normal recovery. Mentions of no pain, feeling good, or looking clean and healing.

CRITICAL INSTRUCTION: Your response must be EXACTLY ONE WORD from this list: [Green, Yellow, Red]. Do not include any punctuation, explanation, or additional text."""

    contents = [prompt]
    if text:
        contents.append(f"Patient input: {text}")
        
    # 3. Handle Multimodal Image Downloading
    if image_url:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(image_url)
            if response.status_code == 200:
                # Use the new SDK's official Part mapping for raw bytes
                contents.append(
                    types.Part.from_bytes(
                        data=response.content,
                        mime_type="image/jpeg"
                    )
                )
                
    try:
        # 4. Generate content with strict configuration
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.0, # Forces deterministic, highly consistent outputs
            )
        )
        
        # Clean the output text
        result = response.text.strip().replace(".", "").capitalize()
        
        # Guardrail: If the AI somehow hallucinates, default to Yellow (Watch)
        if result not in ["Green", "Yellow", "Red"]:
            print(f"Unexpected AI Output: {result}")
            return "Yellow" 
            
        return result
        
    except Exception as e:
        print(f"AI Engine Error: {e}")
        return "Yellow" # Safest fallback for medical triage