import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Volume2, Mic, CheckCircle2, AlertCircle } from 'lucide-react';

interface AIInterviewerProps {
  questionText: string;
  category?: string;
  questionNumber: number;
  totalQuestions: number;
  status: 'Listening' | 'Thinking' | 'Speaking' | 'Ready';
  onReplayQuestion?: () => void;
  isSpeaking?: boolean;
  isRecording?: boolean;
  liveTranscript?: string;
  finalTranscript?: string | null;
  isSpeechRecognitionSupported?: boolean;
  feedbackFeed?: string[];
  backendFeedback?: string | null;
}

export const AIInterviewer: React.FC<AIInterviewerProps> = ({
  questionText,
  category = 'Behavioral',
  questionNumber,
  totalQuestions,
  status = 'Listening',
  onReplayQuestion,
  isSpeaking = false,
  isRecording = false,
  liveTranscript = '',
  finalTranscript = null,
  isSpeechRecognitionSupported = true,
  feedbackFeed = [],
  backendFeedback = null,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between h-full shadow-sm overflow-y-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          AI Interviewer
          {isSpeaking && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
              <Volume2 className="w-3 h-3 animate-pulse" />
              Speaking
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'Speaking' || isSpeaking
                ? 'bg-[#FF6B00] animate-ping'
                : status === 'Thinking'
                ? 'bg-purple-500 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
          <span>● {isSpeaking ? 'Speaking' : status}</span>
        </div>
      </div>

      {/* Center AI Avatar Section */}
      <div className="my-2 bg-slate-50/80 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 relative overflow-hidden flex-shrink-0">
        {/* Animated Pulsing Rings */}
        <div className="relative flex items-center justify-center">
          {(status === 'Speaking' || isSpeaking) && (
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute w-24 h-24 rounded-full bg-orange-400/20"
            />
          )}
          {status === 'Thinking' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute w-24 h-24 rounded-full border-2 border-dashed border-purple-400/40"
            />
          )}

          {/* AI Circle Badge */}
          <div className="w-16 h-16 rounded-full bg-[#181F2A] text-white font-extrabold text-lg flex items-center justify-center shadow-md relative z-10">
            AI
          </div>
        </div>

        {/* Soundwave Dots Animation */}
        <div className="flex items-center gap-1 mt-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <motion.span
              key={i}
              animate={
                status === 'Speaking' || isSpeaking || isRecording
                  ? { height: [4, 18, 4] }
                  : { height: 4 }
              }
              transition={{
                repeat: Infinity,
                duration: 0.5,
                delay: i * 0.05,
              }}
              className={`w-1.5 rounded-full ${
                isSpeaking ? 'bg-[#FF6B00]' : isRecording ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              style={{ height: 4 }}
            />
          ))}
        </div>
      </div>

      {/* Question Content Display */}
      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600 border border-blue-200/60">
            {category}
          </span>
          <span className="text-slate-400 font-medium">
            Q{questionNumber} of {totalQuestions}
          </span>
        </div>

        <p className="text-sm font-semibold text-slate-800 leading-snug">
          "{questionText || 'Tell me about yourself and your background in software engineering.'}"
        </p>

        {/* Replay Question Button */}
        {onReplayQuestion && (
          <div className="pt-1 flex justify-end">
            <button
              onClick={onReplayQuestion}
              disabled={isSpeaking}
              className="px-3 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Replay Question</span>
            </button>
          </div>
        )}
      </div>

      {/* PART 1 & 5: Live Transcript Section Underneath Question */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-2 text-slate-100 flex-1 min-h-[140px] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            {isRecording ? (
              <>
                <Mic className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="text-rose-400">🎙 You're speaking...</span>
              </>
            ) : finalTranscript ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Final Transcript (Backend STT)</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-orange-400" />
                <span className="text-slate-300">Live Transcript</span>
              </>
            )}
          </div>
          {isRecording && (
            <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
              Listening...
            </span>
          )}
        </div>

        <div className="flex-1 py-2 text-xs leading-relaxed font-mono">
          {!isSpeechRecognitionSupported && isRecording ? (
            <div className="text-amber-400 flex items-center gap-1.5 text-[11px]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Live transcription is unavailable in this browser. MediaRecorder is active.</span>
            </div>
          ) : isRecording ? (
            liveTranscript ? (
              <p className="text-slate-100 font-medium">"{liveTranscript}"</p>
            ) : (
              <p className="text-slate-500 italic">Start speaking — your response will appear here.</p>
            )
          ) : finalTranscript ? (
            <p className="text-slate-200">"{finalTranscript}"</p>
          ) : (
            <p className="text-slate-500 italic">No response recorded yet. Click "Start Answering" to respond.</p>
          )}
        </div>
      </div>

      {/* PART 13: AI Feedback Feed Section */}
      <div className="pt-2 border-t border-slate-100 space-y-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <MessageSquare className="w-4 h-4 text-[#FF6B00]" />
          <span>AI Feedback Feed</span>
        </div>

        <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3 text-xs space-y-1.5">
          {/* Milestone checklist */}
          <div className="space-y-1 text-[11px]">
            {feedbackFeed.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
            {isRecording && (
              <div className="flex items-center gap-1.5 text-rose-600 font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>🎙 Listening to candidate response...</span>
              </div>
            )}
          </div>

          {/* Actual backend feedback if present */}
          {backendFeedback && (
            <div className="mt-2 pt-2 border-t border-blue-200/60 text-slate-800 font-semibold text-[11px] leading-snug">
              💡 {backendFeedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
