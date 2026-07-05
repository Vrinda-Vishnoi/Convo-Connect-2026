import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import (
    Job, Candidate, Resume, ScreeningResult, Interview,
    InterviewLog, CommunicationAnalysis, Evaluation
)

def seed_db():
    db = SessionLocal()
    
    try:
        print("Clearing database...")
        db.query(InterviewLog).delete()
        db.query(CommunicationAnalysis).delete()
        db.query(Interview).delete()
        db.query(Evaluation).delete()
        db.query(ScreeningResult).delete()
        db.query(Resume).delete()
        db.query(Candidate).delete()
        db.query(Job).delete()
        
        db.commit()
        
        print("Creating dummy jobs...")
        job1 = Job(
            title="Senior Machine Learning Engineer",
            description="Leading the development of large language models and highly scalable ML pipelines for generative AI solutions.",
            required_skills=["Python", "PyTorch", "Transformers", "NLP", "Kubernetes", "AWS"],
            weights={"technical": 0.6, "communication": 0.2, "role_fit": 0.2}
        )
        
        job2 = Job(
            title="Lead Product Designer",
            description="Driving the user experience and design strategy for our next-generation communication platform.",
            required_skills=["Figma", "UI/UX", "User Research", "Prototyping", "Design Systems"],
            weights={"technical": 0.4, "communication": 0.4, "role_fit": 0.2}
        )
        
        db.add_all([job1, job2])
        db.commit()
        db.refresh(job1)
        db.refresh(job2)
        
        print("Creating dummy candidates...")
        # Candidate 1 - Excellent
        c1 = Candidate(
            job_id=job1.id,
            name="Alice Chen",
            email="alice.chen@example.com",
            phone="+1-555-0192"
        )
        # Candidate 2 - Great
        c2 = Candidate(
            job_id=job1.id,
            name="David Park",
            email="david.park@example.com",
            phone="+1-555-0103"
        )
        # Candidate 3 - Good
        c3 = Candidate(
            job_id=job2.id,
            name="Sarah Jenkins",
            email="sarah.jenkins@example.com",
            phone="+1-555-0144"
        )
        
        db.add_all([c1, c2, c3])
        db.commit()
        db.refresh(c1)
        db.refresh(c2)
        db.refresh(c3)
        
        print("Adding screening and evaluation results...")
        sr1 = ScreeningResult(candidate_id=c1.id, match_score=98.5, reasons=["10+ years of PyTorch", "Led LLM team at top tech co"])
        sr2 = ScreeningResult(candidate_id=c2.id, match_score=92.0, reasons=["Strong ML background", "Great cloud infra skills"])
        sr3 = ScreeningResult(candidate_id=c3.id, match_score=95.5, reasons=["Created 3 design systems", "Excellent portfolio"])
        
        ev1 = Evaluation(candidate_id=c1.id, technical_score=9.5, communication_score=9.0, role_fit_score=9.5, weighted_total=9.4, rationales={"technical": "Exceptional understanding of transformer architecture.", "communication": "Very clear and articulate.", "role_fit": "Perfect match for leadership role."})
        ev2 = Evaluation(candidate_id=c2.id, technical_score=8.5, communication_score=8.0, role_fit_score=8.5, weighted_total=8.4, rationales={"technical": "Solid engineering skills.", "communication": "Good, but sometimes tangential.", "role_fit": "Strong candidate."})
        ev3 = Evaluation(candidate_id=c3.id, technical_score=9.0, communication_score=9.5, role_fit_score=9.0, weighted_total=9.2, rationales={"technical": "Beautiful aesthetic and deep understanding of UX.", "communication": "Highly empathetic and persuasive.", "role_fit": "Aligns well with our product vision."})
        
        db.add_all([sr1, sr2, sr3, ev1, ev2, ev3])
        db.commit()
        
        print("Seed complete!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
