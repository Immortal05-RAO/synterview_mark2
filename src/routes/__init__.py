from src.routes.auth import router as auth_router
from src.routes.interviews import router as interviews_router
from src.routes.health import router as health_router
from src.routes.tts import router as tts_router

__all__ = ["auth_router", "interviews_router", "health_router", "tts_router"]
