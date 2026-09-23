import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False, index=True)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False, index=True)

    text = Column(Text, nullable=True)
    transcript = Column(Text, nullable=True)
    audio_path = Column(String, nullable=True)
    duration_seconds = Column(Float, default=0.0)

    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    interview = relationship("Interview", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    speech_metrics = relationship("SpeechMetrics", back_populates="answer", uselist=False, cascade="all, delete-orphan")
    evaluation = relationship("Evaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class SpeechMetrics(Base):
    __tablename__ = "speech_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    answer_id = Column(String, ForeignKey("answers.id"), nullable=False, index=True)

    total_words = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    words_per_minute = Column(Float, default=0.0)

    filler_words = Column(Integer, default=0)
    filler_rate = Column(Float, default=0.0)
    repeated_words = Column(Integer, default=0)

    pause_count = Column(Integer, default=0)
    long_pause_count = Column(Integer, default=0)
    average_pause_seconds = Column(Float, default=0.0)
    longest_pause_seconds = Column(Float, default=0.0)

    answer = relationship("Answer", back_populates="speech_metrics")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    answer_id = Column(String, ForeignKey("answers.id"), nullable=False, index=True)

    technical_score = Column(Integer, default=0)
    relevance_score = Column(Integer, default=0)
    clarity_score = Column(Integer, default=0)
    communication_score = Column(Integer, default=0)
    confidence_score = Column(Integer, default=0)
    overall_score = Column(Integer, default=0)

    feedback = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)     # JSON serialized list
    improvements = Column(Text, nullable=True)  # JSON serialized list

    answer = relationship("Answer", back_populates="evaluation")
