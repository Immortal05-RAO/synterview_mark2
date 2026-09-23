import re
from typing import List, Dict, Any

FILLER_WORDS = {
    "um",
    "uh",
    "er",
    "erm",
    "like",
    "you know",
    "basically",
    "actually",
    "literally",
    "so",
}


def clean_word(word: str) -> str:
    return re.sub(r"[^a-zA-Z']", "", word.lower())


def calculate_speech_metrics(transcript: str, segments: List[Dict[str, Any]] = None, duration_seconds: float = 0.0) -> Dict[str, Any]:
    if not transcript:
        return {
            "total_words": 0,
            "duration_seconds": 0.0,
            "words_per_minute": 0.0,
            "filler_words": 0,
            "filler_rate": 0.0,
            "repeated_words": 0,
            "pause_count": 0,
            "long_pause_count": 0,
            "average_pause_seconds": 0.0,
            "longest_pause_seconds": 0.0,
        }

    all_words = []
    filler_count = 0
    repeated_words = 0
    pauses = []
    long_pauses = []

    # Process text words
    raw_words = transcript.split()
    for word in raw_words:
        cleaned = clean_word(word)
        if not cleaned:
            continue
        all_words.append(cleaned)
        if cleaned in FILLER_WORDS:
            filler_count += 1

    # Consecutive repeated words
    for i in range(1, len(all_words)):
        if all_words[i] == all_words[i - 1]:
            repeated_words += 1

    total_words = len(all_words)

    # Process segment timestamps if available
    previous_end = None
    if segments:
        for segment in segments:
            start = float(segment.get("start", 0.0))
            end = float(segment.get("end", 0.0))

            if previous_end is not None:
                pause = start - previous_end
                if pause > 0.5:
                    pauses.append(pause)
                if pause >= 2.0:
                    long_pauses.append(pause)
            previous_end = end

        if not duration_seconds and segments:
            duration_seconds = float(segments[-1].get("end", 0.0)) - float(segments[0].get("start", 0.0))

    if not duration_seconds:
        # Fallback duration estimate: ~140 words per minute average reading speed
        duration_seconds = max(5.0, round((total_words / 140.0) * 60.0, 2))

    minutes = duration_seconds / 60.0 if duration_seconds > 0 else 0.0
    wpm = round(total_words / minutes, 2) if minutes > 0 else 0.0
    filler_rate = round(filler_count / total_words, 4) if total_words > 0 else 0.0

    return {
        "total_words": total_words,
        "duration_seconds": round(duration_seconds, 2),
        "words_per_minute": wpm,
        "filler_words": filler_count,
        "filler_rate": filler_rate,
        "repeated_words": repeated_words,
        "pause_count": len(pauses),
        "long_pause_count": len(long_pauses),
        "average_pause_seconds": round(sum(pauses) / len(pauses), 2) if pauses else 0.0,
        "longest_pause_seconds": round(max(pauses), 2) if pauses else 0.0,
    }
