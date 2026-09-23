import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic } from 'lucide-react';

interface MetricRow {
  label: string;
  value: number;
}

interface SessionSummaryProps {
  metrics?: MetricRow[];
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ metrics }) => {
  const navigate = useNavigate();

  const defaultMetrics: MetricRow[] = [
    { label: 'Problem Solving', value: 0 },
    { label: 'Technical Depth', value: 0 },
    { label: 'Clarity', value: 0 },
    { label: 'Communication', value: 0 },
    { label: 'Professionalism', value: 0 },
    { label: 'Answer Structure', value: 0 },
    { label: 'Confidence', value: 0 },
  ];

  const items = metrics || defaultMetrics;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-[360px]">
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4">Session Summary</h3>

        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>{m.label}</span>
                <span className="font-bold text-slate-800">{m.value}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#FF6B00] h-full rounded-full transition-all duration-500"
                  style={{ width: `${m.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/interview/new')}
        className="w-full mt-4 bg-[#FF6B00] hover:bg-[#E56000] text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
      >
        <Mic className="w-4 h-4 stroke-[2.5]" />
        <span>Start Practice Session</span>
      </button>
    </div>
  );
};
