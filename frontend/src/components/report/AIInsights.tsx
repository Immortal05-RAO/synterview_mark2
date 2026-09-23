import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

interface AIInsightsProps {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  strengths,
  improvements,
  recommendations,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Key Strengths */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm border-b border-slate-100 pb-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>Key Strengths</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-700">
          {strengths.map((s, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-500 font-bold">•</span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm border-b border-slate-100 pb-3">
          <AlertTriangle className="w-4 h-4" />
          <span>Areas for Improvement</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-700">
          {improvements.map((imp, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
              <span className="text-amber-500 font-bold">•</span>
              <span className="leading-relaxed">{imp}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended Action Plan */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-[#FF6B00] font-bold text-sm border-b border-slate-100 pb-3">
          <Lightbulb className="w-4 h-4" />
          <span>Actionable AI Plan</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-700">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100">
              <span className="text-[#FF6B00] font-bold">→</span>
              <span className="leading-relaxed font-medium">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
