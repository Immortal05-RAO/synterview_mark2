import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseTextToSpeechReturn {
  speak: (text: string, onEnd?: () => void) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  error: string | null;
}

const UNSUPPORTED_MESSAGE = "Voice playback isn't available in this browser. You can continue using the text question.";

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The utterance that currently owns playback; callbacks from older utterances are ignored
  const activeRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      setError(UNSUPPORTED_MESSAGE);
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
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
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

  return { speak, cancel, isSpeaking, isSupported, error };
};
