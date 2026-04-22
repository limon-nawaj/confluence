from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # Database — swap to oracle+oracledb://user:pass@host:1521/?service_name=ORCLPDB for Oracle
    DATABASE_URL: str = "sqlite:///./app/unidocs.db"

    # JWT
    SECRET_KEY: str = "change-me-to-a-32-character-random-string-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    # File uploads
    UPLOAD_DIR: str = "app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 25

    class Config:
        env_file = ".env"


settings = Settings()
