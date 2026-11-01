import React from 'react';
import { ScanFace } from 'lucide-react';
import type { StoredBodyLanguage } from '../../utils/bodyLanguageStore';
import { combineConfidence } from '../../hooks/useBodyLanguage';

interface BodyLanguageReportProps {
  data: StoredBodyLanguage;
  answerConfidence: number;
}

const barTone = (v: number) => (v >= 70 ? 'bg-emerald-500' : v >= 50 ? 'bg-amber-400' : 'bg-red-400');

const ADVICE: Record<string, string> = {
  eyeContact: 'Look into the camera lens, not at your own image, while you answer.',
  posture: 'Sit tall with your shoulders level and back against the chair.',
  steadiness: 'Keep your head and shoulders still; use deliberate hand gestures instead of fidgeting.',
  expression: 'Relax your face and smile briefly when you greet and conclude each answer.',
};

export const BodyLanguageReport: React.FC<BodyLanguageReportProps> = ({ data, answerConfidence }) => {
  const s = data.session;
  if (!s || s.samples < 5) return null;

  const rows: { key: keyof typeof ADVICE; label: string; value: number }[] = [
    { key: 'eyeContact', label: 'Eye contact', value: s.eyeContact },
    { key: 'posture', label: 'Posture', value: s.posture },
    { key: 'steadiness', label: 'Steadiness', value: s.steadiness },
    { key: 'expression', label: 'Expression', value: s.expression },
  ];
  const weakest = [...rows].sort((a, b) => a.value - b.value)[0];
  // Blend what the camera saw with how confident the answers themselves sounded
  const overall = Math.round(s.confidence * 0.5 + answerConfidence * 0.5);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
            <ScanFace className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span>Body Language & Confidence</span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          Camera analysis · {s.facePresentPct}% in frame
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span className="text-xs font-semibold text-slate-400">Overall confidence</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-[#FF6B00]">{overall}</span>
            <span className="text-xs font-bold text-slate-400">/100</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Body language {s.confidence} · Answers {answerConfidence}
          </p>
        </div>

        <div className="md:col-span-2 space-y-2.5">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{row.label}</span>
                <span className="font-semibold text-slate-800">{row.value}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-sm h-1.5 overflow-hidden">
                <div className={`h-full ${barTone(row.value)}`} style={{ width: `${row.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.answers.length > 1 && (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence by answer</span>
          <div className="flex items-end gap-2 mt-2 h-16">
            {data.answers.map((a, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-sm ${barTone(combineConfidence(a))}`}
                    style={{ height: `${Math.max(6, a.confidence)}%` }}
                    title={`Answer ${i + 1}: ${a.confidence}`}
                  />
                </div>
                <span className="text-[10px] text-slate-400">Q{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {weakest.value < 70 && (
        <p className="text-xs text-slate-700 border-l-2 border-[#FF6B00] pl-3 leading-relaxed">
          <span className="font-semibold">Focus on {weakest.label.toLowerCase()}:</span> {ADVICE[weakest.key]}
        </p>
      )}
    </div>
  );
};
