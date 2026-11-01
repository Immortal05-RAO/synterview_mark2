import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import type { Evaluation, SpeechMetrics } from '../../api/interviews';

interface LiveScoringProps {
  evaluation: Evaluation | null;
  speechMetrics?: SpeechMetrics | null;
  transcriptText?: string | null;
  questionNumber: number;
  totalQuestions: number;
  onRevealIdealAnswer: () => void;
  processingStep?: string | null;
}

const ScoreRow: React.FC<{ label: string; value: number | null }> = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-slate-600 font-medium">{label}</span>
      <span className="font-semibold text-slate-800">{value ?? '--'}</span>
    </div>
    <div className="w-full bg-slate-100 rounded-sm h-1.5 overflow-hidden">
      <div className="bg-[#FF6B00] h-full transition-all duration-500" style={{ width: `${value ?? 0}%` }} />
    </div>
  </div>
);

export const LiveScoring: React.FC<LiveScoringProps> = ({
  evaluation,
  speechMetrics,
  transcriptText,
  questionNumber,
  totalQuestions,
  onRevealIdealAnswer,
  processingStep,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);

  const overall = evaluation ? evaluation.overallScore : null;
  const label = processingStep
    ? processingStep
    : overall === null
    ? 'Waiting for your first answer'
    : overall >= 80
    ? 'Excellent'
    : overall >= 70
    ? 'Good'
    : 'Needs work';

  return (
    <div className="bg-white rounded-lg border border-slate-200 h-full flex flex-col overflow-y-auto">
      <div className="px-5 py-3 border-b border-slate-200 flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-800">Scoring</h3>
      </div>

      <div className="px-5 py-5 border-b border-slate-200 flex-shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest answer</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-4xl font-bold text-slate-900">{overall ?? '--'}</span>
          <span className="text-sm text-slate-400">/ 100</span>
        </div>
        <p
          className={`text-xs font-medium mt-1 ${
            overall === null ? 'text-slate-500' : overall >= 70 ? 'text-emerald-600' : 'text-[#FF6B00]'
          }`}
        >
          {label}
        </p>
      </div>

      {evaluation?.feedback && (
        <div className="px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="border-l-2 border-[#FF6B00] pl-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feedback</span>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{evaluation.feedback}</p>
          </div>
        </div>
      )}

      <div className="px-5 py-4 space-y-3 border-b border-slate-200 flex-shrink-0">
        <ScoreRow label="Technical" value={evaluation?.technicalScore ?? null} />
        <ScoreRow label="Relevance" value={evaluation?.relevanceScore ?? null} />
        <ScoreRow label="Clarity" value={evaluation?.clarityScore ?? null} />
        <ScoreRow label="Communication" value={evaluation?.communicationScore ?? null} />
        <ScoreRow label="Confidence" value={evaluation?.confidenceScore ?? null} />
      </div>

      <div className="px-5 py-4 space-y-4 flex-1 min-h-0">
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>
              {questionNumber} / {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-sm h-1.5 overflow-hidden">
            <div
              className="bg-slate-700 h-full transition-all duration-500"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={onRevealIdealAnswer}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Lightbulb className="w-4 h-4 text-[#FF6B00]" />
          Get a hint
        </button>

        {speechMetrics && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Speech</span>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-slate-500">Words per minute</dt>
              <dd className="text-right font-semibold text-slate-800">{speechMetrics.wordsPerMinute}</dd>
              <dt className="text-slate-500">Words</dt>
              <dd className="text-right font-semibold text-slate-800">{speechMetrics.totalWords}</dd>
              <dt className="text-slate-500">Filler words</dt>
              <dd className="text-right font-semibold text-slate-800">{speechMetrics.fillerWords}</dd>
              <dt className="text-slate-500">Pauses</dt>
              <dd className="text-right font-semibold text-slate-800">{speechMetrics.pauseCount}</dd>
            </dl>
          </div>
        )}

        {transcriptText && (
          <div className="border-t border-slate-200 pt-3">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <span>Last answer transcript</span>
              {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showTranscript && <p className="mt-2 text-xs text-slate-600 leading-relaxed">{transcriptText}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
