import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import type { ReportData } from '../../api/interviews';

interface ScoreOverviewProps {
  report: ReportData;
}

export const ScoreOverview: React.FC<ScoreOverviewProps> = ({ report }) => {
  const categories = [
    { label: 'Technical Knowledge', score: report.technicalScore, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Communication', score: report.communicationScore, color: 'text-[#FF6B00]', bg: 'bg-orange-50' },
    { label: 'Relevance', score: report.relevanceScore, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Clarity', score: report.clarityScore, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Confidence', score: report.confidenceScore, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Overall Score */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700/50">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">
            <Award className="w-3.5 h-3.5" />
            <span>Interview Report • {report.role} ({report.interviewType})</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Performance Summary</h2>
          <p className="text-slate-400 text-xs max-w-lg leading-relaxed">
            Your candidate evaluation was analyzed across technical depth, articulation, speech cadence, and answer structure.
          </p>
        </div>

        {/* Big Overall Score Circle */}
        <div className="flex items-center gap-6 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 backdrop-blur-md">
          <div className="text-center">
            <div className="text-5xl font-extrabold text-[#FF6B00] tracking-tight">{report.overallScore}</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Overall Score</div>
          </div>
          <div className="h-12 w-px bg-slate-700" />
          <div className="text-xs space-y-1 text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Session Completed</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Duration: {Math.round(report.durationSeconds / 60)} minutes
            </div>
          </div>
        </div>
      </div>

      {/* Category Score Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {categories.map((cat) => (
          <div key={cat.label} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-400 block truncate">{cat.label}</span>
            <div className="flex items-baseline justify-between">
              <span className={`text-3xl font-extrabold ${cat.color}`}>{cat.score}</span>
              <span className="text-xs font-bold text-slate-400">/100</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${cat.bg.replace('-50', '-500')}`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
