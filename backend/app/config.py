import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://user:password@localhost/convoconnect"
    gemini_api_key: str | None = None
    frontend_origin: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
