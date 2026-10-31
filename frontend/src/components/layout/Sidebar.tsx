import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Mic,
  LayoutDashboard,
  PlusCircle,
  History,
  TrendingUp,
  User as UserIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Interview', path: '/interview/new', icon: PlusCircle, isNew: true },
    { label: 'Interview History', path: '/history', icon: History },
    { label: 'Progress', path: '/progress', icon: TrendingUp },
    { label: 'Profile', path: '/profile', icon: UserIcon },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const userName = user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Top Brand Logo */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
              <Mic className="w-5 h-5 stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900">SYNTERVIEW</span>
                </div>
                <span className="text-[10px] font-semibold tracking-wider text-orange-500 uppercase block -mt-1">
                  AI
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-50 text-[#FF6B00] font-semibold border border-orange-200/60 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#FF6B00]' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Collapse */}
      <div className="p-3 border-t border-slate-200/80 space-y-2">
        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#FF6B00] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
            {userInitial}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-slate-800 truncate">{userName}</h4>
              <p className="text-[11px] text-slate-500 font-medium">Active Interviews</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
