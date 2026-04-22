from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app/unidocs.db"

    # JWT
    SECRET_KEY: str = "change-me-to-a-32-character-random-string-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — accepts a JSON array OR a comma-separated string
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    # File uploads
    UPLOAD_DIR: str = "app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 25

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, list]) -> list:
        if isinstance(v, list):
            return v
        v = v.strip()
        if v.startswith("["):
            return json.loads(v)
        return [origin.strip() for origin in v.split(",")]

    @property
    def db_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        env_file = ".env"


settings = Settings()
