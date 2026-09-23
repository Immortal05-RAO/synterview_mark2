import React from 'react';
import { Search, Grid3X3, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Dashboard' }) => {
  const { user } = useAuth();
  const userName = user?.name || 'Shashwat J.';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title */}
      <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>

      {/* Right Header Actions */}
      <div className="flex items-center gap-4">
        {/* Search Field */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B00] transition-all"
          />
        </div>

        {/* Grid Icon */}
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <Grid3X3 className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-[#FF6B00] rounded-full absolute top-1.5 right-1.5 border border-white" />
        </button>

        {/* User Profile Tag */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {userInitial}
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline-block">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
};
