import React from 'react';
import type { VoiceAccent, VoiceGender } from '../../hooks/useTextToSpeech';

interface VoiceSelectorProps {
  value: VoiceGender;
  onChange: (gender: VoiceGender) => void;
  accent?: VoiceAccent;
  onAccentChange?: (accent: VoiceAccent) => void;
  voiceName?: string | null;
  disabled?: boolean;
}

const OPTIONS: { value: VoiceGender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

const ACCENT_OPTIONS: { value: VoiceAccent; label: string }[] = [
  { value: 'us', label: 'American' },
  { value: 'indian', label: 'Indian' },
];

const segment = (active: boolean) =>
  `px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
    active ? 'bg-[#FF6B00] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
  }`;

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  value,
  onChange,
  accent,
  onAccentChange,
  voiceName,
  disabled,
}) => (
  <div className="space-y-1.5">
    <div role="radiogroup" aria-label="Interviewer voice" className="inline-flex border border-slate-300 rounded-md overflow-hidden">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            value === option.value ? 'bg-[#FF6B00] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
    {accent && onAccentChange && (
      <div role="radiogroup" aria-label="Interviewer accent" className="flex border border-slate-300 rounded-md overflow-hidden w-fit">
        {ACCENT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={accent === option.value}
            disabled={disabled}
            onClick={() => onAccentChange(option.value)}
            className={segment(accent === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    )}
    {voiceName !== undefined && (
      <p className="mt-1 text-[11px] text-slate-400 truncate">
        {voiceName ? `Voice: ${voiceName}` : 'No matching voice installed, using a pitch-shifted default'}
      </p>
    )}
  </div>
);
