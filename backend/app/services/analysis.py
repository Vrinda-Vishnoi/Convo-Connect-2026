import json
from google import genai
from google.genai import types
from app.config import settings
import re

def analyze_transcript(transcript: str) -> dict:
    fallback = {
        "clarity_score": 0.8,
        "readability_score": 10.5,
        "filler_word_frequency": 0.05,
        "relevance_score": 0.9
    }
    
    if not settings.gemini_api_key or not transcript.strip():
        return fallback

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""Analyze the following interview transcript and provide a JSON response with exactly these fields:
- "clarity_score" (float, 0.0 to 1.0)
- "readability_score" (float, 0.0 to 100.0)
- "filler_word_frequency" (float, 0.0 to 1.0)
- "relevance_score" (float, 0.0 to 1.0)

Transcript:
{transcript}"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        text = response.text
        # Extract JSON if wrapped in markdown
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if match:
            text = match.group(1)
            
        data = json.loads(text)
        return {
            "clarity_score": float(data.get("clarity_score", fallback["clarity_score"])),
            "readability_score": float(data.get("readability_score", fallback["readability_score"])),
            "filler_word_frequency": float(data.get("filler_word_frequency", fallback["filler_word_frequency"])),
            "relevance_score": float(data.get("relevance_score", fallback["relevance_score"]))
        }
    except Exception as e:
        print(f"Gemini API Error in analyze_transcript: {e}")
        return fallback
