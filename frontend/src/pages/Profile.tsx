import React from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const userName = user?.name || 'Shashwat J.';
  const userEmail = user?.email || 'shashwat@synterview.ai';

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Candidate Profile</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Manage your personal information and interview preparation targets.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-[#FF6B00] text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-800">{userName}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Mail className="w-3.5 h-3.5" />
            {userEmail}
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#FF6B00]">
            Candidate Account
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1 text-center">
          <span className="text-xs font-semibold text-slate-400 block">Total Completed</span>
          <span className="text-3xl font-extrabold text-[#FF6B00]">4</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1 text-center">
          <span className="text-xs font-semibold text-slate-400 block">Average Score</span>
          <span className="text-3xl font-extrabold text-slate-800">82/100</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1 text-center">
          <span className="text-xs font-semibold text-slate-400 block">Highest Score</span>
          <span className="text-3xl font-extrabold text-emerald-600">88/100</span>
        </div>
      </div>
    </div>
  );
};
