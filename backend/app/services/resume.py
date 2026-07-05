import io
import re
from typing import Tuple, List
import pdfplumber
import docx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def parse_resume(file_content: bytes, filename: str) -> str:
    text = ""
    try:
        if filename.lower().endswith('.pdf'):
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                text = "\n".join([page.extract_text() or "" for page in pdf.pages])
        elif filename.lower().endswith('.docx'):
            doc = docx.Document(io.BytesIO(file_content))
            text = "\n".join([para.text for para in doc.paragraphs])
        else:
            # Fallback to plain text if possible
            text = file_content.decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error parsing resume: {e}")
        text = file_content.decode('utf-8', errors='ignore')
    
    return text.strip()

def redact_identity(text: str) -> str:
    # Basic redaction: Emails, Phone numbers
    # Email redaction
    text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', text)
    # Basic phone number redaction (handles various formats)
    text = re.sub(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', '[PHONE]', text)
    
    # In a real app we'd also use SpaCy/NLTK for Named Entity Recognition to redact names and locations.
    # For MVP, we stick to regex to keep it fast and free as requested.
    return text

import json
from google import genai
from pydantic import BaseModel
from app.config import settings

class ScreeningResultSchema(BaseModel):
    match_score: float
    reasons: List[str]

def calculate_match_score(resume_text: str, job_description: str) -> Tuple[float, List[str]]:
    if not resume_text or not job_description or not settings.gemini_api_key:
        return 0.0, []
        
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""You are an expert technical recruiter. Evaluate the following resume against the job description.
Job Description:
{job_description}

Resume:
{resume_text}

Provide a match score between 0.0 and 1.0 (where 1.0 is a perfect match). Also provide a list of up to 3 brief reasons why they match (e.g. "Strong Python experience", "Missing cloud skills")."""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': ScreeningResultSchema,
            },
        )
        
        result = json.loads(response.text)
        return float(result.get("match_score", 0.0)), result.get("reasons", [])
    except Exception as e:
        print(f"Gemini Screening Error: {e}")
        return 0.0, ["Error during screening"]
