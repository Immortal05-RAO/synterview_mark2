import React from 'react';
import { ScanFace, Lightbulb } from 'lucide-react';
import type { BodyLanguageStatus, BodyMetrics } from '../../hooks/useBodyLanguage';

interface BodyLanguagePanelProps {
  status: BodyLanguageStatus;
  live: BodyMetrics | null;
  faceDetected: boolean;
  tip: string | null;
  cameraOn: boolean;
}

const tone = (value: number) => (value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-red-400');
const label = (value: number) => (value >= 70 ? 'Confident' : value >= 50 ? 'Steady' : 'Nervous');

const Meter: React.FC<{ name: string; value: number | null }> = ({ name, value }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-slate-600 font-medium">{name}</span>
      <span className="font-semibold text-slate-800">{value ?? '--'}</span>
    </div>
    <div className="w-full bg-slate-100 rounded-sm h-1.5 overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${value === null ? '' : tone(value)}`}
        style={{ width: `${value ?? 0}%` }}
      />
    </div>
  </div>
);

export const BodyLanguagePanel: React.FC<BodyLanguagePanelProps> = ({ status, live, faceDetected, tip, cameraOn }) => {
  let notice: string | null = null;
  if (!cameraOn) notice = 'Turn your camera on to get body language feedback.';
  else if (status === 'loading') notice = 'Loading body language analysis...';
  else if (status === 'error') notice = 'Body language analysis could not load. The interview works without it.';
  else if (status === 'ready' && !faceDetected) notice = 'No face detected. Move into the frame.';

  const active = notice === null && live !== null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 flex flex-col flex-shrink-0">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <ScanFace className="w-4 h-4 text-[#FF6B00]" />
          Body language
        </h3>
        {active && (
          <span
            className={`text-xs font-semibold ${
              live.confidence >= 70 ? 'text-emerald-600' : live.confidence >= 50 ? 'text-amber-600' : 'text-red-500'
            }`}
          >
            {label(live.confidence)}
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900">{active ? live.confidence : '--'}</span>
          <span className="text-sm text-slate-400">/ 100 confidence</span>
        </div>

        {notice && <p className="text-xs text-slate-500 leading-snug">{notice}</p>}

        <div className="space-y-2.5">
          <Meter name="Eye contact" value={active ? live.eyeContact : null} />
          <Meter name="Posture" value={active ? live.posture : null} />
          <Meter name="Steadiness" value={active ? live.steadiness : null} />
          <Meter name="Expression" value={active ? live.expression : null} />
        </div>

        {active && tip && (
          <div className="flex items-start gap-2 border-l-2 border-[#FF6B00] pl-3 py-0.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#FF6B00] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-700 leading-snug">{tip}</p>
          </div>
        )}

        <p className="text-[11px] text-slate-400 leading-snug">
          Analysed on your device. Video is never uploaded or stored.
        </p>
      </div>
    </div>
  );
};
