import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class InterviewStatus:
    CREATED = "CREATED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    role = Column(String, nullable=False)
    experience = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    interview_type = Column(String, nullable=False)
    number_of_questions = Column(Integer, default=5)

    status = Column(String, default=InterviewStatus.CREATED, nullable=False)
    current_question_index = Column(Integer, default=0)
    overall_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan", order_by="Question.order")
    answers = relationship("Answer", back_populates="interview", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False, index=True)

    text = Column(String, nullable=False)
    category = Column(String, default="General")
    difficulty = Column(String, default="Medium")
    order = Column(Integer, nullable=False)

    interview = relationship("Interview", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")
