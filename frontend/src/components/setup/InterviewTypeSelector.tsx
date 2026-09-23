import React from 'react';
import { Sliders, Code2, User, MessageSquare } from 'lucide-react';
import { INTERVIEW_TYPES } from '../../mock/setup';

interface InterviewTypeSelectorProps {
  selectedType: string;
  onSelectType: (type: string) => void;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Code2':
      return Code2;
    case 'User':
      return User;
    case 'MessageSquare':
      return MessageSquare;
    default:
      return Sliders;
  }
};

export const InterviewTypeSelector: React.FC<InterviewTypeSelectorProps> = ({ selectedType, onSelectType }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center">
          <Sliders className="w-4 h-4 stroke-[2.5]" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">Interview Type</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {INTERVIEW_TYPES.map((type) => {
          const Icon = getIcon(type.icon);
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelectType(type.id)}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'border-[#FF6B00] bg-orange-50/80 shadow-xs ring-1 ring-orange-500/20'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl mb-2 flex items-center justify-center ${
                  isSelected ? 'bg-[#FF6B00] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
              <div className={`text-sm font-bold ${isSelected ? 'text-[#FF6B00]' : 'text-slate-800'}`}>
                {type.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">{type.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
