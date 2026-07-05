from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    required_skills = Column(JSON)
    weights = Column(JSON)
    candidates = relationship("Candidate", back_populates="job")

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    job = relationship("Job", back_populates="candidates")
    resume = relationship("Resume", back_populates="candidate", uselist=False)
    screening_result = relationship("ScreeningResult", back_populates="candidate", uselist=False)
    interview = relationship("Interview", back_populates="candidate", uselist=False)
    evaluation = relationship("Evaluation", back_populates="candidate", uselist=False)

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    extracted_text = Column(Text)
    redacted_text = Column(Text)
    candidate = relationship("Candidate", back_populates="resume")

class ScreeningResult(Base):
    __tablename__ = "screening_results"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    match_score = Column(Float)
    reasons = Column(JSON)
    candidate = relationship("Candidate", back_populates="screening_result")

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    persona_name = Column(String, default="Ari")
    status = Column(String, default="pending")
    disclosure_shown = Column(String)
    candidate = relationship("Candidate", back_populates="interview")
    logs = relationship("InterviewLog", back_populates="interview")
    analysis = relationship("CommunicationAnalysis", back_populates="interview", uselist=False)

class InterviewLog(Base):
    __tablename__ = "interview_logs"
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    sender = Column(String)  # 'bot' or 'user'
    content = Column(Text)
    order_index = Column(Integer)
    interview = relationship("Interview", back_populates="logs")


class CommunicationAnalysis(Base):
    __tablename__ = "communication_analyses"
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    clarity_score = Column(Float)
    readability_score = Column(Float)
    filler_word_frequency = Column(Float)
    relevance_score = Column(Float)
    interview = relationship("Interview", back_populates="analysis")

class Evaluation(Base):
    __tablename__ = "evaluations"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    technical_score = Column(Float)
    communication_score = Column(Float)
    role_fit_score = Column(Float)
    weighted_total = Column(Float)
    rationales = Column(JSON)
    candidate = relationship("Candidate", back_populates="evaluation")
