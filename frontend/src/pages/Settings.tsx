import React, { useState } from 'react';
import { Mic } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [micVolume, setMicVolume] = useState(80);
  const [demoMode, setDemoMode] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Settings</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Configure hardware peripherals, speech analysis thresholds, and interview options.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
        {/* Audio Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            <Mic className="w-4 h-4 text-[#FF6B00]" />
            <span>Audio & Microphone Test</span>
          </div>

          <div className="space-y-2">
            <label className="text-slate-600 font-medium block">Microphone Gain Sensitivity ({micVolume}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={micVolume}
              onChange={(e) => setMicVolume(Number(e.target.value))}
              className="w-full accent-[#FF6B00]"
            />
          </div>
        </div>

        {/* Demo Mode Toggle */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm block">Offline Demo Mode</span>
              <span className="text-slate-400">Use local deterministic fallback question bank if AI API is offline.</span>
            </div>

            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${demoMode ? 'bg-[#FF6B00]' : 'bg-slate-300'}`}
            >
              <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${demoMode ? 'left-6.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
