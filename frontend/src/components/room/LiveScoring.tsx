import React, { useState } from 'react';
import { Lightbulb, Send, ChevronDown, ChevronUp, FileText, Activity } from 'lucide-react';
import type { Evaluation, SpeechMetrics } from '../../api/interviews';

interface LiveScoringProps {
  evaluation: Evaluation | null;
  speechMetrics?: SpeechMetrics | null;
  transcriptText?: string | null;
  questionNumber: number;
  totalQuestions: number;
  onRevealIdealAnswer: () => void;
  onSubmitResponse: () => void;
  isSubmitting?: boolean;
  canSubmit?: boolean;
  processingStep?: string | null;
}

export const LiveScoring: React.FC<LiveScoringProps> = ({
  evaluation,
  speechMetrics,
  transcriptText,
  questionNumber,
  totalQuestions,
  onRevealIdealAnswer,
  onSubmitResponse,
  isSubmitting = false,
  canSubmit = true,
  processingStep,
}) => {
  const [showTranscript, setShowTranscript] = useState(true);

  const hasEval = evaluation !== null;

  const overallDisplay = hasEval ? evaluation.overallScore : '--';
  const confidenceDisplay = hasEval ? evaluation.confidenceScore : '--';
  const clarityDisplay = hasEval ? evaluation.clarityScore : '--';
  const problemSolvingDisplay = hasEval ? evaluation.relevanceScore : '--';
  const technicalDisplay = hasEval ? evaluation.technicalScore : '--';
  const communicationDisplay = hasEval ? evaluation.communicationScore : '--';

  const getStatusLabel = () => {
    if (processingStep) return processingStep;
    if (!hasEval) return 'Waiting for response';
    const overall = evaluation.overallScore;
    if (overall >= 80) return 'Excellent';
    if (overall >= 70) return 'Good';
    return 'Needs Work';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between h-full shadow-sm overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm">Live Scoring</h3>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {/* Circular Gauge Score Area */}
      <div className="my-3 flex flex-col items-center justify-center text-center">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Background Ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="#F1F5F9"
              strokeWidth="8"
              fill="transparent"
            />
            {hasEval && (
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="#FF6B00"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - evaluation.overallScore / 100)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            )}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-extrabold text-slate-800">{overallDisplay}</span>
            <span className="text-[10px] text-slate-400 font-semibold">/100</span>
          </div>
        </div>

        <div className="mt-2">
          <span
            className={`text-xs font-bold ${
              hasEval && evaluation.overallScore >= 70
                ? 'text-emerald-500'
                : hasEval
                ? 'text-rose-500'
                : 'text-slate-400'
            }`}
          >
            {getStatusLabel()}
          </span>
          <p className="text-[10px] text-slate-400 font-medium">Real-time feedback at this interview.</p>
        </div>
      </div>

      {/* 3 Top Sub-Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-100">
        <div>
          <div className="text-sm font-extrabold text-slate-800">{confidenceDisplay}</div>
          <div className="text-[10px] font-medium text-slate-400">Confidence</div>
        </div>
        <div>
          <div className="text-sm font-extrabold text-slate-800">{clarityDisplay}</div>
          <div className="text-[10px] font-medium text-slate-400">Clarity</div>
        </div>
        <div>
          <div className="text-sm font-extrabold text-slate-800">{problemSolvingDisplay}</div>
          <div className="text-[10px] font-medium text-slate-400">Problem Solving</div>
        </div>
      </div>

      {/* Answer Hints CTA */}
      <button
        onClick={onRevealIdealAnswer}
        className="w-full my-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-3 rounded-xl shadow-md shadow-amber-500/20 text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
      >
        <Lightbulb className="w-4 h-4 stroke-[2.5]" />
        <span>Get Answer Hints 💡</span>
      </button>

      {/* Progress Bars for Technical & Communication */}
      <div className="space-y-2 text-xs">
        <div>
          <div className="flex justify-between text-slate-600 font-medium mb-1">
            <span>Technical</span>
            <span className="font-bold text-slate-800">{hasEval ? technicalDisplay : '--'}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#FF6B00] h-full rounded-full transition-all duration-500"
              style={{ width: `${hasEval ? technicalDisplay : 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-600 font-medium mb-1">
            <span>Communication</span>
            <span className="font-bold text-slate-800">{hasEval ? communicationDisplay : '--'}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#FF6B00] h-full rounded-full transition-all duration-500"
              style={{ width: `${hasEval ? communicationDisplay : 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-400 text-[11px] font-medium mb-1">
            <span>Question progress</span>
            <span>
              {questionNumber}/{totalQuestions}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#FF6B00] h-full rounded-full transition-all duration-500"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* PROBLEM 10: SPEECH METRICS FROM BACKEND */}
      {speechMetrics && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1 text-[11px]">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <Activity className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Speech Metrics (Backend)</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-slate-600 pt-1">
            <div>WPM: <strong className="text-slate-800">{speechMetrics.wordsPerMinute}</strong></div>
            <div>Words: <strong className="text-slate-800">{speechMetrics.totalWords}</strong></div>
            <div>Fillers: <strong className="text-slate-800">{speechMetrics.fillerWords}</strong></div>
            <div>Pauses: <strong className="text-slate-800">{speechMetrics.pauseCount}</strong></div>
          </div>
        </div>
      )}

      {/* PROBLEM 9: COLLAPSIBLE TRANSCRIPT DEBUGGING */}
      {transcriptText && (
        <div className="mt-3 border border-orange-200/80 bg-orange-50/50 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full p-2.5 flex items-center justify-between text-xs font-bold text-[#FF6B00] hover:bg-orange-100/50"
          >
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>STT Transcript (Debug)</span>
            </div>
            {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showTranscript && (
            <div className="p-3 pt-0 text-[11px] text-slate-700 font-mono leading-relaxed border-t border-orange-200/40">
              "{transcriptText}"
            </div>
          )}
        </div>
      )}

      {/* Submit Response CTA */}
      <button
        onClick={onSubmitResponse}
        disabled={!canSubmit || isSubmitting}
        className={`w-full mt-3 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
          canSubmit && !isSubmitting
            ? 'bg-[#FF6B00] text-white hover:bg-[#E56000] shadow-md shadow-orange-500/20 active:scale-[0.99]'
            : 'bg-orange-200 text-orange-400 cursor-not-allowed'
        }`}
      >
        <Send className="w-4 h-4" />
        <span>{isSubmitting ? processingStep || 'Processing...' : 'Submit Response'}</span>
      </button>
    </div>
  );
};
