import React from 'react';
import { Volume2 } from 'lucide-react';
import { VoiceSelector } from './VoiceSelector';
import type { VoiceGender } from '../../hooks/useTextToSpeech';

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
  voiceGender: VoiceGender;
  onVoiceGenderChange: (gender: VoiceGender) => void;
  voiceName?: string | null;
}

const STATUS_DOT: Record<AIInterviewerProps['status'], string> = {
  Speaking: 'bg-[#FF6B00]',
  Listening: 'bg-emerald-500',
  Thinking: 'bg-slate-400',
  Ready: 'bg-slate-300',
};

export const AIInterviewer: React.FC<AIInterviewerProps> = ({
  questionText,
  category = 'General',
  questionNumber,
  totalQuestions,
  status = 'Ready',
  onReplayQuestion,
  isSpeaking = false,
  isRecording = false,
  liveTranscript = '',
  finalTranscript = null,
  isSpeechRecognitionSupported = true,
  feedbackFeed = [],
  backendFeedback = null,
  voiceGender,
  onVoiceGenderChange,
  voiceName,
}) => {
  const shownStatus = isSpeaking ? 'Speaking' : status;

  let transcriptBody: React.ReactNode;
  if (isRecording) {
    transcriptBody = !isSpeechRecognitionSupported ? (
      <p className="text-slate-500">
        Live transcription is unavailable in this browser. Your voice is still being recorded.
      </p>
    ) : liveTranscript ? (
      <p className="text-slate-800">{liveTranscript}</p>
    ) : (
      <p className="text-slate-400">Listening. Start speaking when you are ready.</p>
    );
  } else if (finalTranscript) {
    transcriptBody = <p className="text-slate-800">{finalTranscript}</p>;
  } else {
    transcriptBody = (
      <p className="text-slate-400">Your answer will appear here once the interviewer finishes the question.</p>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 h-full flex flex-col overflow-y-auto">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-800">Interviewer</h3>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 w-24 justify-end">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[shownStatus]}`} />
          <span>{shownStatus}</span>
        </div>
      </div>

      <div className="px-5 py-5 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">
              Interviewer voice
            </span>
            <VoiceSelector value={voiceGender} onChange={onVoiceGenderChange} voiceName={voiceName} />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-semibold uppercase tracking-wide text-[#FF6B00]">{category}</span>
          <span>
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
        <p className="text-lg font-semibold text-slate-900 leading-snug">{questionText}</p>
        {onReplayQuestion && (
          <button
            onClick={onReplayQuestion}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#FF6B00] transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Replay question
          </button>
        )}
      </div>

      <div className="px-5 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isRecording ? 'Your answer (live)' : 'Your answer'}
          </span>
        </div>
        <div className="h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed">
          {transcriptBody}
        </div>
      </div>

      <div className="px-5 py-4 flex-1 min-h-0">
        {backendFeedback && (
          <div className="mb-4 border-l-2 border-[#FF6B00] pl-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feedback</span>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{backendFeedback}</p>
          </div>
        )}
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session log</span>
        <ul className="mt-2 space-y-1 text-xs text-slate-600 max-h-28 overflow-y-auto">
          {feedbackFeed.map((item, idx) => (
            <li key={idx}>{item.replace(/^✓\s*/, '')}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
