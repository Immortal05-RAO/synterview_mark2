import React from 'react';
import { ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

interface SetupSummaryProps {
  role: string;
  experience: string;
  interviewType: string;
  difficulty: string;
  numQuestions: number;
  onStart: () => void;
  isLoading?: boolean;
}

export const SetupSummary: React.FC<SetupSummaryProps> = ({
  role,
  experience,
  interviewType,
  difficulty,
  numQuestions,
  onStart,
  isLoading = false,
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-1 text-slate-800 font-bold text-sm">
          <ChevronRight className="w-4 h-4 text-[#FF6B00]" />
          <span>Session Summary</span>
        </div>

        <div className="space-y-3 text-xs divide-y divide-slate-100">
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-medium">Role</span>
            <span className="font-bold text-slate-800">{role}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-medium">Experience</span>
            <span className="font-bold text-slate-800">{experience}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-medium">Type</span>
            <span className="font-bold text-slate-800">{interviewType}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-medium">Difficulty</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-[#FF6B00]">
              {difficulty}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-medium">Duration</span>
            <span className="font-bold text-slate-800">{numQuestions * 3} min</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-medium">Questions</span>
            <span className="font-bold text-slate-800">{numQuestions}</span>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="pt-2">
          <span className="text-xs text-slate-400 font-medium block mb-2">Focus Areas</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-[#FF6B00] border border-orange-200/60">
              Problem Solving
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-[#FF6B00] border border-orange-200/60">
              Communication
            </span>
          </div>
        </div>

        {/* AI Ready Box */}
        <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#FF6B00]">
            <Sparkles className="w-4 h-4" />
            <span>AI Interviewer Ready</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {numQuestions} questions tailored to {role} at {experience} level. Real-time scoring and feedback enabled.
          </p>
        </div>
      </div>

      {/* Start Interview CTA */}
      <button
        onClick={onStart}
        disabled={isLoading}
        className="w-full bg-[#FF6B00] hover:bg-[#E56000] text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70"
      >
        <span>{isLoading ? 'Generating Questions...' : 'Start Interview'}</span>
        {!isLoading && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
      </button>
    </div>
  );
};
