import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  maxScore?: number;
  subtext: string;
  icon: LucideIcon;
  iconColorBg: string;
  iconColorText: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  maxScore,
  subtext,
  icon: Icon,
  iconColorBg,
  iconColorText,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-slate-800">{value}</span>
          {maxScore && <span className="text-sm font-medium text-slate-400">/{maxScore}</span>}
        </div>
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1 pt-1">
          <span>{subtext}</span>
        </p>
      </div>

      <div className={`w-10 h-10 rounded-xl ${iconColorBg} ${iconColorText} flex items-center justify-center shadow-xs flex-shrink-0`}>
        <Icon className="w-5 h-5 stroke-[2]" />
      </div>
    </div>
  );
};
