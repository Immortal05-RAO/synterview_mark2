import os
import logging
from dotenv import load_dotenv
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("synterview")

# The ElevenLabs SDK reads ELEVENLABS_API_KEY straight from the environment
load_dotenv(".env")

DEFAULT_JWT_SECRET = "synterview-super-secret-jwt-key-2026-demo"
DEFAULT_JWT_REFRESH_SECRET = "synterview-super-secret-refresh-key-2026-demo"


class Settings(BaseSettings):
    # ENVIRONMENT is canonical; NODE_ENV is accepted for backwards compatibility
    ENVIRONMENT: str = Field(
        default="development",
        validation_alias=AliasChoices("ENVIRONMENT", "NODE_ENV"),
    )
    PORT: int = 5000
    DATABASE_URL: str = "sqlite:///./synterview.db"

    JWT_SECRET: str = DEFAULT_JWT_SECRET
    JWT_REFRESH_SECRET: str = DEFAULT_JWT_REFRESH_SECRET
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    AI_PROVIDER: str = "fallback"  # gemini, openai, fallback
    AI_MODEL: str = "gemini-2.5-flash"
    AI_API_KEY: str = ""

    SPEECH_PROVIDER: str = "openai"  # openai, local, fallback
    SPEECH_API_KEY: str = ""  # defaults to AI_API_KEY when AI_PROVIDER is openai
    WHISPER_MODEL: str = "tiny"  # model used by the local whisper provider

    # Interviewer voices: ElevenLabs is used when ELEVENLABS_API_KEY is set (the key itself is read from the environment).
    # Voice IDs come from your ElevenLabs voice library; override any of them in .env.
    ELEVENLABS_MODEL: str = "eleven_flash_v2_5"  # low latency; use eleven_v4 for the highest quality
    ELEVENLABS_VOICE_US_FEMALE: str = "EXAVITQu4vr4xnSDxMaL"  # Sarah
    ELEVENLABS_VOICE_US_MALE: str = "cjVigY5qzO86Huf0OWal"  # Eric
    ELEVENLABS_VOICE_INDIAN_FEMALE: str = "NaKPQmdr7mMxXuXrNeFC"  # Monika Sogam
    ELEVENLABS_VOICE_INDIAN_MALE: str = "txk8uOzZ0iCh0B9mFSRG"  # Rahul S

    DEMO_MODE: bool = False
    CORS_ORIGIN: str = "*"

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 25

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ("production", "prod")

    @property
    def openai_speech_key(self) -> str:
        if self.SPEECH_API_KEY:
            return self.SPEECH_API_KEY
        # Only reuse the AI key when it is actually an OpenAI key
        return self.AI_API_KEY if self.AI_PROVIDER.lower() == "openai" else ""

    def validate_for_runtime(self) -> None:
        """Refuse to boot in production with insecure defaults."""
        if self.is_production:
            problems = []
            if self.JWT_SECRET == DEFAULT_JWT_SECRET or self.JWT_REFRESH_SECRET == DEFAULT_JWT_REFRESH_SECRET:
                problems.append("JWT_SECRET and JWT_REFRESH_SECRET must be changed from the demo defaults")
            if self.JWT_SECRET == self.JWT_REFRESH_SECRET:
                problems.append("JWT_SECRET and JWT_REFRESH_SECRET must differ")
            if problems:
                raise RuntimeError("Insecure production configuration: " + "; ".join(problems))
            if self.CORS_ORIGIN.strip() == "*":
                logger.warning("CORS_ORIGIN is '*' in production; set it to your frontend origin(s).")
        elif self.JWT_SECRET == DEFAULT_JWT_SECRET:
            logger.warning("Using the default demo JWT secrets. Do not deploy like this.")


settings = Settings()
settings.validate_for_runtime()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
