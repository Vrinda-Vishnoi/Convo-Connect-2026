from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class JobBase(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    weights: Dict[str, float]

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    weights: Optional[Dict[str, float]] = None

class JobResponse(JobBase):
    id: int
    class Config:
        from_attributes = True

class InterviewStart(BaseModel):
    candidate_id: int

class InterviewMessage(BaseModel):
    transcript: str

class InterviewLogResponse(BaseModel):
    id: int
    sender: str
    content: str
    order_index: int
    class Config:
        from_attributes = True

class InterviewResponse(BaseModel):
    id: int
    candidate_id: int
    status: str
    logs: List[InterviewLogResponse] = []
    class Config:
        from_attributes = True

class ScreeningResultResponse(BaseModel):
    match_score: float
    reasons: List[str]

class EvaluationResponse(BaseModel):
    technical_score: float
    communication_score: float
    role_fit_score: float
    weighted_total: float
    rationales: list
    class Config:
        from_attributes = True

class InterviewStatusResponse(BaseModel):
    id: int
    status: str
    class Config:
        from_attributes = True

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    screening_result: Optional[ScreeningResultResponse] = None
    evaluation: Optional[EvaluationResponse] = None
    interview: Optional[InterviewStatusResponse] = None
    class Config:
        from_attributes = True
