import { apiClient } from './client';

export interface Question {
  id: string;
  text: string;
  category?: string;
  difficulty?: string;
}

export interface InterviewConfig {
  id: string;
  role: string;
  experience: string;
  difficulty: string;
  interviewType: string;
  numberOfQuestions: number;
  status: string;
  currentQuestionIndex?: number;
  overallScore?: number;
  createdAt: string;
}

export interface SpeechMetrics {
  totalWords: number;
  durationSeconds: number;
  wordsPerMinute: number;
  fillerWords: number;
  fillerRate: number;
  repeatedWords: number;
  pauseCount: number;
  longPauseCount: number;
  averagePauseSeconds: number;
  longestPauseSeconds: number;
}

export interface Evaluation {
  technicalScore: number;
  relevanceScore: number;
  clarityScore: number;
  communicationScore: number;
  confidenceScore: number;
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface SubmitAnswerResponse {
  success: boolean;
  completed: boolean;
  evaluation: Evaluation;
  speechMetrics?: SpeechMetrics;
  nextQuestion?: Question;
  transcript?: string;
  message?: string;
}

export interface QuestionResult {
  questionNumber: number;
  questionText: string;
  answerText?: string;
  transcript?: string;
  audioSubmitted: boolean;
  evaluation: Evaluation;
  speechMetrics: SpeechMetrics;
}

export interface ReportData {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  relevanceScore: number;
  clarityScore: number;
  confidenceScore: number;
  speechMetrics: SpeechMetrics;
  questionResults: QuestionResult[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  durationSeconds: number;
  role: string;
  interviewType: string;
}

export const interviewsApi = {
  create: async (data: {
    role: string;
    experience: string;
    difficulty: string;
    interviewType: string;
    numberOfQuestions: number;
  }): Promise<{ success: boolean; interview: InterviewConfig }> => {
    const res = await apiClient.post('/interviews', data);
    return res.data;
  },

  start: async (id: string): Promise<{
    success: boolean;
    interviewId: string;
    questionNumber: number;
    totalQuestions: number;
    question: Question;
  }> => {
    const res = await apiClient.post(`/interviews/${id}/start`);
    return res.data;
  },

  getCurrentQuestion: async (id: string): Promise<{
    success: boolean;
    questionNumber: number;
    totalQuestions: number;
    question: Question;
  }> => {
    const res = await apiClient.get(`/interviews/${id}/current`);
    return res.data;
  },

  submitAnswer: async (
    id: string,
    payload: { questionId: string; answer?: string; audioFile?: Blob | File }
  ): Promise<SubmitAnswerResponse> => {
    if (payload.audioFile) {
      const formData = new FormData();
      formData.append('questionId', payload.questionId);
      if (payload.answer) formData.append('answer', payload.answer);
      formData.append('audio', payload.audioFile, 'answer.webm');

      console.log('[UPLOAD DEBUG] Submitting audio FormData to /api/interviews/' + id + '/answer:', {
        questionId: payload.questionId,
        audioSizeBytes: payload.audioFile.size,
        audioMimeType: payload.audioFile.type,
      });

      // Do NOT explicitly set Content-Type header on FormData; browser automatically generates multipart boundary
      const res = await apiClient.post(`/interviews/${id}/answer`, formData);
      return res.data;
    } else {
      const res = await apiClient.post(`/interviews/${id}/answer`, {
        questionId: payload.questionId,
        answer: payload.answer,
      });
      return res.data;
    }
  },

  getReport: async (id: string): Promise<{ success: boolean; report: ReportData }> => {
    const res = await apiClient.get(`/interviews/${id}/report`);
    return res.data;
  },

  list: async (): Promise<{ success: boolean; interviews: InterviewConfig[] }> => {
    const res = await apiClient.get('/interviews');
    return res.data;
  },

  getDetail: async (id: string): Promise<{ success: boolean; interview: InterviewConfig }> => {
    const res = await apiClient.get(`/interviews/${id}`);
    return res.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/interviews/${id}`);
    return res.data;
  },

  getHint: async (
    interviewId: string,
    questionId: string,
    hintLevel: number = 1
  ): Promise<{ success: boolean; hint: string; hint_level: number; total_hints: number }> => {
    const res = await apiClient.post(`/interviews/${interviewId}/hint`, {
      question_id: questionId,
      hint_level: hintLevel,
    });
    return res.data;
  },

  getIdealAnswer: async (
    interviewId: string,
    questionId: string
  ): Promise<{ success: boolean; ideal_answer: string }> => {
    const res = await apiClient.post(`/interviews/${interviewId}/ideal-answer`, {
      question_id: questionId,
    });
    return res.data;
  },
};

