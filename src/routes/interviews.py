import os
import uuid
import logging
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Form, UploadFile, File, Request, status
from sqlalchemy.orm import Session

from src.config import settings
from src.database import get_db
from src.models.user import User
from src.models.interview import Interview, Question, InterviewStatus
from src.schemas.interview import (
    InterviewCreate,
    InterviewCreateResponse,
    InterviewDetail,
    StartInterviewResponse,
    CurrentQuestionResponse,
    SubmitAnswerResponse,
    InterviewListResponse,
    InterviewListItem,
    QuestionOut,
    SpeechMetricsSchema,
    EvaluationSchema,
    HintRequest,
    HintResponse,
    IdealAnswerRequest,
    IdealAnswerResponse
)
from src.schemas.report import ReportResponse, ReportData
from src.services.auth_service import get_current_user
from src.services.ai_service import get_ai_provider
from src.services.speech_provider import get_speech_provider
from src.services.evaluation_service import process_and_evaluate_answer
from src.services.report_service import generate_interview_report
from src.middleware.error_handler import APIException

logger = logging.getLogger("synterview")

ALLOWED_AUDIO_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a", ".mp4", ".ogg", ".oga", ".flac"}

def _parse_duration(value) -> float:
    try:
        return max(0.0, min(float(value), 3600.0))
    except (TypeError, ValueError):
        return 0.0


router = APIRouter(prefix="/api/interviews", tags=["Interviews"])


