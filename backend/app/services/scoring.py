import json
from google import genai
from google.genai import types
from app.config import settings
import re

def compute_rubric_scores(job_weights: dict, comm_analysis: dict, match_score: float) -> dict:
    fallback = {
        "technical_score": match_score * 100,
        "communication_score": 80.0,
        "role_fit_score": 75.0,
        "weighted_total": 85.0,
        "rationales": ["Solid technical match", "Good clarity"]
    }
    
    if not settings.gemini_api_key:
        return fallback

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""Based on the following data, compute interview scores for the candidate. Return ONLY a JSON object.
Job Weights: {json.dumps(job_weights)}
Communication Analysis: {json.dumps(comm_analysis)}
Resume Match Score: {match_score}

Calculate these scores (0-100) taking into account the job weights and analysis:
- "technical_score" (float, based on match_score and relevance)
- "communication_score" (float, based on clarity, readability, filler words)
- "role_fit_score" (float, holistic estimation)
- "weighted_total" (float, combination of the above based on job weights if available)
- "rationales" (list of strings, 2-3 bullet points explaining the scores)

Provide EXACTLY the JSON with those keys."""
        
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
            "technical_score": float(data.get("technical_score", fallback["technical_score"])),
            "communication_score": float(data.get("communication_score", fallback["communication_score"])),
            "role_fit_score": float(data.get("role_fit_score", fallback["role_fit_score"])),
            "weighted_total": float(data.get("weighted_total", fallback["weighted_total"])),
            "rationales": data.get("rationales", fallback["rationales"])
        }
    except Exception as e:
        print(f"Gemini API Error in compute_rubric_scores: {e}")
        return fallback
