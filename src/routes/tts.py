from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel, Field

from src.models.user import User
from src.services.auth_service import get_current_user
from src.services.tts_service import synthesize, MAX_CHARS

router = APIRouter(prefix="/api/tts", tags=["Speech"])


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_CHARS)
    gender: str = "female"


@router.post("")
async def text_to_speech(payload: TTSRequest, current_user: User = Depends(get_current_user)):
    audio = await synthesize(payload.text, payload.gender)
    if not audio:
        # 204 tells the client to use the browser's own voice instead
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "private, max-age=3600"})
