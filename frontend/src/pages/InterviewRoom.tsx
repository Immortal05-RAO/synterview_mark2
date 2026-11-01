import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Clock, X, AlertCircle } from 'lucide-react';
import { VideoCallStage } from '../components/room/VideoCallStage';
import { BodyLanguagePanel } from '../components/room/BodyLanguagePanel';
import { LiveScoring } from '../components/room/LiveScoring';
import { TextAnswerModal } from '../components/room/TextAnswerModal';
import { AnswerHintModal } from '../components/room/AnswerHintModal';
import { VoiceSelector } from '../components/room/VoiceSelector';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useBodyLanguage } from '../hooks/useBodyLanguage';
import type { BodySummary } from '../hooks/useBodyLanguage';
import { saveBodyLanguage } from '../utils/bodyLanguageStore';
import { useAuth } from '../context/AuthContext';
import { interviewsApi } from '../api/interviews';
import type { Question, Evaluation, SpeechMetrics } from '../api/interviews';
import { getApiError } from '../utils/apiError';
import {
  INTERVIEWER_NAME,
  buildGreeting,
  buildWarmupReply,
  buildAcknowledgement,
  buildFollowUp,
  buildClosingPrompt,
  buildClosingReply,
} from '../utils/interviewer';

type Phase = 'idle' | 'speaking' | 'listening' | 'processing' | 'paused' | 'finished';
// warmup: greeting and small talk, question: the interview proper, closing: candidate's own questions
type Stage = 'warmup' | 'question' | 'closing';

