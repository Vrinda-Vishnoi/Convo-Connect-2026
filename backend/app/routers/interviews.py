from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List
from app.services.interview import start_interview, process_answer

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

@router.post("/start", response_model=schemas.InterviewResponse)
def init_interview(data: schemas.InterviewStart, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == data.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    job = db.query(models.Job).filter(models.Job.id == candidate.job_id).first()
    resume = db.query(models.Resume).filter(models.Resume.candidate_id == candidate.id).first()
    
    resume_text = resume.redacted_text if resume else ""
    job_desc = f"{job.title} - {job.description}\nRequired Skills: {', '.join(job.required_skills)}"
    
    # Generate first question
    first_msg = start_interview(job_desc, resume_text)
    
    # Create interview session
    interview = models.Interview(
        candidate_id=candidate.id,
        status="in_progress"
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    
    # Add first log
    log = models.InterviewLog(
        interview_id=interview.id,
        sender="bot",
        content=first_msg,
        order_index=0
    )
    db.add(log)
    db.commit()
    
    # Refresh to include logs
    db.refresh(interview)
    return interview

@router.post("/{interview_id}/message", response_model=schemas.InterviewResponse)
def send_message(interview_id: int, message: schemas.InterviewMessage, db: Session = Depends(get_db)):
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    candidate = db.query(models.Candidate).filter(models.Candidate.id == interview.candidate_id).first()
    job = db.query(models.Job).filter(models.Job.id == candidate.job_id).first()
    resume = db.query(models.Resume).filter(models.Resume.candidate_id == candidate.id).first()
    
    resume_text = resume.redacted_text if resume else ""
    job_desc = f"{job.title} - {job.description}\nRequired Skills: {', '.join(job.required_skills)}"
    
    logs = db.query(models.InterviewLog).filter(models.InterviewLog.interview_id == interview.id).order_by(models.InterviewLog.order_index.asc()).all()
    
    # Determine next order index
    next_index = logs[-1].order_index + 1 if logs else 0
    
    # Save user message
    user_log = models.InterviewLog(
        interview_id=interview.id,
        sender="user",
        content=message.transcript,
        order_index=next_index
    )
    db.add(user_log)
    db.commit()
    
    chat_history = [{"sender": log.sender, "content": log.content} for log in logs]
    
    # Check for early termination keywords
    early_term_keywords = ["not interested", "end this interview", "stop interview", "terminate interview"]
    user_wants_to_end = any(kw in message.transcript.lower() for kw in early_term_keywords)

    # Check for max questions (6 questions limit)
    # The first message is bot. Then user, bot pairs.
    user_message_count = len([log for log in logs if log.sender == "user"]) + 1

    if message.transcript == "[END_INTERVIEW]":
        bot_msg = "Thank you! The interview has been manually concluded. interview concluded."
    elif user_wants_to_end:
        bot_msg = "I understand you are no longer interested in continuing. Thank you for your time. interview concluded."
    elif user_message_count >= 6:
        # Generate one final response without asking a new question, or just conclude
        bot_msg = "Thank you for all your detailed answers! We have reached the end of the interview. interview concluded."
    else:
        bot_msg = process_answer(job_desc, resume_text, chat_history, message.transcript)
    
    bot_log = models.InterviewLog(
        interview_id=interview.id,
        sender="bot",
        content=bot_msg,
        order_index=next_index + 1
    )
    db.add(bot_log)
    
    # Check if interview is concluded (e.g. if the bot says "interview concluded")
    bot_msg_lower = bot_msg.lower()
    if "interview concluded" in bot_msg_lower or "developer (vrinda)" in bot_msg_lower or "i was not developed by my developer" in bot_msg_lower:
        interview.status = "completed"
        
        # --- Wire up Gemini Analysis and Scoring ---
        from app.services.analysis import analyze_transcript
        from app.services.scoring import compute_rubric_scores
        
        # Combine transcript
        full_transcript = "\n".join([f"{msg['sender']}: {msg['content']}" for msg in chat_history])
        full_transcript += f"\nuser: {message.transcript}\nbot: {bot_msg}"
        
        # Analyze
        analysis_data = analyze_transcript(full_transcript)
        analysis_record = models.CommunicationAnalysis(
            interview_id=interview.id,
            clarity_score=analysis_data.get("clarity_score", 0),
            readability_score=analysis_data.get("readability_score", 0),
            filler_word_frequency=analysis_data.get("filler_word_frequency", 0),
            relevance_score=analysis_data.get("relevance_score", 0)
        )
        db.add(analysis_record)
        
        # Score
        job_weights = job.weights if job.weights else {"technical": 0.5, "communication": 0.3, "fit": 0.2}
        screening_result = db.query(models.ScreeningResult).filter(models.ScreeningResult.candidate_id == candidate.id).first()
        match_score = screening_result.match_score if screening_result else 0.5
        
        scoring_data = compute_rubric_scores(job_weights, analysis_data, match_score)
        eval_record = models.Evaluation(
            candidate_id=candidate.id,
            technical_score=scoring_data.get("technical_score", 0),
            communication_score=scoring_data.get("communication_score", 0),
            role_fit_score=scoring_data.get("role_fit_score", 0),
            weighted_total=scoring_data.get("weighted_total", 0),
            rationales=scoring_data.get("rationales", [])
        )
        db.add(eval_record)
        
    db.commit()
    db.refresh(interview)
    
    return interview

@router.get("/{interview_id}/results", response_model=schemas.EvaluationResponse)
def get_results(interview_id: int, db: Session = Depends(get_db)):
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    evaluation = db.query(models.Evaluation).filter(models.Evaluation.candidate_id == interview.candidate_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found or not completed")
        
    return evaluation
