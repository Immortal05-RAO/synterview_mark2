import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface TrendPoint {
  session: string;
  overall: number;
  technical?: number;
  communication?: number;
}

interface PerformanceChartProps {
  data?: TrendPoint[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data = [] }) => {
  const hasData = data && data.length > 0;
  const hasTechnical = hasData && data.some((d) => d.technical !== undefined);
  const hasCommunication = hasData && data.some((d) => d.communication !== undefined);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-[360px]">
      {/* Chart Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Performance Trend</h3>
          <p className="text-xs text-slate-400">Score progression across sessions</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
            <span className="text-slate-600">Overall</span>
          </div>
          {hasTechnical && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-600">Technical</span>
            </div>
          )}
          {hasCommunication && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Communication</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full relative">
        {!hasData ? (
          <div className="w-full h-full border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
            <p className="text-sm font-bold text-slate-700">No interview data yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Complete your first interview to see your performance trend.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="session" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              />
              <Line type="monotone" dataKey="overall" stroke="#FF6B00" strokeWidth={3} dot={{ r: 4, fill: '#FF6B00' }} activeDot={{ r: 6 }} />
              {hasTechnical && <Line type="monotone" dataKey="technical" stroke="#A855F7" strokeWidth={2.5} dot={{ r: 3, fill: '#A855F7' }} />}
              {hasCommunication && <Line type="monotone" dataKey="communication" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 3, fill: '#22C55E' }} />}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