// Hands-free turn taking: the answer ends once the candidate has spoken and then gone quiet.
const SILENCE_MS = 2500;
const CHAT_SILENCE_MS = 1800; // small talk at the start and end ends sooner than a real answer
const CHAT_NO_SPEECH_MS = 9_000;
const SHORT_ANSWER_WORDS = 22; // shorter answers get one follow-up, like a real interviewer would ask
const THINK_PAUSE_MS = 700;
const MAX_ANSWER_MS = 150_000;
const NO_SPEECH_TIMEOUT_MS = 20_000;
const VOLUME_THRESHOLD = 10;
const MAX_NO_SPEECH_RETRIES = 2;

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

  const [phase, setPhaseState] = useState<Phase>('idle');
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const phaseRef = useRef<Phase>('idle');
  const questionRef = useRef<Question | null>(null);
  const noSpeechRetriesRef = useRef(0);
  const [stage, setStageState] = useState<Stage>('warmup');
  const stageRef = useRef<Stage>('warmup');
  const followUpsRef = useRef(0);
  const answerPartsRef = useRef<string[]>([]);
  const answerSecondsRef = useRef(0);
  const turnRef = useRef({ start: 0, lastActivity: 0, lastText: '', speechMs: 0 });

  // Camera is shared by the self-view and the body language analysis
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const answerSummariesRef = useRef<BodySummary[]>([]);

  const setStage = useCallback((next: Stage) => {
    stageRef.current = next;
    setStageState(next);
  }, []);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const { speak, cancel: cancelTts, isSpeaking, error: ttsError, voiceGender, setVoiceGender, speechLevel } =
    useTextToSpeech();

  const {
    duration,
    volumeLevel,
    startRecording,
    stopRecording,
    resetRecording,
    error: micError,
  } = useAudioRecorder();

  const {
    transcript: liveFinalTranscript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!cameraOn) {
      setCameraStream(null);
      return;
    }
    let cancelled = false;
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        setCameraError(null);
        setCameraStream(s);
      })
      .catch(() => {
        if (cancelled) return;
        setCameraError('Camera unavailable. Check browser permissions.');
        setCameraOn(false);
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraOn]);

  // The <video> mounts after the stream arrives, so attach once both exist
  useEffect(() => {
    const video = videoRef.current;
    if (video && cameraStream && video.srcObject !== cameraStream) {
      video.srcObject = cameraStream;
    }
  }, [cameraStream, cameraOn]);

  const bodyLanguage = useBodyLanguage({
    videoRef,
    enabled: cameraOn && cameraStream !== null,
    collecting: phase === 'listening' && stage === 'question',
  });
  const { takeAnswerSummary, getSessionSummary } = bodyLanguage;

  // Stores this answer's body language so the report can show it
  const recordBodyLanguage = useCallback(() => {
    const summary = takeAnswerSummary();
    if (summary) answerSummariesRef.current = [...answerSummariesRef.current, summary];
    if (id) saveBodyLanguage(id, { answers: answerSummariesRef.current, session: getSessionSummary() });
  }, [id, takeAnswerSummary, getSessionSummary]);

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

  // Speak after a short natural pause, then automatically start listening
  const sayThenListen = useCallback(
    (text: string, pauseMs = THINK_PAUSE_MS) => {
      setPhase('processing');
      window.setTimeout(() => {
        if (phaseRef.current !== 'processing') return; // paused or left in the meantime
        setPhase('speaking');
        speak(text, () => {
          if (phaseRef.current === 'speaking') beginListening();
        });
      }, pauseMs);
    },
    [speak, beginListening, setPhase]
  );

  // Ask a question (optionally after a spoken reaction to the previous answer)
  const askQuestion = useCallback(
    (question: Question, intro = '', pauseMs = THINK_PAUSE_MS) => {
      questionRef.current = question;
      setCurrentQuestion(question);
      setStage('question');
      followUpsRef.current = 0;
      answerPartsRef.current = [];
      answerSecondsRef.current = 0;
      sayThenListen(`${intro} ${question.text}`.trim(), intro ? pauseMs : 0);
    },
    [sayThenListen, setStage]
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
        recordBodyLanguage();
        resetRecording();
        resetTranscript();

        if (res.completed) {
          // Let the candidate ask their own questions before saying goodbye
          setStage('closing');
          sayThenListen(buildClosingPrompt());
        } else if (res.nextQuestion) {
          setQuestionNumber((prev) => prev + 1);
          const isLast = questionNumber + 1 >= totalQuestions;
          askQuestion(res.nextQuestion, buildAcknowledgement(res.evaluation.overallScore, isLast));
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
    [id, questionNumber, totalQuestions, resetRecording, resetTranscript, sayThenListen, askQuestion, handleNoSpeech, setPhase, setStage, recordBodyLanguage]
  );

  // Called when the silence monitor decides the candidate has finished speaking
  const finishAnswer = useCallback(async () => {
    if (phaseRef.current !== 'listening') return;
    setPhase('processing');

    const spoken = combinedRef.current.trim();
    const seconds = Math.max(1, Math.round((Date.now() - turnRef.current.start) / 1000));
    stopListening();
    const blob = await stopRecording();

    // Small talk at the start and end is part of the conversation but is not scored
    if (stageRef.current === 'warmup') {
      resetRecording();
      const first = questionRef.current;
      if (first) askQuestion(first, buildWarmupReply(spoken, totalQuestions));
      return;
    }
    if (stageRef.current === 'closing') {
      resetRecording();
      setPhase('speaking');
      speak(buildClosingReply(spoken), () => {
        setPhase('finished');
        if (id) navigate(`/interview/${id}/complete`);
      });
      return;
    }

    if (!blob && !spoken) {
      handleNoSpeech();
      return;
    }

    // A very short answer gets one gentle follow-up before it is scored
    const wordCount = spoken ? spoken.split(/\s+/).length : 0;
    answerSecondsRef.current += seconds;
    if (spoken && wordCount < SHORT_ANSWER_WORDS && followUpsRef.current < 1) {
      followUpsRef.current += 1;
      answerPartsRef.current.push(spoken);
      resetRecording();
      sayThenListen(buildFollowUp());
      return;
    }

    const parts = [...answerPartsRef.current, spoken].filter(Boolean);
    const hadFollowUp = answerPartsRef.current.length > 0;
    await submitTurn({
      answer: parts.join(' '),
      // Separate recordings cannot be joined, so a follow-up answer is scored from the combined transcript
      audio: hadFollowUp ? null : blob,
      seconds: answerSecondsRef.current,
    });
  }, [
    id,
    navigate,
    speak,
    totalQuestions,
    stopListening,
    stopRecording,
    resetRecording,
    submitTurn,
    handleNoSpeech,
    askQuestion,
    sayThenListen,
    setPhase,
  ]);

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
      const chatting = stageRef.current !== 'question';
      const silenceMs = chatting ? CHAT_SILENCE_MS : SILENCE_MS;
      const noSpeechMs = chatting ? CHAT_NO_SPEECH_MS : NO_SPEECH_TIMEOUT_MS;

      if (heardSpeech && now - turn.lastActivity >= silenceMs) {
        finishAnswer();
      } else if (now - turn.start >= MAX_ANSWER_MS) {
        finishAnswer();
      } else if (!heardSpeech && now - turn.start >= noSpeechMs) {
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
      speak("Hi, I'll be your interviewer today. Let's start whenever you're ready.");
    } else if (phaseRef.current === 'speaking' && stageRef.current === 'question' && questionRef.current) {
      askQuestion(questionRef.current);
    }
    // Only react to a voice change, not to callback identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceGender]);

  const handleStartInterview = () => {
    if (!currentQuestion) return;
    setStage('warmup');
    setPhase('speaking');
    speak(buildGreeting(INTERVIEWER_NAME[voiceGender], user?.name || '', roleTitle), () => {
      if (phaseRef.current === 'speaking') beginListening();
    });
  };

  const stopEverything = useCallback(() => {
    cancelTts();
    stopListening();
    resetRecording();
  }, [cancelTts, stopListening, resetRecording]);

  const handleTogglePause = () => {
    if (phase === 'paused') {
      setPipelineError(null);
      if (stageRef.current === 'question' && currentQuestion) askQuestion(currentQuestion, 'Alright, let us continue.', 300);
      else beginListening();
    } else if (phase === 'speaking' || phase === 'listening') {
      stopEverything();
      setPhase('paused');
    }
  };

  const handleReplayQuestion = () => {
    if (!currentQuestion || stage !== 'question' || phase === 'processing' || phase === 'finished') return;
    stopEverything();
    askQuestion(currentQuestion, 'Sure, let me repeat that.', 300);
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
        <div className="lg:col-span-7 lg:min-h-0 lg:h-full">
          <VideoCallStage
            candidateName={user?.name || 'Candidate'}
            videoRef={videoRef}
            cameraOn={cameraOn}
            onToggleCamera={() => setCameraOn((on) => !on)}
            cameraError={cameraError}
            voiceGender={voiceGender}
            onVoiceGenderChange={setVoiceGender}
            speechLevel={speechLevel}
            status={aiStatus}
            isSpeaking={isSpeaking}
            isListening={phase === 'listening'}
            isPaused={phase === 'paused'}
            category={currentQuestion?.category}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            questionText={currentQuestion?.text ?? (loadError ? '' : 'Loading your first question...')}
            liveTranscript={combinedLiveTranscript}
            volumeLevel={volumeLevel}
            recordingSeconds={duration}
            micError={micError}
            onTogglePause={handleTogglePause}
            onReplayQuestion={handleReplayQuestion}
            onOpenTextModal={() => setIsTextModalOpen(true)}
            onLeave={leave}
          />
        </div>

        <div className="lg:col-span-3 lg:min-h-0 lg:h-full flex flex-col gap-4 lg:overflow-y-auto">
          <BodyLanguagePanel
            status={bodyLanguage.status}
            live={bodyLanguage.live}
            faceDetected={bodyLanguage.faceDetected}
            tip={bodyLanguage.tip}
            cameraOn={cameraOn}
          />
          <div className="flex-1 min-h-[420px]">
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
                  <VoiceSelector value={voiceGender} onChange={setVoiceGender} />
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
