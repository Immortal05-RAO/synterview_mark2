import React, { useState, useEffect, useRef } from 'react';
import { Mic, Video, VideoOff, Settings, LogOut, Radio, AlertCircle } from 'lucide-react';
import type { MicState } from '../../hooks/useAudioRecorder';

interface CandidatePanelProps {
  candidateName: string;
  micState: MicState;
  isRecording: boolean;
  recordingDuration: number;
  volumeLevel: number;
  audioDataArray: Uint8Array;
  mimeTypeUsed: string;
  onStartAnswering: () => void;
  onStopRecording: () => void;
  onOpenTextModal: () => void;
  onLeaveSession: () => void;
  sessionStateText: string;
  errorMessage: string | null;
  isSpeaking?: boolean;
}

export const CandidatePanel: React.FC<CandidatePanelProps> = ({
  candidateName,
  micState,
  isRecording,
  recordingDuration,
  volumeLevel,
  audioDataArray,
  onStartAnswering,
  onStopRecording,
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
    if (cameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const initial = candidateName.charAt(0).toUpperCase();
  const isBusyProcessing = ['UPLOADING', 'TRANSCRIBING', 'EVALUATING'].includes(micState);

  return (
    <div className="bg-[#181F2A] rounded-2xl border border-slate-800 p-4 flex flex-col justify-between h-full shadow-lg text-slate-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-200">Candidate: {candidateName}</span>
        </div>
        <button className="text-slate-400 hover:text-slate-200 p-1">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Camera / Video Area */}
      <div className="my-3 relative bg-[#0F172A] rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800/80">
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300 font-bold text-2xl shadow-inner">
              {initial}
            </div>
          </div>
        )}

        {/* Live Camera Tag Top Right */}
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-md text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Live</span>
        </div>

        {/* Mic Active & Recording Tags Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isRecording ? (
            <div className="bg-rose-500/90 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow-md">
              <Radio className="w-3.5 h-3.5" />
              <span>● Recording {formatTimer(recordingDuration)}</span>
            </div>
          ) : micState === 'MIC_READY' ? (
            <div className="bg-emerald-500/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Mic className="w-3 h-3" />
              <span>● Microphone Active</span>
            </div>
          ) : null}
        </div>

        {/* REAL Web Audio API Live Waveform Visualizer */}
        {isRecording && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 flex items-center gap-3">
            <div className="flex items-center gap-1 flex-1 h-6">
              {Array.from(audioDataArray.slice(0, 16)).map((val, idx) => {
                const heightPx = Math.max(3, Math.min(24, Math.round((val / 255) * 24)));
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-[#FF6B00] rounded-full transition-all duration-75"
                    style={{ height: `${heightPx}px` }}
                  />
                );
              })}
            </div>
            <div className="text-[10px] font-mono text-orange-400 font-bold">
              {volumeLevel}% Vol
            </div>
          </div>
        )}

        {/* Bottom Label when inactive */}
        {!isRecording && (
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-[10px] font-medium px-2 py-0.5 rounded-md text-slate-400">
            Camera {cameraActive ? '' : '(Demo)'}
          </div>
        )}
      </div>

      {/* Control Buttons Toolbar */}
      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800">
        <button
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-medium transition-colors ${
            isRecording ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          <Mic className="w-4 h-4 mb-0.5" />
          <span>Mic</span>
        </button>

        <button
          onClick={() => setCameraActive(!cameraActive)}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-medium transition-colors ${
            cameraActive ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}
        >
          {cameraActive ? <Video className="w-4 h-4 mb-0.5" /> : <VideoOff className="w-4 h-4 mb-0.5" />}
          <span>Camera</span>
        </button>

        <button
          onClick={onLeaveSession}
          className="flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
        >
          <LogOut className="w-4 h-4 mb-0.5" />
          <span>Leave</span>
        </button>

        <button className="flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors">
          <Settings className="w-4 h-4 mb-0.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Error Message Display if Permission Denied */}
      {errorMessage && (
        <div className="mt-3 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Microphone Access Blocked</span>
          </div>
          <p className="text-[11px] text-rose-200/90 leading-snug">{errorMessage}</p>
        </div>
      )}

      {/* Answer Action Box */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Interview session</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-orange-400 border border-orange-500/20">
            {sessionStateText}
          </span>
        </div>

        {isRecording ? (
          <button
            onClick={onStopRecording}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Stop Recording</span>
          </button>
        ) : (
          <button
            onClick={onStartAnswering}
            disabled={isBusyProcessing || isSpeaking}
            className="w-full bg-[#FF6B00] hover:bg-[#E56000] text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mic className="w-4 h-4 stroke-[2.5]" />
            <span>{isSpeaking ? 'AI Speaking...' : isBusyProcessing ? sessionStateText : 'Start Answering'}</span>
          </button>
        )}

        <button
          onClick={onOpenTextModal}
          className="w-full text-center text-[11px] font-semibold text-orange-400 hover:text-orange-300 py-1 transition-colors block"
        >
          Can't use microphone? Answer with text →
        </button>
      </div>
    </div>
  );
};
