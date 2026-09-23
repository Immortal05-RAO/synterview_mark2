import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    NODE_ENV: str = "development"
    PORT: int = 5000
    DATABASE_URL: str = "sqlite:///./synterview.db"

    JWT_SECRET: str = "synterview-super-secret-jwt-key-2026-demo"
    JWT_REFRESH_SECRET: str = "synterview-super-secret-refresh-key-2026-demo"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    AI_PROVIDER: str = "fallback"  # gemini, openai, fallback
    AI_MODEL: str = "gemini-2.5-flash"
    AI_API_KEY: str = ""

    WHISPER_MODEL: str = "small"
    DEMO_MODE: bool = False
    CORS_ORIGIN: str = "*"

    UPLOAD_DIR: str = "./uploads"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
