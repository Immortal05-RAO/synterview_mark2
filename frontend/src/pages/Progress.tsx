import React, { useEffect, useState } from 'react';
import { PerformanceChart } from '../components/dashboard/PerformanceChart';
import { interviewsApi } from '../api/interviews';
import type { InterviewConfig } from '../api/interviews';
import { buildTrend } from '../utils/trend';

export const ProgressPage: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewConfig[]>([]);

  useEffect(() => {
    interviewsApi
      .list()
      .then((res) => {
        if (res.success) setInterviews(res.interviews);
      })
      .catch(() => setInterviews([]));
  }, []);

  const trend = buildTrend(interviews);
  const scores = trend.map((t) => t.overall);
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const best = scores.length ? Math.max(...scores) : null;
  const change = scores.length > 1 ? scores[scores.length - 1] - scores[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Analytics & Progress</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Track your score trajectory across completed interview sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">Completed Sessions</span>
          <div className="text-2xl font-extrabold text-slate-800">{scores.length}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">Average Score</span>
          <div className="text-2xl font-extrabold text-slate-800">{average ?? '—'}</div>
          {best !== null && <p className="text-xs text-slate-500 font-medium">Best: {best}</p>}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">Change Since First Session</span>
          <div className="text-2xl font-extrabold text-slate-800">
            {change === null ? '—' : `${change > 0 ? '+' : ''}${change}`}
          </div>
        </div>
      </div>

      <PerformanceChart data={trend} />
    </div>
  );
};
