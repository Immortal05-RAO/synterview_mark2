import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import type { QuestionResult } from '../../api/interviews';

interface QuestionBreakdownProps {
  questions: QuestionResult[];
}

export const QuestionBreakdown: React.FC<QuestionBreakdownProps> = ({ questions }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <MessageSquare className="w-5 h-5 text-[#FF6B00]" />
          <span>Question-by-Question Evaluation</span>
        </div>
        <span className="text-xs text-slate-400 font-semibold">{questions.length} Questions Evaluated</span>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const isExpanded = expandedIndex === idx;
          const score = q.evaluation.overallScore;

          return (
            <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
              {/* Question Row Header */}
              <button
                onClick={() => toggleExpand(idx)}
                className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3 pr-4">
                  <span className="w-7 h-7 rounded-xl bg-orange-100 text-[#FF6B00] font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                    Q{q.questionNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{q.questionText}</span>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-[#FF6B00]">{score}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">/100</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Expanded Question Details */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-200/80 bg-white space-y-4 text-xs">
                  {/* Candidate Answer Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                      Candidate Response {q.audioSubmitted ? '(Transcribed Voice)' : '(Text Response)'}:
                    </span>
                    <p className="text-slate-800 leading-relaxed font-normal">
                      "{q.transcript || q.answerText || 'No response provided.'}"
                    </p>
                  </div>

                  {/* Score Breakdown Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="bg-purple-50 p-2 rounded-lg border border-purple-200/60">
                      <span className="text-[10px] text-purple-600 font-semibold block">Technical</span>
                      <span className="font-bold text-purple-800 text-sm">{q.evaluation.technicalScore}</span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-200/60">
                      <span className="text-[10px] text-blue-600 font-semibold block">Relevance</span>
                      <span className="font-bold text-blue-800 text-sm">{q.evaluation.relevanceScore}</span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200/60">
                      <span className="text-[10px] text-emerald-600 font-semibold block">Clarity</span>
                      <span className="font-bold text-emerald-800 text-sm">{q.evaluation.clarityScore}</span>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-lg border border-orange-200/60">
                      <span className="text-[10px] text-orange-600 font-semibold block">Communication</span>
                      <span className="font-bold text-orange-800 text-sm">{q.evaluation.communicationScore}</span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                      <span className="text-[10px] text-amber-600 font-semibold block">Confidence</span>
                      <span className="font-bold text-amber-800 text-sm">{q.evaluation.confidenceScore}</span>
                    </div>
                  </div>

                  {/* AI Feedback */}
                  {q.evaluation.feedback && (
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-slate-700">
                      <span className="font-bold text-blue-900 block mb-0.5">AI Feedback:</span>
                      <p>{q.evaluation.feedback}</p>
                    </div>
                  )}

                  {/* Strengths & Improvements lists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {q.evaluation.strengths.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Strengths
                        </span>
                        <ul className="space-y-1">
                          {q.evaluation.strengths.map((s, i) => (
                            <li key={i} className="text-slate-600 flex items-start gap-1.5">
                              <span className="text-emerald-500">•</span> <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {q.evaluation.improvements.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Areas for Improvement
                        </span>
                        <ul className="space-y-1">
                          {q.evaluation.improvements.map((imp, i) => (
                            <li key={i} className="text-slate-600 flex items-start gap-1.5">
                              <span className="text-amber-500">•</span> <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
