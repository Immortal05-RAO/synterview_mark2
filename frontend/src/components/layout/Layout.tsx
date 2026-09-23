import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isInterviewRoom = location.pathname.startsWith('/interview/') && !location.pathname.endsWith('/new') && !location.pathname.endsWith('/report') && !location.pathname.endsWith('/complete');

  if (isInterviewRoom) {
    // Fullscreen view for Mock Interview Session
    return <div className="min-h-screen bg-slate-900 text-slate-100">{children}</div>;
  }

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'Dashboard';
    if (path === '/interview/new') return 'Interview Setup';
    if (path.includes('/report')) return 'Interview Results';
    if (path.includes('/complete')) return 'Interview Complete';
    if (path === '/history') return 'Interview History';
    if (path === '/progress') return 'Progress';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    return 'Synterview';
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header title={getTitle()} />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
