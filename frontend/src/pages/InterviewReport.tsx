import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { ScoreOverview } from '../components/report/ScoreOverview';
import { SpeechAnalytics } from '../components/report/SpeechAnalytics';
import { QuestionBreakdown } from '../components/report/QuestionBreakdown';
import { AIInsights } from '../components/report/AIInsights';
import { interviewsApi } from '../api/interviews';
import type { ReportData } from '../api/interviews';
import { mockReportData } from '../mock/report';

export const InterviewReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id || id === 'demo-session-id') {
        setReport(mockReportData);
        setLoading(false);
        return;
      }

      try {
        const res = await interviewsApi.getReport(id);
        if (res.success) {
          setReport(res.report);
        } else {
          setReport(mockReportData);
        }
      } catch {
        setReport(mockReportData);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading || !report) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-medium text-xs">
        Loading interview performance analysis...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report PDF</span>
          </button>
        </div>
      </div>

      {/* Score Overview Header */}
      <ScoreOverview report={report} />

      {/* Speech Analytics */}
      <SpeechAnalytics metrics={report.speechMetrics} />

      {/* AI Insights: Strengths, Improvements, Action Plan */}
      <AIInsights
        strengths={report.strengths}
        improvements={report.improvements}
        recommendations={report.recommendations}
      />

      {/* Question Breakdown */}
      <QuestionBreakdown questions={report.questionResults} />
    </div>
  );
};
