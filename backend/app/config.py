from pydantic_settings import BaseSettings
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app/unidocs.db"

    # JWT
    SECRET_KEY: str = "change-me-to-a-32-character-random-string-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — stored as plain string to avoid pydantic-settings JSON pre-parsing.
    # Accepts a comma-separated list or a JSON array.
    CORS_ORIGINS: str = "http://localhost:5173"

    # File uploads
    UPLOAD_DIR: str = "app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 25

    # Cloudinary — optional; if set, uploads go to Cloudinary instead of local disk
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    @property
    def cloudinary_enabled(self) -> bool:
        return bool(self.CLOUDINARY_CLOUD_NAME and self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET)

    @property
    def cors_origins_list(self) -> list:
        v = self.CORS_ORIGINS.strip()
        if v.startswith("["):
            return json.loads(v)
        return [o.strip() for o in v.split(",")]

    @property
    def db_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        env_file = ".env"


settings = Settings()
