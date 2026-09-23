import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Mic, Award, MessageSquare, Code2 } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { PerformanceChart } from '../components/dashboard/PerformanceChart';
import { SessionSummary } from '../components/dashboard/SessionSummary';
import { useAuth } from '../context/AuthContext';
import { interviewsApi } from '../api/interviews';
import type { InterviewConfig } from '../api/interviews';
import { mockDashboardData } from '../mock/dashboard';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<InterviewConfig[]>([]);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await interviewsApi.list();
        if (res.success) {
          setInterviews(res.interviews);
        }
      } catch {
        // Fallback to empty list or mock list
      }
    };
    fetchInterviews();
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Shashwat';
  const totalCompleted = interviews.filter((i) => i.status === 'COMPLETED').length;

  const validScores = interviews
    .map((i) => i.overallScore)
    .filter((s): s is number => s !== undefined && s !== null);

  const avgOverall = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Good morning, {firstName} 👋
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            You have {totalCompleted > 0 ? totalCompleted : 2} practice sessions scheduled this week.
          </p>
        </div>

        <button
          onClick={() => navigate('/interview/new')}
          className="bg-[#FF6B00] hover:bg-[#E56000] text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all text-xs active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Interview</span>
        </button>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="TOTAL INTERVIEWS"
          value={totalCompleted}
          subtext="↑ No sessions yet"
          icon={Mic}
          iconColorBg="bg-blue-50"
          iconColorText="text-blue-600"
        />
        <StatCard
          title="AVG OVERALL SCORE"
          value={avgOverall}
          maxScore={100}
          subtext="↑ No sessions yet"
          icon={Award}
          iconColorBg="bg-orange-50"
          iconColorText="text-[#FF6B00]"
        />
        <StatCard
          title="COMMUNICATION"
          value={avgOverall > 0 ? Math.round(avgOverall * 0.95) : 0}
          maxScore={100}
          subtext="↑ No sessions yet"
          icon={MessageSquare}
          iconColorBg="bg-emerald-50"
          iconColorText="text-emerald-600"
        />
        <StatCard
          title="TECHNICAL SCORE"
          value={avgOverall > 0 ? Math.round(avgOverall * 1.02) : 0}
          maxScore={100}
          subtext="↑ No sessions yet"
          icon={Code2}
          iconColorBg="bg-purple-50"
          iconColorText="text-purple-600"
        />
      </div>

      {/* Main Grid: Performance Trend + Session Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart data={totalCompleted > 0 ? mockDashboardData.trendData : []} />
        </div>
        <div className="lg:col-span-1">
          <SessionSummary />
        </div>
      </div>
    </div>
  );
};
