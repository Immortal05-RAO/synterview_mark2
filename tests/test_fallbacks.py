import pytest
from src.services.question_bank import get_fallback_questions, QUESTION_BANK
from src.services.ai_service import FallbackProvider
from src.services.speech_provider import FallbackSpeechProvider
from src.services.speech_service import calculate_speech_metrics


@pytest.mark.asyncio
async def test_question_bank_all_roles():
    roles = ["Software Engineer", "Backend Developer", "Frontend Developer", "Machine Learning Engineer", "Data Scientist", "DevOps Engineer", "Product Manager"]
    for r in roles:
        qs = get_fallback_questions(role=r, difficulty="Medium", interview_type="Technical", count=3)
        assert len(qs) == 3
        for q in qs:
            assert "text" in q
            assert "category" in q


@pytest.mark.asyncio
async def test_fallback_ai_evaluation():
    provider = FallbackProvider()
    res = await provider.evaluate_answer(
        question="Explain REST API",
        answer="A REST API uses HTTP methods like GET and POST to transfer data state representation.",
        role="Software Engineer",
        experience="Fresher",
        difficulty="Medium",
        interview_type="Technical"
    )
    assert 0 <= res["technicalScore"] <= 100
    assert 0 <= res["overallScore"] <= 100
    assert len(res["feedback"]) > 0
    assert isinstance(res["strengths"], list)
    assert isinstance(res["improvements"], list)


@pytest.mark.asyncio
async def test_fallback_speech_provider(tmp_path, monkeypatch):
    from src.config import settings
    monkeypatch.setattr(settings, "DEMO_MODE", True)
    # Create a temporary dummy audio file
    dummy_audio = tmp_path / "sample.mp3"
    dummy_audio.write_bytes(b"0" * 32000)

    provider = FallbackSpeechProvider()
    res = await provider.transcribe_audio(str(dummy_audio))

    assert "transcript" in res
    assert len(res["transcript"]) > 0
    assert res["duration_seconds"] > 0
    assert len(res["segments"]) > 0

    metrics = calculate_speech_metrics(res["transcript"], res["segments"], res["duration_seconds"])
    assert metrics["total_words"] > 0
    assert metrics["words_per_minute"] > 0
    assert "filler_words" in metrics
    assert "pause_count" in metrics


@pytest.mark.asyncio
async def test_fallback_speech_provider_does_not_fabricate_outside_demo(tmp_path, monkeypatch):
    from src.config import settings
    monkeypatch.setattr(settings, "DEMO_MODE", False)
    dummy_audio = tmp_path / "sample.mp3"
    dummy_audio.write_bytes(b"0" * 32000)

    res = await FallbackSpeechProvider().transcribe_audio(str(dummy_audio))
    assert res["transcript"] == ""
    assert res["segments"] == []
