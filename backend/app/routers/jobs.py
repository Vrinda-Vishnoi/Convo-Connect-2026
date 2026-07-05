from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List
from app.services.resume import parse_resume, redact_identity, calculate_match_score

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.post("", response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = models.Job(**job.model_dump())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("", response_model=List[schemas.JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(models.Job).all()

@router.get("/{job_id}", response_model=schemas.JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{job_id}", response_model=schemas.JobResponse)
def update_job(job_id: int, job_update: schemas.JobUpdate, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    update_data = job_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
        
    db.commit()
    db.refresh(job)
    return job

@router.post("/{job_id}/candidates", response_model=schemas.CandidateResponse)
async def upload_candidate_resume(job_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    content = await file.read()
    
    # 15 MB = 15 * 1024 * 1024 bytes
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 15 MB.")
        
    extracted_text = parse_resume(content, file.filename)
    redacted_text = redact_identity(extracted_text)
    
    # Calculate score against job description and skills
    jd_full = job.description + " " + " ".join(job.required_skills)
    match_score, reasons = calculate_match_score(redacted_text, jd_full)

    # In a real app we'd extract the actual name from the resume or ask for it
    # Here we'll just generate a dummy name for MVP
    candidate = models.Candidate(
        job_id=job_id,
        name=file.filename,
        email="hidden@example.com"
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    resume_db = models.Resume(
        candidate_id=candidate.id,
        extracted_text=extracted_text,
        redacted_text=redacted_text
    )
    db.add(resume_db)
    
    screening = models.ScreeningResult(
        candidate_id=candidate.id,
        match_score=match_score,
        reasons=reasons
    )
    db.add(screening)
    db.commit()
    db.refresh(candidate)
    
    return candidate

@router.get("/{job_id}/candidates", response_model=List[schemas.CandidateResponse])
def get_job_shortlist(job_id: int, db: Session = Depends(get_db)):
    candidates = db.query(models.Candidate)\
        .join(models.ScreeningResult)\
        .filter(models.Candidate.job_id == job_id)\
        .order_by(models.ScreeningResult.match_score.desc())\
        .all()
    return candidates
