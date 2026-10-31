import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, LogOut } from 'lucide-react';
import type { MicState } from '../../hooks/useAudioRecorder';

interface CandidatePanelProps {
  candidateName: string;
  micState: MicState;
  isRecording: boolean;
  recordingDuration: number;
  volumeLevel: number;
  audioDataArray: Uint8Array;
  mimeTypeUsed: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenTextModal: () => void;
  onLeaveSession: () => void;
  sessionStateText: string;
  errorMessage: string | null;
  isSpeaking?: boolean;
}

const toolButton =
  'flex flex-col items-center justify-center gap-1 py-2 rounded-md border text-xs font-medium transition-colors';

export const CandidatePanel: React.FC<CandidatePanelProps> = ({
  candidateName,
  micState,
  isRecording,
  recordingDuration,
  volumeLevel,
  audioDataArray,
  isPaused,
  onTogglePause,
  onOpenTextModal,
  onLeaveSession,
  sessionStateText,
  errorMessage,
  isSpeaking = false,
}) => {
  const [cameraActive, setCameraActive] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (cameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((s) => {
          if (cancelled) {
            s.getTracks().forEach((track) => track.stop());
            return;
          }
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => setCameraActive(false));
    }
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraActive]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const initial = candidateName.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-lg border border-slate-200 h-full flex flex-col overflow-y-auto">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-800">You</h3>
        <span className="text-xs text-slate-500 truncate max-w-[60%]">{candidateName}</span>
      </div>

      <div className="p-5 space-y-4 flex-1 min-h-0">
        <div className="relative bg-[#0F172A] rounded-md overflow-hidden aspect-video flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-700 text-slate-200 font-semibold text-2xl flex items-center justify-center">
              {initial}
            </div>
          )}

          {isRecording && (
            <>
              <div className="absolute top-2 left-2 bg-white/95 text-slate-800 text-xs font-medium px-2 py-1 rounded-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-mono">{formatTimer(recordingDuration)}</span>
              </div>
              <div className="absolute bottom-2 left-2 right-2 bg-white/95 rounded-sm px-2 py-1.5 flex items-end gap-0.5 h-8">
                {Array.from(audioDataArray.slice(0, 24)).map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-[#FF6B00] rounded-sm"
                    style={{ height: `${Math.max(2, Math.min(20, Math.round((val / 255) * 20)))}px` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onTogglePause}
            className={`${toolButton} ${
              isPaused
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isPaused ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isPaused ? 'Muted' : 'Mic'}</span>
          </button>

          <button
            onClick={() => setCameraActive(!cameraActive)}
            className={`${toolButton} ${
              cameraActive
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}
          >
            {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            <span>Camera</span>
          </button>

          <button
            onClick={onLeaveSession}
            className={`${toolButton} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>

        {errorMessage && (
          <div className="border-l-2 border-red-500 bg-red-50 pl-3 pr-2 py-2 text-xs text-red-700">
            <p className="font-semibold">Microphone unavailable</p>
            <p className="mt-0.5 leading-snug">{errorMessage}</p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 space-y-3">
          <dl className="text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-semibold text-slate-800">{sessionStateText}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Input level</dt>
              <dd className="font-semibold text-slate-800 w-10 text-right">
                {micState === 'RECORDING' ? `${volumeLevel}%` : '--'}
              </dd>
            </div>
          </dl>

          <button
            onClick={onTogglePause}
            className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${
              isPaused
                ? 'bg-[#FF6B00] hover:bg-[#E56000] text-white'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isPaused ? 'Resume interview' : isSpeaking ? 'Pause interviewer' : 'Pause interview'}
          </button>

          <button
            onClick={onOpenTextModal}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-[#FF6B00] transition-colors"
          >
            Prefer to type? Answer with text
          </button>
        </div>
      </div>
    </div>
  );
};
