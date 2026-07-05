from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.config import settings

import logging
from app import models

# Create all tables (in a real app, use Alembic)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logging.warning(f"Could not connect to database at startup: {e}")

app = FastAPI(title="ConvoConnect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

from app.routers import jobs, interviews

app.include_router(jobs.router)
app.include_router(interviews.router)
