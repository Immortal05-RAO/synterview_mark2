import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Clock, X, Users, AlertCircle } from 'lucide-react';
import { CandidatePanel } from '../components/room/CandidatePanel';
import { AIInterviewer } from '../components/room/AIInterviewer';
import { LiveScoring } from '../components/room/LiveScoring';
import { TextAnswerModal } from '../components/room/TextAnswerModal';
import { AnswerHintModal } from '../components/room/AnswerHintModal';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useAuth } from '../context/AuthContext';
import { interviewsApi } from '../api/interviews';
import type { Question, Evaluation, SpeechMetrics } from '../api/interviews';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: 'q1',
    text: 'Explain how database indexing improves query performance.',
    category: 'Databases',
  });
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [roleTitle] = useState('Software Engineer');

  // Evaluation & Speech Data from Backend
  const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);
  const [latestSpeechMetrics, setLatestSpeechMetrics] = useState<SpeechMetrics | null>(null);
  const [latestTranscript, setLatestTranscript] = useState<string | null>(null);

  // AI Feedback feed milestones
  const [feedbackFeed, setFeedbackFeed] = useState<string[]>([
    'Session initialized',
    'Question generated',
  ]);

  // Processing Step State
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'Listening' | 'Thinking' | 'Speaking' | 'Ready'>('Ready');
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(24);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const { speak, cancel: cancelTts, isSpeaking, error: ttsError } = useTextToSpeech();

  const {
    micState,
    setMicState,
    isRecording,
    duration,
    volumeLevel,
    audioDataArray,
    mimeTypeUsed,
    startRecording,
    stopRecording,
    resetRecording,
    error: micError,
  } = useAudioRecorder();

  const {
    transcript: liveFinalTranscript,
    interimTranscript,
    isSupported: isSpeechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const combinedLiveTranscript = (liveFinalTranscript + ' ' + interimTranscript).trim();

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatically speak question when a new question is loaded
  useEffect(() => {
    if (currentQuestion && currentQuestion.text) {
      setAiStatus('Speaking');
      speak(currentQuestion.text, () => {
        setAiStatus('Ready');
      });
    }
    return () => {
      cancelTts();
    };
  }, [currentQuestion.id, currentQuestion.text, speak, cancelTts]);

  // Fetch current active question from backend
  useEffect(() => {
    if (!id || id === 'demo-session-id') return;

    const fetchQuestion = async () => {
      try {
        const res = await interviewsApi.getCurrentQuestion(id);
        if (res.success) {
          setCurrentQuestion(res.question);
          setQuestionNumber(res.questionNumber);
          setTotalQuestions(res.totalQuestions);
        }
      } catch (err) {
        console.warn('Backend question fetch fallback:', err);
      }
    };

    fetchQuestion();
  }, [id]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartAnswering = async () => {
    cancelTts();
    setPipelineError(null);
    setLatestEvaluation(null);
    setLatestSpeechMetrics(null);
    setLatestTranscript(null);
    resetTranscript();
    setAiStatus('Listening');

    const granted = await startRecording();
    if (granted) {
      startListening();
      setFeedbackFeed((prev) => [
        ...prev.filter((f) => !f.includes('Listening')),
        'Candidate started recording',
      ]);
    } else {
      setAiStatus('Ready');
    }
  };

  const handleReplayQuestion = useCallback(() => {
    cancelTts();
    setAiStatus('Speaking');
    speak(currentQuestion.text, () => {
      setAiStatus('Ready');
    });
  }, [cancelTts, speak, currentQuestion.text]);

  const handleStopRecording = async () => {
    stopListening();
    setAiStatus('Thinking');
    setMicState('STOPPING');

    const blob = await stopRecording();

    if (!blob || blob.size === 0) {
      setPipelineError('Could not detect speech in the recording.');
      setAiStatus('Ready');
      setMicState('IDLE');
      return;
    }

    // Step 1: Uploading
    setMicState('UPLOADING');
    setProcessingStep('Uploading response...');

    console.log('[PIPELINE DEBUG] Uploading recorded audio:', {
      sizeBytes: blob.size,
      mimeType: blob.type,
      durationSeconds: duration,
      questionId: currentQuestion.id,
    });

    if (id && id !== 'demo-session-id') {
      try {
        // Step 2: Transcribing
        setMicState('TRANSCRIBING');
        setProcessingStep('Transcribing response...');
        setFeedbackFeed((prev) => [...prev, 'Uploaded audio to STT server']);

        const res = await interviewsApi.submitAnswer(id, {
          questionId: currentQuestion.id,
          audioFile: blob,
        });

        // Step 3: Analyzing & Evaluating
        setMicState('EVALUATING');
        setProcessingStep('Analyzing response...');

        if (res.success && res.evaluation) {
          setLatestEvaluation(res.evaluation);
          if (res.speechMetrics) setLatestSpeechMetrics(res.speechMetrics);
          if (res.transcript) setLatestTranscript(res.transcript);

          setFeedbackFeed((prev) => [
            ...prev,
            '✓ Response transcribed by STT',
            '✓ Speech metrics calculated',
            `✓ Answer evaluated (Score: ${res.evaluation.overallScore}/100)`,
          ]);

          setMicState('COMPLETED');
          setProcessingStep('Evaluation complete');

          if (res.completed) {
            setTimeout(() => navigate(`/interview/${id}/complete`), 2500);
          } else if (res.nextQuestion) {
            setTimeout(() => {
              setCurrentQuestion(res.nextQuestion!);
              setQuestionNumber((prev) => prev + 1);
              setProcessingStep(null);
              resetRecording();
              resetTranscript();
            }, 4000);
          }
        }
      } catch (err: any) {
        console.error('[PIPELINE ERROR] Audio submission failed:', err);
        const errMsg = err?.response?.data?.message || err?.message || 'Could not detect speech in the recording.';
        setPipelineError(errMsg);
        setProcessingStep(null);
        setAiStatus('Ready');
        setMicState('ERROR');
      }
    } else {
      // Demo session flow with local whisper / fallback processing
      handleFallbackEvaluation(combinedLiveTranscript || 'Database indexing improves query performance by allowing efficient lookups.');
    }
  };

  const handleTextAnswerSubmit = async (text: string) => {
    cancelTts();
    setAiStatus('Thinking');
    setMicState('UPLOADING');
    setProcessingStep('Uploading response...');

    if (id && id !== 'demo-session-id') {
      try {
        setMicState('TRANSCRIBING');
        setProcessingStep('Transcribing response...');

        const res = await interviewsApi.submitAnswer(id, {
          questionId: currentQuestion.id,
          answer: text,
        });

        setMicState('EVALUATING');
        setProcessingStep('Analyzing response...');

        if (res.success && res.evaluation) {
          setLatestEvaluation(res.evaluation);
          if (res.speechMetrics) setLatestSpeechMetrics(res.speechMetrics);
          setLatestTranscript(res.transcript || text);

          setFeedbackFeed((prev) => [
            ...prev,
            '✓ Text response submitted',
            `✓ Answer evaluated (Score: ${res.evaluation.overallScore}/100)`,
          ]);

          setMicState('COMPLETED');
          setProcessingStep('Evaluation complete');

          if (res.completed) {
            setTimeout(() => navigate(`/interview/${id}/complete`), 2500);
          } else if (res.nextQuestion) {
            setTimeout(() => {
              setCurrentQuestion(res.nextQuestion!);
              setQuestionNumber((prev) => prev + 1);
              setProcessingStep(null);
              resetRecording();
              resetTranscript();
            }, 4000);
          }
        }
      } catch (e: any) {
        console.error('[PIPELINE ERROR] Text submission failed:', e);
        const errMsg = e?.response?.data?.message || 'Evaluation failed for text answer.';
        setPipelineError(errMsg);
        setProcessingStep(null);
        setAiStatus('Ready');
        setMicState('ERROR');
      }
    } else {
      handleFallbackEvaluation(text);
    }
  };

  const handleFallbackEvaluation = (ansText: string) => {
    setLatestTranscript(ansText);
    setAiStatus('Ready');
    setMicState('COMPLETED');

    setFeedbackFeed((prev) => [
      ...prev,
      '✓ Audio recorded',
      '✓ Answer evaluated',
    ]);

    if (questionNumber >= totalQuestions) {
      setTimeout(() => navigate(`/interview/${id || 'demo-session-id'}/complete`), 2500);
    } else {
      setTimeout(() => {
        setQuestionNumber((prev) => prev + 1);
        setCurrentQuestion({
          id: `q${questionNumber + 1}`,
          text: 'Explain how database indexing improves query performance.',
          category: 'Databases',
        });
        setProcessingStep(null);
        resetRecording();
        resetTranscript();
      }, 4000);
    }
  };

  const getSessionStateText = () => {
    if (processingStep) return processingStep;
    if (isSpeaking) return 'AI Speaking...';
    if (isRecording) return 'Recording...';
    if (micState === 'MIC_READY') return 'Microphone Ready';
    if (micState === 'COMPLETED') return 'Evaluated';
    return 'Waiting';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 font-sans select-none">
      {/* Top Navbar matching Image 3 */}
      <header className="bg-slate-800/90 backdrop-blur-md rounded-2xl px-6 py-3 border border-slate-700/80 flex items-center justify-between mb-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <Mic className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">SYNTERVIEW</span>
          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">AI</span>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-semibold text-slate-300">
            Mock Interview Session: {roleTitle}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-700/60 px-3 py-1.5 rounded-xl border border-slate-600/60 flex items-center gap-1.5 font-mono text-slate-200">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>{formatTimer(sessionTimer)}</span>
          </div>

          <div className="bg-slate-700/60 px-3 py-1.5 rounded-xl border border-slate-600/60 font-semibold text-slate-300">
            Q {questionNumber} / {totalQuestions}
          </div>

          <div className="bg-slate-700/60 px-3 py-1.5 rounded-xl border border-slate-600/60 flex items-center gap-1.5 text-slate-300">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Ideal Interviewer</span>
          </div>

          <button
            onClick={() => {
              cancelTts();
              navigate('/dashboard');
            }}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all shadow-md"
          >
            <X className="w-4 h-4" />
            <span>End Interview</span>
          </button>
        </div>
      </header>

      {/* Pipeline Error / TTS Warning Banner */}
      {(pipelineError || ttsError) && (
        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{pipelineError || ttsError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartAnswering}
              className="px-3 py-1 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold rounded-lg text-xs"
            >
              Try Again
            </button>
            <button
              onClick={() => setIsTextModalOpen(true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold rounded-lg text-xs"
            >
              Answer with Text
            </button>
          </div>
        </div>
      )}

      {/* 3 Column Major Layout matching Image 3 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-4 min-h-[580px]">
        {/* Left Column: Candidate Panel (30%) */}
        <div className="lg:col-span-3">
          <CandidatePanel
            candidateName={user?.name || 'Candidate'}
            micState={micState}
            isRecording={isRecording}
            recordingDuration={duration}
            volumeLevel={volumeLevel}
            audioDataArray={audioDataArray}
            mimeTypeUsed={mimeTypeUsed}
            onStartAnswering={handleStartAnswering}
            onStopRecording={handleStopRecording}
            onOpenTextModal={() => setIsTextModalOpen(true)}
            onLeaveSession={() => {
              cancelTts();
              navigate('/dashboard');
            }}
            sessionStateText={getSessionStateText()}
            errorMessage={micError}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Center Column: AI Interviewer (40%) */}
        <div className="lg:col-span-4">
          <AIInterviewer
            questionText={currentQuestion.text}
            category={currentQuestion.category}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            status={aiStatus}
            onReplayQuestion={handleReplayQuestion}
            isSpeaking={isSpeaking}
            isRecording={isRecording}
            liveTranscript={combinedLiveTranscript}
            finalTranscript={latestTranscript}
            isSpeechRecognitionSupported={isSpeechRecognitionSupported}
            feedbackFeed={feedbackFeed}
            backendFeedback={latestEvaluation?.feedback}
          />
        </div>

        {/* Right Column: Live Scoring (30%) */}
        <div className="lg:col-span-3">
          <LiveScoring
            evaluation={latestEvaluation}
            speechMetrics={latestSpeechMetrics}
            transcriptText={latestTranscript}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            onRevealIdealAnswer={() => setIsHintModalOpen(true)}
            onSubmitResponse={() => {
              if (isRecording) {
                handleStopRecording();
              } else {
                setIsTextModalOpen(true);
              }
            }}
            isSubmitting={!!processingStep}
            canSubmit={!isSpeaking && (isRecording || getSessionStateText() === 'Waiting' || getSessionStateText() === 'Microphone Ready')}
            processingStep={processingStep}
          />
        </div>
      </div>

      {/* Text Modal Fallback */}
      <TextAnswerModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onSubmitText={handleTextAnswerSubmit}
        questionText={currentQuestion.text}
      />

      {/* Answer Hint Modal */}
      <AnswerHintModal
        isOpen={isHintModalOpen}
        onClose={() => setIsHintModalOpen(false)}
        interviewId={id || 'demo-session-id'}
        questionId={currentQuestion.id}
        questionText={currentQuestion.text}
      />
    </div>
  );
};
