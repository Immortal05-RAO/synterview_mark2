import logging
from typing import Optional

import httpx

from src.config import settings

logger = logging.getLogger("synterview")

# Natural-sounding neural voices; the frontend only picks male or female
EDGE_VOICES = {
    "us": {"female": "en-US-AvaNeural", "male": "en-US-AndrewNeural"},
    "indian": {"female": "en-IN-NeerjaNeural", "male": "en-IN-PrabhatNeural"},
}
OPENAI_VOICES = {"female": "nova", "male": "onyx"}

MAX_CHARS = 1000


async def _openai_tts(text: str, gender: str, accent: str) -> Optional[bytes]:
    key = settings.openai_speech_key
    if not key:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={"Authorization": f"Bearer {key}"},
                json={"model": "gpt-4o-mini-tts", "voice": OPENAI_VOICES[gender], "input": text, "response_format": "mp3"},
            )
            res.raise_for_status()
            return res.content
    except Exception as exc:
        logger.warning("OpenAI TTS failed, falling back: %s", exc)
        return None


async def _edge_tts(text: str, gender: str, accent: str) -> Optional[bytes]:
    try:
        import edge_tts
    except ImportError:
        return None
    try:
        # A touch slower than default reads as calmer and more conversational
        communicate = edge_tts.Communicate(text, EDGE_VOICES[accent][gender], rate="-4%")
        audio = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.extend(chunk["data"])
        return bytes(audio) or None
    except Exception as exc:
        logger.warning("Edge TTS failed: %s", exc)
        return None


async def synthesize(text: str, gender: str, accent: str = "us") -> Optional[bytes]:
    """Return mp3 bytes for the text, or None so the browser can fall back to its built-in voice."""
    text = text.strip()[:MAX_CHARS]
    if not text:
        return None
    accent = accent if accent in EDGE_VOICES else "us"
    gender = gender if gender in ("female", "male") else "female"
    # OpenAI voices have no Indian option, so an Indian accent goes straight to the Indian neural voices
    openai_audio = await _openai_tts(text, gender, accent) if accent == "us" else None
    return openai_audio or (await _edge_tts(text, gender, accent))
