import re
import json
import whisper


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


def clean_word(word):
    return re.sub(r"[^a-zA-Z']", "", word.lower())


def analyze_segments(segments):
    """
    Analyze Whisper timestamped segments.

    NOTE:
    At this stage this analyzes the entire transcript.
    Later we'll add speaker diarization so we only analyze
    the candidate's speech.
    """

    all_words = []
    filler_count = 0
    repeated_words = 0
    pauses = []
    long_pauses = []

    previous_end = None

    for segment in segments:
        text = segment["text"].strip()

        start = float(segment["start"])
        end = float(segment["end"])

        # Detect pauses between Whisper segments
        if previous_end is not None:
            pause = start - previous_end

            if pause > 0.5:
                pauses.append(pause)

            if pause >= 2.0:
                long_pauses.append(pause)

        previous_end = end

        words = text.split()

        for word in words:
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

    if segments:
        total_duration = (
            float(segments[-1]["end"]) -
            float(segments[0]["start"])
        )
    else:
        total_duration = 0

    minutes = total_duration / 60

    if minutes > 0:
        words_per_minute = total_words / minutes
    else:
        words_per_minute = 0

    return {
        "total_words": total_words,
        "duration_seconds": round(total_duration, 2),
        "words_per_minute": round(words_per_minute, 2),

        "filler_words": filler_count,
        "filler_rate": round(
            filler_count / total_words, 4
        ) if total_words else 0,

        "repeated_words": repeated_words,

        "pause_count": len(pauses),
        "long_pause_count": len(long_pauses),

        "average_pause_seconds": round(
            sum(pauses) / len(pauses), 2
        ) if pauses else 0,

        "longest_pause_seconds": round(
            max(pauses), 2
        ) if pauses else 0,

        "long_pauses": [
            round(pause, 2)
            for pause in long_pauses
        ],
    }


def main():
    print("Loading Whisper Small...")

    model = whisper.load_model(
        "small",
        device="cuda"
    )

    print("Model loaded.")

    audio_file = r"C:\Users\shash\synterview-ai\interview.mp4"

    print("\nAnalyzing interview...")

    result = model.transcribe(
        audio_file,
        language="en",
        task="transcribe",
        fp16=True,
        temperature=0
    )

    metrics = analyze_segments(result["segments"])

    print("\n" + "=" * 50)
    print("SYNTERVIEW SPEECH METRICS")
    print("=" * 50)

    for key, value in metrics.items():
        print(f"{key}: {value}")

    with open(
        "speech_features.json",
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            metrics,
            f,
            indent=2,
            ensure_ascii=False
        )

    print("\nSaved → speech_features.json")


if __name__ == "__main__":
    main()