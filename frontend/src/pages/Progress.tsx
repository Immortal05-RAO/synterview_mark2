import React from 'react';
import { PerformanceChart } from '../components/dashboard/PerformanceChart';
import { mockDashboardData } from '../mock/dashboard';

export const ProgressPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Analytics & Progress</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Track long-term score trajectory, technical mastery, and communication fluency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Practice Time</span>
          <div className="text-2xl font-extrabold text-slate-800">2.4 <span className="text-xs text-slate-400 font-normal">hours</span></div>
          <p className="text-xs text-emerald-600 font-medium">↑ +45 mins this week</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">Average Speaking WPM</span>
          <div className="text-2xl font-extrabold text-slate-800">166 <span className="text-xs text-slate-400 font-normal">WPM</span></div>
          <p className="text-xs text-emerald-600 font-medium">Optimal fluency range</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">Filler Word Reduction</span>
          <div className="text-2xl font-extrabold text-slate-800">-42% <span className="text-xs text-slate-400 font-normal">decrease</span></div>
          <p className="text-xs text-emerald-600 font-medium">Fewer 'um' / 'like' pauses</p>
        </div>
      </div>

      <PerformanceChart data={mockDashboardData.trendData} />
    </div>
  );
};
