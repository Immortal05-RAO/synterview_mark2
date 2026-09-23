from typing import List, Optional
from pydantic import BaseModel
from src.schemas.interview import SpeechMetricsSchema, EvaluationSchema


class QuestionResult(BaseModel):
    questionNumber: int
    questionText: str
    answerText: Optional[str] = ""
    transcript: Optional[str] = ""
    audioSubmitted: bool = False
    evaluation: EvaluationSchema
    speechMetrics: SpeechMetricsSchema


class ReportData(BaseModel):
    overallScore: int
    technicalScore: int
    communicationScore: int
    relevanceScore: int
    clarityScore: int
    confidenceScore: int
    speechMetrics: SpeechMetricsSchema
    questionResults: List[QuestionResult]
    strengths: List[str]
    improvements: List[str]
    recommendations: List[str]
    durationSeconds: float = 0.0
    role: str
    interviewType: str


class ReportResponse(BaseModel):
    success: bool = True
    report: ReportData
