import json
import os
from google import genai
from app.config import settings

BANK_PATH = os.path.join(os.path.dirname(__file__), "../question_bank.json")

def get_fallback_question(index: int) -> str:
    try:
        with open(BANK_PATH, "r") as f:
            bank = json.load(f)
        
        # Simple logic: 0 = greeting, 1-3 = behavioral, 4-6 = technical, 7 = conclusion
        if index == 0: return bank["greeting"]
        elif 1 <= index <= 3: return bank["behavioral"][index - 1]
        elif 4 <= index <= 6: return bank["technical"][index - 4]
        else: return bank["conclusion"]
    except Exception:
        return "Can you tell me more about your experience?"

def start_interview(job_description: str, resume_text: str) -> str:
    if not settings.gemini_api_key:
        return get_fallback_question(0)
        
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""You are Ari, an AI interviewer. You are interviewing a candidate for a job.
Job Description:
{job_description}

Candidate's Resume:
{resume_text}

Begin the interview by introducing yourself briefly as Ari, welcoming them, and asking the very first question based on their resume and the job requirements. Keep it under 3 sentences."""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return get_fallback_question(0)

def process_answer(job_description: str, resume_text: str, chat_history: list[dict], transcript: str) -> str:
    if not settings.gemini_api_key:
        # Fallback based on history length (rough estimate of index)
        return get_fallback_question(len(chat_history) // 2 + 1)
        
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        
        system_prompt = f"""You are Ari, an AI interviewer.
Job Description:
{job_description}

Candidate's Resume:
{resume_text}

Rules:
1. If the candidate's answer is too brief or generic, ask a probing follow-up question.
2. If the answer is satisfactory, move on to a new technical or behavioral question.
3. You are limited to asking a maximum of 6 questions. If this is the 6th question, you MUST conclude the interview and explicitly include the phrase "interview concluded" in your response.
4. Keep your responses concise and conversational.
5. PRECHECK: If the candidate uses bad language or asks non-related questions, you MUST stop the interview immediately and respond EXACTLY with: 'I was not developed by my developer (Vrinda) to inform you of this.'
"""

        # Format history for Gemini
        contents = [{"role": "user", "parts": [{"text": system_prompt}]}]
        
        # Hard stop if we reach the limit
        # 6 questions from model = 12 total messages (assuming alternating user/model)
        if len(chat_history) >= 12:
            return "Thank you for your time. This interview has now concluded."
        # Since we use generate_content for chat, we structure the conversation
        for log in chat_history:
            role = "model" if log["sender"] == "bot" else "user"
            contents.append({"role": role, "parts": [{"text": log["content"]}]})
            
        # Add current user answer
        contents.append({"role": "user", "parts": [{"text": transcript}]})

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
        )
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return get_fallback_question(len(chat_history) // 2 + 1)
