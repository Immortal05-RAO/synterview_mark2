import React from 'react';
import { Award } from 'lucide-react';
import { EXPERIENCE_LEVELS } from '../../mock/setup';

interface ExperienceSelectorProps {
  selectedExp: string;
  onSelectExp: (exp: string) => void;
}

export const ExperienceSelector: React.FC<ExperienceSelectorProps> = ({ selectedExp, onSelectExp }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center">
          <Award className="w-4 h-4 stroke-[2.5]" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">Experience Level</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {EXPERIENCE_LEVELS.map((exp) => {
          const isSelected = selectedExp === exp.label;
          return (
            <button
              key={exp.label}
              type="button"
              onClick={() => onSelectExp(exp.label)}
              className={`p-3 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-[#FF6B00] bg-orange-50/80 shadow-xs ring-1 ring-orange-500/20'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`text-xs font-bold ${isSelected ? 'text-[#FF6B00]' : 'text-slate-800'}`}>
                {exp.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{exp.sub}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
