import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Award, ArrowRight, Home } from 'lucide-react';

export const InterviewCompletionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Interview Complete!</h2>
        <p className="text-xs font-medium text-slate-500 leading-relaxed">
          Your mock interview session has been fully analyzed by our AI evaluation engine. Your speech cadence, technical depth, and response structure are ready.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md flex items-center gap-6 max-w-sm w-full">
        <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
          <Award className="w-7 h-7" />
        </div>
        <div className="text-left">
          <div className="text-3xl font-extrabold text-[#FF6B00]">82 / 100</div>
          <div className="text-xs font-semibold text-slate-400">Estimated Overall Performance</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
        <button
          onClick={() => navigate(`/interview/${id || 'demo-session-id'}/report`)}
          className="w-full sm:w-auto bg-[#FF6B00] hover:bg-[#E56000] text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-xs"
        >
          <span>View Detailed Report</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
