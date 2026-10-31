import { useState, useCallback, useEffect, useRef } from 'react';

export type VoiceGender = 'female' | 'male';

export interface UseTextToSpeechReturn {
  speak: (text: string, onEnd?: () => void) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  error: string | null;
  voiceGender: VoiceGender;
  setVoiceGender: (gender: VoiceGender) => void;
  voiceName: string | null;
}

const UNSUPPORTED_MESSAGE = "Voice playback isn't available in this browser. You can continue using the text question.";
const STORAGE_KEY = 'synterview_voice_gender';

// Browsers do not expose a voice's gender, so match well-known voice names across Chrome, Edge, Safari and Windows.
const FEMALE_HINTS = [
  'female', 'zira', 'jenny', 'aria', 'sonia', 'libby', 'hazel', 'susan', 'samantha', 'victoria', 'karen',
  'moira', 'tessa', 'fiona', 'allison', 'ava', 'serena', 'emma', 'michelle', 'ana', 'natasha', 'catherine',
];
const MALE_HINTS = [
  'male', 'david', 'mark', 'guy', 'ryan', 'davis', 'daniel', 'alex', 'fred', 'george', 'james', 'brian',
  'thomas', 'richard', 'liam', 'eric', 'christopher', 'roger', 'steffan', 'oliver',
];

const matchesHint = (name: string, hints: string[]) => {
  const lower = name.toLowerCase();
  return hints.some((hint) => new RegExp(`\\b${hint}\\b`).test(lower));
};

const isFemaleName = (name: string) => matchesHint(name, FEMALE_HINTS);
const isMaleName = (name: string) => matchesHint(name, MALE_HINTS);

// Prefer neural/online voices (much more natural), then Google/Microsoft voices, then anything else
const voiceQuality = (voice: SpeechSynthesisVoice) => {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (name.includes('natural') || name.includes('online')) score += 4;
  if (name.includes('google') || name.includes('microsoft')) score += 2;
  if (voice.lang.toLowerCase() === 'en-us') score += 1;
  return score;
};

export const pickVoice = (voices: SpeechSynthesisVoice[], gender: VoiceGender): SpeechSynthesisVoice | null => {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const matches = english.filter((v) => (gender === 'female' ? isFemaleName(v.name) : isMaleName(v.name)));
  if (matches.length === 0) return null;
  return matches.sort((a, b) => voiceQuality(b) - voiceQuality(a))[0];
};

const readStoredGender = (): VoiceGender => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'male' ? 'male' : 'female';
  } catch {
    return 'female';
  }
};

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiceGender, setVoiceGenderState] = useState<VoiceGender>(readStoredGender);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // The utterance that currently owns playback; callbacks from older utterances are ignored
  const activeRef = useRef<SpeechSynthesisUtterance | null>(null);
  const genderRef = useRef<VoiceGender>(voiceGender);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  genderRef.current = voiceGender;
  voicesRef.current = voices;

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      setError(UNSUPPORTED_MESSAGE);
      return;
    }

    // Voices load asynchronously in most browsers
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const setVoiceGender = useCallback((gender: VoiceGender) => {
    setVoiceGenderState(gender);
    try {
      localStorage.setItem(STORAGE_KEY, gender);
    } catch {
      // Preference simply will not persist
    }
  }, []);

  const cancel = useCallback(() => {
    activeRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      setError(UNSUPPORTED_MESSAGE);
      onEnd?.();
      return;
    }

    const cleanText = text.trim();
    activeRef.current = null;
    window.speechSynthesis.cancel();
    setError(null);

    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const gender = genderRef.current;
    const allVoices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
    const voice = pickVoice(allVoices, gender);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.pitch = 1.0;
    } else {
      // No matching voice installed: shift the pitch of the default voice so the choice is still audible
      utterance.lang = 'en-US';
      utterance.pitch = gender === 'female' ? 1.2 : 0.8;
    }
    utterance.rate = 1.0;
    activeRef.current = utterance;

    let finished = false;
    let safetyTimer: number | undefined;

    // Finish exactly once, and only if this utterance is still the active one
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(safetyTimer);
      if (activeRef.current !== utterance) return;
      activeRef.current = null;
      setIsSpeaking(false);
      onEnd?.();
    };

    utterance.onstart = () => {
      if (activeRef.current === utterance) setIsSpeaking(true);
    };
    utterance.onend = finish;
    utterance.onerror = (event) => {
      if (activeRef.current !== utterance) return;
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setError('Voice playback hit a minor error. Continuing with text.');
      }
      finish();
    };

    // Some browsers never fire onend (e.g. no voices installed); never stall the conversation
    safetyTimer = window.setTimeout(finish, Math.max(4000, cleanText.length * 120 + 3000));

    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    return () => {
      activeRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const voiceName = pickVoice(voices, voiceGender)?.name ?? null;

  return { speak, cancel, isSpeaking, isSupported, error, voiceGender, setVoiceGender, voiceName };
};
