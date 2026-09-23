import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Calendar, Award, Trash2, ExternalLink } from 'lucide-react';
import { interviewsApi } from '../api/interviews';
import type { InterviewConfig } from '../api/interviews';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewConfig[]>([]);
  const [, setLoading] = useState(true);

  const loadInterviews = async () => {
    try {
      const res = await interviewsApi.list();
      if (res.success) {
        setInterviews(res.interviews);
      }
    } catch {
      // Fallback mock history list
      setInterviews([
        {
          id: 'demo-session-id',
          role: 'Software Engineer',
          experience: 'Fresher',
          difficulty: 'Medium',
          interviewType: 'Technical',
          numberOfQuestions: 5,
          status: 'COMPLETED',
          overallScore: 82,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this interview history record?')) {
      try {
        await interviewsApi.delete(id);
        setInterviews(interviews.filter((i) => i.id !== id));
      } catch {
        setInterviews(interviews.filter((i) => i.id !== id));
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Interview History</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Review past mock interview sessions, scores, and performance feedback.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {interviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <HistoryIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No interview history yet</p>
            <button
              onClick={() => navigate('/interview/new')}
              className="px-4 py-2 bg-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md"
            >
              Start First Interview
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {interviews.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/interview/${item.id}/report`)}
                className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{item.role}</h4>
                    <div className="flex items-center gap-2 text-slate-400 mt-0.5 font-medium">
                      <span>{item.interviewType}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-[#FF6B00]">
                      {item.overallScore ? `${item.overallScore}/100` : 'Completed'}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
