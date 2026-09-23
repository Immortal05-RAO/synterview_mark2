from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class InterviewCreate(BaseModel):
    role: str = Field(..., json_schema_extra={"example": "Software Engineer"})
    experience: str = Field("Fresher", json_schema_extra={"example": "Fresher"})
    difficulty: str = Field("Medium", json_schema_extra={"example": "Medium"})
    interviewType: str = Field("Technical", json_schema_extra={"example": "Technical"})
    numberOfQuestions: int = Field(5, ge=1, le=10)


class QuestionOut(BaseModel):
    id: str
    text: str
    category: Optional[str] = "Technical"
    difficulty: Optional[str] = "Medium"

    model_config = ConfigDict(from_attributes=True)


class InterviewDetail(BaseModel):
    id: str
    role: str
    experience: str
    difficulty: str
    interviewType: str
    numberOfQuestions: int
    status: str
    currentQuestionIndex: Optional[int] = 0
    overallScore: Optional[float] = None
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewCreateResponse(BaseModel):
    success: bool = True
    interview: InterviewDetail


class StartInterviewResponse(BaseModel):
    success: bool = True
    interviewId: str
    questionNumber: int
    totalQuestions: int
    question: QuestionOut


class CurrentQuestionResponse(BaseModel):
    success: bool = True
    questionNumber: int
    totalQuestions: int
    question: QuestionOut


class SpeechMetricsSchema(BaseModel):
    totalWords: int = 0
    durationSeconds: float = 0.0
    wordsPerMinute: float = 0.0
    fillerWords: int = 0
    fillerRate: float = 0.0
    repeatedWords: int = 0
    pauseCount: int = 0
    longPauseCount: int = 0
    averagePauseSeconds: float = 0.0
    longestPauseSeconds: float = 0.0


class EvaluationSchema(BaseModel):
    technicalScore: int = 0
    relevanceScore: int = 0
    clarityScore: int = 0
    communicationScore: int = 0
    confidenceScore: int = 0
    overallScore: int = 0
    feedback: str = ""
    strengths: List[str] = []
    improvements: List[str] = []


class SubmitAnswerResponse(BaseModel):
    success: bool = True
    completed: bool = False
    evaluation: EvaluationSchema
    speechMetrics: Optional[SpeechMetricsSchema] = None
    nextQuestion: Optional[QuestionOut] = None
    transcript: Optional[str] = None
    message: Optional[str] = None


class InterviewListItem(BaseModel):
    id: str
    role: str
    interviewType: str
    score: Optional[float] = None
    status: str
    createdAt: datetime


class InterviewListResponse(BaseModel):
    success: bool = True
    interviews: List[InterviewListItem]


class HintRequest(BaseModel):
    question_id: str
    hint_level: int = Field(1, ge=1, le=5)


class HintResponse(BaseModel):
    success: bool = True
    hint: str
    hint_level: int
    total_hints: int = 5


class IdealAnswerRequest(BaseModel):
    question_id: str


class IdealAnswerResponse(BaseModel):
    success: bool = True
    ideal_answer: str

