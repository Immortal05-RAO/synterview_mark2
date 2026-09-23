import React from 'react';
import { Mic, Activity, AlertCircle, Clock, Volume2 } from 'lucide-react';
import type { SpeechMetrics } from '../../api/interviews';

interface SpeechAnalyticsProps {
  metrics: SpeechMetrics;
}

export const SpeechAnalytics: React.FC<SpeechAnalyticsProps> = ({ metrics }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
            <Mic className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span>Speech & Communication Analytics</span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          Audio Analysis Engine
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Words Per Minute */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Speaking Pace</span>
            <Activity className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{metrics.wordsPerMinute} <span className="text-xs text-slate-400 font-normal">WPM</span></div>
          <div className="text-[11px] font-medium text-emerald-600">
            {metrics.wordsPerMinute >= 130 && metrics.wordsPerMinute <= 170 ? 'Optimal Cadence (130-170 WPM)' : 'Pace can be optimized'}
          </div>
        </div>

        {/* Filler Words */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Filler Words</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{metrics.fillerWords} <span className="text-xs text-slate-400 font-normal">count</span></div>
          <div className="text-[11px] font-medium text-slate-500">
            Rate: {(metrics.fillerRate * 100).toFixed(1)}% of total words
          </div>
        </div>

        {/* Total Words */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Vocabulary</span>
            <Volume2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{metrics.totalWords} <span className="text-xs text-slate-400 font-normal">words</span></div>
          <div className="text-[11px] font-medium text-slate-500">
            Repeated words: {metrics.repeatedWords}
          </div>
        </div>

        {/* Pause Count */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Pauses & Silences</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{metrics.pauseCount} <span className="text-xs text-slate-400 font-normal">pauses</span></div>
          <div className="text-[11px] font-medium text-slate-500">
            Long pauses (&gt;2s): {metrics.longPauseCount}
          </div>
        </div>
      </div>
    </div>
  );
};
