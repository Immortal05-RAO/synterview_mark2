import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Clock, X, AlertCircle } from 'lucide-react';
import { CandidatePanel } from '../components/room/CandidatePanel';
import { AIInterviewer } from '../components/room/AIInterviewer';
import { LiveScoring } from '../components/room/LiveScoring';
import { TextAnswerModal } from '../components/room/TextAnswerModal';
import { AnswerHintModal } from '../components/room/AnswerHintModal';
import { VoiceSelector } from '../components/room/VoiceSelector';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useAuth } from '../context/AuthContext';
import { interviewsApi } from '../api/interviews';
import type { Question, Evaluation, SpeechMetrics } from '../api/interviews';
import { getApiError } from '../utils/apiError';

type Phase = 'idle' | 'speaking' | 'listening' | 'processing' | 'paused' | 'finished';

// Hands-free turn taking: the answer ends once the candidate has spoken and then gone quiet.
const SILENCE_MS = 2500;
const MAX_ANSWER_MS = 150_000;
const NO_SPEECH_TIMEOUT_MS = 20_000;
const VOLUME_THRESHOLD = 10;
const MAX_NO_SPEECH_RETRIES = 2;

// Short spoken reaction to the answer so the conversation feels continuous
const buildAcknowledgement = (evaluation: Evaluation): string => {
  const score = evaluation.overallScore;
  const opener = score >= 80 ? 'Great answer.' : score >= 60 ? 'Thanks, that was a solid answer.' : 'Okay, thank you.';
  const tip = evaluation.improvements?.[0];
  const trimmedTip = tip && tip.length <= 120 ? ` One thing to work on: ${tip.replace(/\.$/, '')}.` : '';
  return `${opener}${trimmedTip} Next question.`;
};

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [roleTitle, setRoleTitle] = useState('');

  const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);
  const [latestSpeechMetrics, setLatestSpeechMetrics] = useState<SpeechMetrics | null>(null);
  const [latestTranscript, setLatestTranscript] = useState<string | null>(null);
  const [feedbackFeed, setFeedbackFeed] = useState<string[]>(['Session initialized', 'Question generated']);

  const [phase, setPhaseState] = useState<Phase>('idle');
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const phaseRef = useRef<Phase>('idle');
  const questionRef = useRef<Question | null>(null);
  const noSpeechRetriesRef = useRef(0);
  const turnRef = useRef({ start: 0, lastActivity: 0, lastText: '', speechMs: 0 });

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const { speak, cancel: cancelTts, isSpeaking, error: ttsError, voiceGender, setVoiceGender, voiceName } =
    useTextToSpeech();

  const {
    micState,
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

  // Latest values for the silence monitor, which runs on an interval
  const combinedRef = useRef('');
  const volumeRef = useRef(0);
  combinedRef.current = combinedLiveTranscript;
  volumeRef.current = volumeLevel;

  useEffect(() => {
    const timer = setInterval(() => setSessionTimer((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load the active question (also lets a reloaded page resume mid-interview)
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const [questionRes, detailRes] = await Promise.all([
          interviewsApi.getCurrentQuestion(id),
          interviewsApi.getDetail(id).catch(() => null),
        ]);
        if (questionRes.success) {
          questionRef.current = questionRes.question;
          setCurrentQuestion(questionRes.question);
          setQuestionNumber(questionRes.questionNumber);
          setTotalQuestions(questionRes.totalQuestions);
        }
        if (detailRes?.success) setRoleTitle(detailRes.interview.role);
      } catch (err) {
        const { code, message } = getApiError(err);
        if (code === 'INTERVIEW_ALREADY_COMPLETED') {
          navigate(`/interview/${id}/report`, { replace: true });
          return;
        }
        setLoadError(message);
      }
    };

    load();
  }, [id, navigate]);

  const beginListening = useCallback(async () => {
    resetTranscript();
    setPipelineError(null);
    const now = Date.now();
    turnRef.current = { start: now, lastActivity: now, lastText: '', speechMs: 0 };

    const granted = await startRecording();
    if (!granted) {
      setPhase('paused');
      return;
    }
    startListening();
    setPhase('listening');
  }, [resetTranscript, startRecording, startListening, setPhase]);

  // Speak (optionally with an intro), then automatically start listening for the answer
  const askQuestion = useCallback(
    (question: Question, intro = '') => {
      questionRef.current = question;
      setCurrentQuestion(question);
      setPhase('speaking');
      speak(`${intro} ${question.text}`.trim(), () => {
        if (phaseRef.current === 'speaking') beginListening();
      });
    },
    [speak, beginListening, setPhase]
  );

  const handleNoSpeech = useCallback(() => {
    noSpeechRetriesRef.current += 1;
    if (noSpeechRetriesRef.current > MAX_NO_SPEECH_RETRIES) {
      setPipelineError("I still couldn't hear you. Check your microphone, or type your answer instead.");
      setPhase('paused');
      return;
    }
    setPhase('speaking');
    speak("Sorry, I didn't catch that. Please go ahead and answer again.", () => {
      if (phaseRef.current === 'speaking') beginListening();
    });
  }, [speak, beginListening, setPhase]);

  const submitTurn = useCallback(
    async (payload: { answer?: string; audio?: Blob | null; seconds: number }) => {
      const question = questionRef.current;
      if (!id || !question) return;

      setPhase('processing');
      try {
        const res = await interviewsApi.submitAnswer(id, {
          questionId: question.id,
          answer: payload.answer || undefined,
          audioFile: payload.audio || undefined,
          durationSeconds: payload.seconds,
        });

        noSpeechRetriesRef.current = 0;
        setLatestEvaluation(res.evaluation);
        if (res.speechMetrics) setLatestSpeechMetrics(res.speechMetrics);
        setLatestTranscript(res.transcript || payload.answer || null);
        setFeedbackFeed((prev) => [
          ...prev,
          `✓ Answer ${questionNumber} evaluated (Score: ${res.evaluation.overallScore}/100)`,
        ]);
        resetRecording();
        resetTranscript();

        if (res.completed) {
          setPhase('finished');
          speak('That was the last question. Thank you, I am preparing your report now.', () => {
            navigate(`/interview/${id}/complete`);
          });
        } else if (res.nextQuestion) {
          setQuestionNumber((prev) => prev + 1);
          askQuestion(res.nextQuestion, buildAcknowledgement(res.evaluation));
        }
      } catch (err) {
        const { code, message } = getApiError(err);
        resetRecording();
        if (code === 'NO_SPEECH_DETECTED') {
          handleNoSpeech();
        } else {
          setPipelineError(message);
          setPhase('paused');
        }
      }
    },
    [id, questionNumber, resetRecording, resetTranscript, speak, navigate, askQuestion, handleNoSpeech, setPhase]
  );

  // Called when the silence monitor decides the candidate has finished answering
  const finishAnswer = useCallback(async () => {
    if (phaseRef.current !== 'listening') return;
    setPhase('processing');

    const spoken = combinedRef.current.trim();
    const seconds = Math.max(1, Math.round((Date.now() - turnRef.current.start) / 1000));
    stopListening();
    const blob = await stopRecording();

    if (!blob && !spoken) {
      handleNoSpeech();
      return;
    }
    await submitTurn({ answer: spoken, audio: blob, seconds });
  }, [stopListening, stopRecording, submitTurn, handleNoSpeech, setPhase]);

  // Silence monitor: end the answer once the candidate has spoken and then gone quiet
  useEffect(() => {
    if (phase !== 'listening') return;

    const tick = window.setInterval(() => {
      const turn = turnRef.current;
      const now = Date.now();
      const text = combinedRef.current;

      if (text !== turn.lastText) {
        turn.lastText = text;
        turn.lastActivity = now;
      }
      if (volumeRef.current > VOLUME_THRESHOLD) {
        turn.speechMs += 200;
        turn.lastActivity = now;
      }

      // Volume alone counts as speech too, in case live transcription is unavailable
      const heardSpeech = text.length > 0 || turn.speechMs >= 1500;

      if (heardSpeech && now - turn.lastActivity >= SILENCE_MS) {
        finishAnswer();
      } else if (now - turn.start >= MAX_ANSWER_MS) {
        finishAnswer();
      } else if (!heardSpeech && now - turn.start >= NO_SPEECH_TIMEOUT_MS) {
        finishAnswer();
      }
    }, 200);

    return () => window.clearInterval(tick);
  }, [phase, finishAnswer]);

  // Changing the voice previews it before the interview, or re-reads the current question mid-way
  const firstVoiceRender = useRef(true);
  useEffect(() => {
    if (firstVoiceRender.current) {
      firstVoiceRender.current = false;
      return;
    }
    if (phaseRef.current === 'idle') {
      speak("Hi, I'll be your interviewer today. Let's start whenever you're ready.", () => {});
    } else if (phaseRef.current === 'speaking' && questionRef.current) {
      askQuestion(questionRef.current);
    }
    // Only react to a voice change, not to callback identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceGender]);

  const handleStartInterview = () => {
    if (!currentQuestion) return;
    setFeedbackFeed((prev) => [...prev, 'Voice conversation started']);
    askQuestion(currentQuestion, 'Welcome to your mock interview. Let us begin.');
  };

  const stopEverything = useCallback(() => {
    cancelTts();
    stopListening();
    resetRecording();
  }, [cancelTts, stopListening, resetRecording]);

  const handleTogglePause = () => {
    if (phase === 'paused') {
      setPipelineError(null);
      if (currentQuestion) askQuestion(currentQuestion, 'Let us continue.');
    } else if (phase === 'speaking' || phase === 'listening') {
      stopEverything();
      setPhase('paused');
    }
  };

  const handleReplayQuestion = () => {
    if (!currentQuestion || phase === 'processing' || phase === 'finished') return;
    stopEverything();
    askQuestion(currentQuestion);
  };

  const handleTextAnswerSubmit = async (text: string) => {
    if (phase === 'processing' || phase === 'finished') return;
    stopEverything();
    await submitTurn({ answer: text, seconds: Math.max(1, Math.round(text.split(/\s+/).length / 2.5)) });
  };

  const leave = () => {
    stopEverything();
    navigate('/dashboard');
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const sessionStateText =
    phase === 'speaking'
      ? 'Interviewer speaking'
      : phase === 'listening'
      ? 'Listening to you'
      : phase === 'processing'
      ? 'Evaluating answer'
      : phase === 'paused'
      ? 'Paused'
      : phase === 'finished'
      ? 'Finished'
      : 'Ready to start';

  const aiStatus = phase === 'speaking' ? 'Speaking' : phase === 'listening' ? 'Listening' : phase === 'processing' ? 'Thinking' : 'Ready';
  const bannerMessage = pipelineError || ttsError;

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 flex flex-col font-sans select-none relative">
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-md bg-[#FF6B00] text-white flex items-center justify-center flex-shrink-0">
            <Mic className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900">SYNTERVIEW</span>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-600 truncate">{roleTitle ? `${roleTitle} interview` : 'Mock interview'}</span>
        </div>

        <div className="flex items-center gap-5 text-sm flex-shrink-0">
          <span className="flex items-center gap-1.5 font-mono text-slate-600 w-[64px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {formatTimer(sessionTimer)}
          </span>
          <span className="font-medium text-slate-600">
            Question {questionNumber} of {totalQuestions}
          </span>
          <button
            onClick={leave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
            End interview
          </button>
        </div>
      </header>

      {/* Floating notice: overlays the page so showing/hiding it never shifts the layout */}
      {bannerMessage && (
        <div className="absolute left-1/2 -translate-x-1/2 top-16 z-30 w-[min(720px,calc(100%-2rem))] px-4 py-3 bg-white border border-slate-200 border-l-4 border-l-[#FF6B00] rounded-md text-sm text-slate-700 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {phase === 'paused' && (
              <button
                onClick={handleTogglePause}
                className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-md text-xs"
              >
                Try again
              </button>
            )}
            <button
              onClick={() => setIsTextModalOpen(true)}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-md text-xs"
            >
              Type answer
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-10 gap-5 p-5 overflow-y-auto lg:overflow-hidden">
        <div className="lg:col-span-3 lg:min-h-0 lg:h-full">
          <CandidatePanel
            candidateName={user?.name || 'Candidate'}
            micState={micState}
            isRecording={isRecording}
            recordingDuration={duration}
            volumeLevel={volumeLevel}
            audioDataArray={audioDataArray}
            mimeTypeUsed={mimeTypeUsed}
            isPaused={phase === 'paused'}
            onTogglePause={handleTogglePause}
            onOpenTextModal={() => setIsTextModalOpen(true)}
            onLeaveSession={leave}
            sessionStateText={sessionStateText}
            errorMessage={micError}
            isSpeaking={isSpeaking}
          />
        </div>

        <div className="lg:col-span-4 lg:min-h-0 lg:h-full">
          <AIInterviewer
            questionText={currentQuestion?.text ?? (loadError ? '' : 'Loading your first question...')}
            category={currentQuestion?.category}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            status={aiStatus}
            onReplayQuestion={handleReplayQuestion}
            isSpeaking={isSpeaking}
            isRecording={phase === 'listening'}
            liveTranscript={combinedLiveTranscript}
            finalTranscript={latestTranscript}
            isSpeechRecognitionSupported={isSpeechRecognitionSupported}
            feedbackFeed={feedbackFeed}
            backendFeedback={latestEvaluation?.feedback}
            voiceGender={voiceGender}
            onVoiceGenderChange={setVoiceGender}
            voiceName={voiceName}
          />
        </div>

        <div className="lg:col-span-3 lg:min-h-0 lg:h-full">
          <LiveScoring
            evaluation={latestEvaluation}
            speechMetrics={latestSpeechMetrics}
            transcriptText={latestTranscript}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            onRevealIdealAnswer={() => setIsHintModalOpen(true)}
            processingStep={phase === 'processing' ? 'Evaluating your answer...' : null}
          />
        </div>
      </div>

      {/* Start gate: browsers only allow audio playback and mic access after a user gesture */}
      {phase === 'idle' && (
        <div className="absolute inset-0 z-40 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full shadow-xl">
            {loadError ? (
              <>
                <h2 className="text-lg font-bold text-slate-900">Could not load the interview</h2>
                <p className="text-sm text-slate-500 mt-2">{loadError}</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-6 w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-md text-sm"
                >
                  Back to dashboard
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900">Ready to begin?</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  The interviewer asks each question out loud. Answer naturally and pause when you are finished; the
                  next question follows automatically. Your browser will ask for microphone access.
                </p>
                <div className="mt-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">
                    Choose your interviewer's voice
                  </span>
                  <VoiceSelector value={voiceGender} onChange={setVoiceGender} voiceName={voiceName} />
                </div>
                <button
                  onClick={handleStartInterview}
                  disabled={!currentQuestion}
                  className="mt-5 w-full bg-[#FF6B00] hover:bg-[#E56000] disabled:opacity-50 text-white font-semibold py-2.5 rounded-md text-sm"
                >
                  {currentQuestion ? 'Begin interview' : 'Loading...'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <TextAnswerModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onSubmitText={handleTextAnswerSubmit}
        questionText={currentQuestion?.text ?? ''}
      />

      <AnswerHintModal
        isOpen={isHintModalOpen}
        onClose={() => setIsHintModalOpen(false)}
        interviewId={id ?? ''}
        questionId={currentQuestion?.id ?? ''}
        questionText={currentQuestion?.text ?? ''}
      />
    </div>
  );
};
