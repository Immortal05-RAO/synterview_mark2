import json
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from fastapi import status
from src.middleware.error_handler import APIException
from src.models.interview import Interview, Question, InterviewStatus
from src.models.evaluation import Answer, SpeechMetrics, Evaluation
from src.services.ai_service import get_ai_provider
from src.services.speech_service import calculate_speech_metrics

logger = logging.getLogger("synterview")


async def process_and_evaluate_answer(
    db: Session,
    interview: Interview,
    question: Question,
    answer_text: Optional[str],
    transcript: Optional[str],
    duration_seconds: float,
    segments: Optional[list] = None
) -> Dict[str, Any]:
    # Determine effective text for evaluation
    effective_answer = (transcript or answer_text or "").strip()

    # Calculate speech metrics
    metrics_data = calculate_speech_metrics(
        transcript=effective_answer,
        segments=segments,
        duration_seconds=duration_seconds
    )

    # Evaluate answer with AI provider (or FallbackProvider)
    ai_provider = get_ai_provider()
    eval_data = await ai_provider.evaluate_answer(
        question=question.text,
        answer=effective_answer,
        role=interview.role,
        experience=interview.experience,
        difficulty=interview.difficulty,
        interview_type=interview.interview_type,
        speech_metrics=metrics_data
    )

    # Store Answer record in DB
    db_answer = Answer(
        interview_id=interview.id,
        question_id=question.id,
        text=answer_text,
        transcript=transcript,
        audio_path=None,  # temp audio is deleted after transcription
        duration_seconds=metrics_data["duration_seconds"]
    )
    db.add(db_answer)
    db.flush()

    # Store SpeechMetrics record
    db_speech = SpeechMetrics(
        answer_id=db_answer.id,
        total_words=metrics_data["total_words"],
        duration_seconds=metrics_data["duration_seconds"],
        words_per_minute=metrics_data["words_per_minute"],
        filler_words=metrics_data["filler_words"],
        filler_rate=metrics_data["filler_rate"],
        repeated_words=metrics_data["repeated_words"],
        pause_count=metrics_data["pause_count"],
        long_pause_count=metrics_data["long_pause_count"],
        average_pause_seconds=metrics_data["average_pause_seconds"],
        longest_pause_seconds=metrics_data["longest_pause_seconds"]
    )
    db.add(db_speech)

    # Store Evaluation record
    db_eval = Evaluation(
        answer_id=db_answer.id,
        technical_score=eval_data.get("technicalScore", 0),
        relevance_score=eval_data.get("relevanceScore", 0),
        clarity_score=eval_data.get("clarityScore", 0),
        communication_score=eval_data.get("communicationScore", 0),
        confidence_score=eval_data.get("confidenceScore", 0),
        overall_score=eval_data.get("overallScore", 0),
        feedback=eval_data.get("feedback", ""),
        strengths=json.dumps(eval_data.get("strengths", [])),
        improvements=json.dumps(eval_data.get("improvements", []))
    )
    db.add(db_eval)

    # Atomically claim this question slot so concurrent submissions cannot both answer it
    expected_index = interview.current_question_index
    claimed = db.query(Interview).filter(
        Interview.id == interview.id,
        Interview.current_question_index == expected_index
    ).update({Interview.current_question_index: expected_index + 1}, synchronize_session=False)
    if not claimed:
        db.rollback()
        raise APIException(
            status.HTTP_409_CONFLICT,
            "ANSWER_ALREADY_SUBMITTED",
            "This question has already been answered"
        )
    db.refresh(interview)
    total_q = len(interview.questions)

    completed = False
    next_q = None

    if interview.current_question_index >= total_q:
        interview.status = InterviewStatus.COMPLETED
        from datetime import datetime, timezone
        interview.completed_at = datetime.now(timezone.utc)
        completed = True
    else:
        # Fetch next question
        sorted_qs = sorted(interview.questions, key=lambda q: q.order)
        next_q = sorted_qs[interview.current_question_index]

    db.commit()
    db.refresh(interview)

    logger.info(f"[EVALUATION] Scored answer ({len(effective_answer)} chars): {eval_data.get('overallScore')}")

    return {
        "completed": completed,
        "transcript": effective_answer,
        "evaluation": {
            "technicalScore": db_eval.technical_score,
            "relevanceScore": db_eval.relevance_score,
            "clarityScore": db_eval.clarity_score,
            "communicationScore": db_eval.communication_score,
            "confidenceScore": db_eval.confidence_score,
            "overallScore": db_eval.overall_score,
            "feedback": db_eval.feedback,
            "strengths": json.loads(db_eval.strengths or "[]"),
            "improvements": json.loads(db_eval.improvements or "[]")
        },
        "speechMetrics": {
            "totalWords": db_speech.total_words,
            "durationSeconds": db_speech.duration_seconds,
            "wordsPerMinute": db_speech.words_per_minute,
            "fillerWords": db_speech.filler_words,
            "fillerRate": db_speech.filler_rate,
            "repeatedWords": db_speech.repeated_words,
            "pauseCount": db_speech.pause_count,
            "longPauseCount": db_speech.long_pause_count,
            "averagePauseSeconds": db_speech.average_pause_seconds,
            "longestPauseSeconds": db_speech.longest_pause_seconds
        },
        "nextQuestion": next_q
    }