@router.post("", response_model=InterviewCreateResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = Interview(
        user_id=current_user.id,
        role=data.role,
        experience=data.experience,
        difficulty=data.difficulty,
        interview_type=data.interviewType,
        number_of_questions=data.numberOfQuestions,
        status=InterviewStatus.CREATED,
        current_question_index=0
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    return InterviewCreateResponse(
        success=True,
        interview=InterviewDetail(
            id=interview.id,
            role=interview.role,
            experience=interview.experience,
            difficulty=interview.difficulty,
            interviewType=interview.interview_type,
            numberOfQuestions=interview.number_of_questions,
            status=interview.status,
            currentQuestionIndex=interview.current_question_index,
            overallScore=interview.overall_score,
            createdAt=interview.created_at
        )
    )


@router.post("/{interview_id}/start", response_model=StartInterviewResponse)
async def start_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise APIException(status.HTTP_404_NOT_FOUND, "INTERVIEW_NOT_FOUND", "Interview not found")

    # Generate questions if not already generated
    if not interview.questions:
        ai_provider = get_ai_provider()
        generated_qs = await ai_provider.generate_questions(
            role=interview.role,
            experience=interview.experience,
            difficulty=interview.difficulty,
            interview_type=interview.interview_type,
            count=interview.number_of_questions,
            previous_questions=[]
        )

        generated_qs = (generated_qs or [])[:interview.number_of_questions]

        for idx, q_data in enumerate(generated_qs, start=1):
            question = Question(
                interview_id=interview.id,
                text=q_data.get("text", f"Question {idx}"),
                category=q_data.get("category", "General"),
                difficulty=q_data.get("difficulty", interview.difficulty),
                order=idx
            )
            db.add(question)

        db.commit()

    interview.status = InterviewStatus.IN_PROGRESS
    interview.started_at = datetime.now(timezone.utc)
    interview.current_question_index = 0
    db.commit()
    db.refresh(interview)

    first_question = sorted(interview.questions, key=lambda q: q.order)[0]

    return StartInterviewResponse(
        success=True,
        interviewId=interview.id,
        questionNumber=1,
        totalQuestions=len(interview.questions),
        question=QuestionOut(
            id=first_question.id,
            text=first_question.text,
            category=first_question.category,
            difficulty=first_question.difficulty
        )
    )


@router.get("/{interview_id}/current", response_model=CurrentQuestionResponse)
def get_current_question(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise APIException(status.HTTP_404_NOT_FOUND, "INTERVIEW_NOT_FOUND", "Interview not found")

    if not interview.questions:
        raise APIException(status.HTTP_400_BAD_REQUEST, "INTERVIEW_NOT_STARTED", "Interview questions have not been generated yet")

    sorted_qs = sorted(interview.questions, key=lambda q: q.order)
    current_idx = interview.current_question_index

    if current_idx >= len(sorted_qs):
        raise APIException(status.HTTP_400_BAD_REQUEST, "INTERVIEW_ALREADY_COMPLETED", "Interview is already completed")

    current_q = sorted_qs[current_idx]

    return CurrentQuestionResponse(
        success=True,
        questionNumber=current_idx + 1,
        totalQuestions=len(sorted_qs),
        question=QuestionOut(
            id=current_q.id,
            text=current_q.text,
            category=current_q.category,
            difficulty=current_q.difficulty
        )
    )


@router.post("/{interview_id}/answer", response_model=SubmitAnswerResponse)
async def submit_answer(
    interview_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise APIException(status.HTTP_404_NOT_FOUND, "INTERVIEW_NOT_FOUND", "Interview not found")

    if interview.status == InterviewStatus.COMPLETED:
        raise APIException(status.HTTP_400_BAD_REQUEST, "INTERVIEW_COMPLETED", "Interview is already completed")

    sorted_qs = sorted(interview.questions, key=lambda q: q.order)
    if interview.current_question_index >= len(sorted_qs):
        raise APIException(status.HTTP_400_BAD_REQUEST, "NO_MORE_QUESTIONS", "All questions have been answered")

    current_q = sorted_qs[interview.current_question_index]

    question_id = None
    answer_text = None
    transcript_text = None
    duration_seconds = 0.0
    client_duration = 0.0
    segments = []

    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        question_id = form.get("questionId")
        answer_text = form.get("answer")
        audio_file: Optional[UploadFile] = form.get("audio")
        client_duration = _parse_duration(form.get("durationSeconds"))

        if audio_file:
            content = await audio_file.read()
            max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
            if len(content) > max_bytes:
                raise APIException(
                    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    "AUDIO_TOO_LARGE",
                    f"Audio file exceeds the {settings.MAX_UPLOAD_MB} MB limit"
                )

            # Never use the client-supplied filename for the path; keep only a safe extension
            ext = os.path.splitext(os.path.basename(audio_file.filename or ""))[1].lower()
            if ext not in ALLOWED_AUDIO_EXTENSIONS:
                ext = ".webm"
            temp_path = os.path.join(settings.UPLOAD_DIR, f"{uuid.uuid4()}{ext}")

            with open(temp_path, "wb") as f:
                f.write(content)

            logger.info(f"[AUDIO] Received audio upload ({len(content)} bytes)")

            # Process with STT Provider
            try:
                speech_provider = get_speech_provider()
                stt_result = await speech_provider.transcribe_audio(temp_path)
                transcript_text = stt_result.get("transcript", "")
                duration_seconds = stt_result.get("duration_seconds", 0.0)
                segments = stt_result.get("segments", [])
                logger.info(f"[STT] Extracted {len(transcript_text)} chars (duration: {duration_seconds}s)")
            finally:
                # Always clean up temporary audio file after processing
                if os.path.exists(temp_path):
                    try:
                        os.unlink(temp_path)
                    except Exception as e:
                        logger.warning(f"Could not remove temp audio file {temp_path}: {e}")
    else:
        # Process JSON text answer
        try:
            body = await request.json()
            question_id = body.get("questionId")
            answer_text = body.get("answer")
            client_duration = _parse_duration(body.get("durationSeconds"))
        except Exception:
            raise APIException(status.HTTP_400_BAD_REQUEST, "INVALID_REQUEST_BODY", "Invalid JSON request body")

    # Server-side STT may be unavailable; fall back to the duration measured by the client
    if not duration_seconds and client_duration:
        duration_seconds = client_duration

    if not (answer_text or "").strip() and not (transcript_text or "").strip():
        raise APIException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "NO_SPEECH_DETECTED",
            "Could not detect speech in the recording."
        )

    # Process & evaluate answer
    eval_result = await process_and_evaluate_answer(
        db=db,
        interview=interview,
        question=current_q,
        answer_text=answer_text,
        transcript=transcript_text,
        duration_seconds=duration_seconds,
        segments=segments
    )

    next_question_out = None
    if eval_result.get("nextQuestion"):
        nq = eval_result["nextQuestion"]
        next_question_out = QuestionOut(
            id=nq.id,
            text=nq.text,
            category=nq.category,
            difficulty=nq.difficulty
        )

    return SubmitAnswerResponse(
        success=True,
        completed=eval_result["completed"],
        evaluation=EvaluationSchema(**eval_result["evaluation"]),
        speechMetrics=SpeechMetricsSchema(**eval_result["speechMetrics"]),
        nextQuestion=next_question_out,
        transcript=eval_result.get("transcript"),
        message="Interview completed" if eval_result["completed"] else None
    )


@router.get("/{interview_id}/report", response_model=ReportResponse)
def get_interview_report(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise APIException(status.HTTP_404_NOT_FOUND, "INTERVIEW_NOT_FOUND", "Interview not found")

    report_data = generate_interview_report(db, interview)
    return ReportResponse(
        success=True,
        report=ReportData(**report_data)
    )


@router.get("", response_model=InterviewListResponse)
def list_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.desc())
        .all()
    )

    items = [
        InterviewListItem(
            id=i.id,
            role=i.role,
            interviewType=i.interview_type,
            score=i.overall_score,
            status=i.status,
            createdAt=i.created_at
        )
        for i in interviews
    ]

    return InterviewListResponse(success=True, interviews=items)


@router.get("/{interview_id}", response_model=InterviewCreateResponse)
def get_interview_detail(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise APIException(status.HTTP_404_NOT_FOUND, "INTERVIEW_NOT_FOUND", "Interview not found")

    return InterviewCreateResponse(
        success=True,
        interview=InterviewDetail(
            id=interview.id,
            role=interview.role,
            experience=interview.experience,
            difficulty=interview.difficulty,
            interviewType=interview.interview_type,
            numberOfQuestions=interview.number_of_questions,
            status=interview.status,
            currentQuestionIndex=interview.current_question_index,
            overallScore=interview.overall_score,
            createdAt=interview.created_at
        )
    )


@router.delete("/{interview_id}")
def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise APIException(status.HTTP_404_NOT_FOUND, "INTERVIEW_NOT_FOUND", "Interview not found")

    db.delete(interview)
    db.commit()

    return {"success": True, "message": "Interview deleted successfully"}


@router.post("/{interview_id}/hint", response_model=HintResponse)
async def get_question_hint(
    interview_id: str,
    payload: HintRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise APIException(status.HTTP_404_NOT_FOUND, "INTERVIEW_NOT_FOUND", "Interview not found")

    question = db.query(Question).filter(
        Question.id == payload.question_id,
        Question.interview_id == interview.id
    ).first()

    # Fallback to current question if ID not found directly
    if not question:
        questions = sorted(interview.questions, key=lambda q: q.order)
        if interview.current_question_index < len(questions):
            question = questions[interview.current_question_index]
        else:
            question = questions[0] if questions else None

    question_text = question.text if question else "Explain how you approach complex software engineering challenges."

    ai_provider = get_ai_provider()
    res = await ai_provider.generate_hint(
        question=question_text,
        hint_level=payload.hint_level,
        role=interview.role,
        experience=interview.experience,
        difficulty=interview.difficulty,
        interview_type=interview.interview_type
    )

    return HintResponse(
        success=True,
        hint=res.get("hint", "Focus on defining core requirements first."),
        hint_level=res.get("hint_level", payload.hint_level),
        total_hints=res.get("total_hints", 5)
    )


@router.post("/{interview_id}/ideal-answer", response_model=IdealAnswerResponse)
async def get_question_ideal_answer(
    interview_id: str,
    payload: IdealAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise APIException(status.HTTP_404_NOT_FOUND, "INTERVIEW_NOT_FOUND", "Interview not found")

    question = db.query(Question).filter(
        Question.id == payload.question_id,
        Question.interview_id == interview.id
    ).first()

    if not question:
        questions = sorted(interview.questions, key=lambda q: q.order)
        if interview.current_question_index < len(questions):
            question = questions[interview.current_question_index]
        else:
            question = questions[0] if questions else None

    question_text = question.text if question else "Explain how you approach complex software engineering challenges."

    ai_provider = get_ai_provider()
    res = await ai_provider.generate_ideal_answer(
        question=question_text,
        role=interview.role,
        experience=interview.experience,
        difficulty=interview.difficulty,
        interview_type=interview.interview_type
    )

    return IdealAnswerResponse(
        success=True,
        ideal_answer=res.get("ideal_answer", "A strong answer starts with clear problem definition and architectural principles.")
    )

