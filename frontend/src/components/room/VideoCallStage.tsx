import React from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, Keyboard, PhoneOff, Pause, Play } from 'lucide-react';
import { InterviewerAvatar } from './InterviewerAvatar';
import { VoiceSelector } from './VoiceSelector';
import type { VoiceAccent, VoiceGender } from '../../hooks/useTextToSpeech';
import { interviewerName } from '../../utils/interviewer';

interface VideoCallStageProps {
  candidateName: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraOn: boolean;
  onToggleCamera: () => void;
  cameraError: string | null;

  voiceGender: VoiceGender;
  onVoiceGenderChange: (gender: VoiceGender) => void;
  accent: VoiceAccent;
  onAccentChange: (accent: VoiceAccent) => void;
  speechLevel?: number | null;

  status: 'Listening' | 'Thinking' | 'Speaking' | 'Ready';
  isSpeaking: boolean;
  isListening: boolean;
  isPaused: boolean;
  category?: string;
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  liveTranscript: string;
  volumeLevel: number;
  recordingSeconds: number;
  micError: string | null;

  onTogglePause: () => void;
  onReplayQuestion: () => void;
  onOpenTextModal: () => void;
  onLeave: () => void;
}

const controlButton =
  'flex items-center gap-2 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors border';

export const VideoCallStage: React.FC<VideoCallStageProps> = ({
  candidateName,
  videoRef,
  cameraOn,
  onToggleCamera,
  cameraError,
  voiceGender,
  onVoiceGenderChange,
  accent,
  onAccentChange,
  speechLevel = null,
  status,
  isSpeaking,
  isListening,
  isPaused,
  category,
  questionNumber,
  totalQuestions,
  questionText,
  liveTranscript,
  volumeLevel,
  recordingSeconds,
  micError,
  onTogglePause,
  onReplayQuestion,
  onOpenTextModal,
  onLeave,
}) => {
  const name = interviewerName(voiceGender, accent);
  const shownStatus = isSpeaking ? 'Speaking' : status;
  const mins = Math.floor(recordingSeconds / 60);
  const secs = String(recordingSeconds % 60).padStart(2, '0');

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* The call window: the interviewer fills the frame, you sit in the corner like a real video call */}
      <div className="relative flex-1 min-h-[320px] rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
        <div className="absolute inset-0">
          <InterviewerAvatar gender={voiceGender} isSpeaking={isSpeaking} isListening={isListening} mouthLevel={speechLevel} />
        </div>

        {/* Name tag */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/70 backdrop-blur-sm text-white text-xs font-medium pl-2 pr-3 py-1.5 rounded-full">
          <span
            className={`w-2 h-2 rounded-full ${
              shownStatus === 'Speaking'
                ? 'bg-[#FF6B00] animate-pulse'
                : shownStatus === 'Listening'
                ? 'bg-emerald-400'
                : 'bg-slate-400'
            }`}
          />
          <span>{name} · Interviewer</span>
          <span className="text-slate-300">{shownStatus}</span>
        </div>

        <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
          {category ? `${category} · ` : ''}Question {questionNumber} of {totalQuestions}
        </div>

        {/* Self view */}
        <div className="absolute right-3 bottom-[7.5rem] w-40 sm:w-52 aspect-video rounded-lg overflow-hidden bg-slate-800 border-2 border-white/80 shadow-lg">
          {cameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-600 text-white font-semibold text-xl flex items-center justify-center">
                {candidateName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-slate-950/70 text-white text-[10px] px-1.5 py-0.5 rounded">
            You
          </div>
          {isListening && (
            <div className="absolute top-1 left-1 flex items-center gap-1 bg-slate-950/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {mins}:{secs}
            </div>
          )}
          {isListening && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div className="h-full bg-emerald-400 transition-all duration-100" style={{ width: `${Math.min(100, volumeLevel * 2)}%` }} />
            </div>
          )}
        </div>

        {cameraError && (
          <div className="absolute right-3 bottom-[7.5rem] translate-y-full mt-1 text-[11px] text-amber-200 max-w-52 text-right">
            {cameraError}
          </div>
        )}

        {/* Spoken question as a live caption, and your own words as you answer */}
        <div className="absolute left-3 right-3 bottom-3 space-y-2 pr-0 sm:pr-56 pointer-events-none">
          <div className="bg-slate-950/75 backdrop-blur-sm text-white rounded-lg px-4 py-3">
            <p className="text-sm sm:text-base font-medium leading-snug">{questionText}</p>
          </div>
          {isListening && (
            <div className="bg-white/90 text-slate-800 rounded-lg px-4 py-2 text-sm leading-snug max-h-20 overflow-y-auto">
              {liveTranscript || <span className="text-slate-400">Listening. Start speaking when you are ready.</span>}
            </div>
          )}
        </div>
      </div>

      {micError && (
        <div className="border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="font-semibold">Microphone unavailable. </span>
          {micError}
        </div>
      )}

      {/* Call controls */}
      <div className="flex-shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onTogglePause}
            className={`${controlButton} ${
              isPaused ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            aria-label={isPaused ? 'Resume interview' : 'Pause interview'}
          >
            {isPaused ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isPaused ? 'Muted' : 'Mic on'}
          </button>
          <button
            onClick={onToggleCamera}
            className={`${controlButton} ${
              cameraOn ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            {cameraOn ? 'Camera on' : 'Camera off'}
          </button>
          <button
            onClick={onTogglePause}
            className={`${controlButton} bg-white border-slate-300 text-slate-700 hover:bg-slate-50`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={onReplayQuestion}
            className={`${controlButton} bg-white border-slate-300 text-slate-700 hover:bg-slate-50`}
          >
            <Volume2 className="w-4 h-4" />
            Repeat question
          </button>
          <button
            onClick={onOpenTextModal}
            className={`${controlButton} bg-white border-slate-300 text-slate-700 hover:bg-slate-50`}
          >
            <Keyboard className="w-4 h-4" />
            Type answer
          </button>
        </div>

        <div className="flex items-center gap-3">
          <VoiceSelector value={voiceGender} onChange={onVoiceGenderChange} accent={accent} onAccentChange={onAccentChange} />
          <button
            onClick={onLeave}
            className={`${controlButton} bg-red-600 border-red-600 text-white hover:bg-red-700`}
          >
            <PhoneOff className="w-4 h-4" />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
