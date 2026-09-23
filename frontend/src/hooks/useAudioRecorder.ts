import { useState, useRef, useCallback, useEffect } from 'react';

export type MicState =
  | 'IDLE'
  | 'MIC_PERMISSION_REQUESTED'
  | 'MIC_READY'
  | 'RECORDING'
  | 'STOPPING'
  | 'UPLOADING'
  | 'TRANSCRIBING'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'ERROR';

export interface UseAudioRecorderReturn {
  micState: MicState;
  setMicState: (state: MicState) => void;
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  volumeLevel: number; // 0 to 100 real-time volume level for waveform
  audioDataArray: Uint8Array; // Real-time frequency data array for visualizer
  mimeTypeUsed: string;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
  error: string | null;
}

const getSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac',
    'audio/wav',
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
};

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [micState, setMicState] = useState<MicState>('IDLE');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mimeTypeUsed, setMimeTypeUsed] = useState<string>('');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [audioDataArray, setAudioDataArray] = useState<Uint8Array>(new Uint8Array(32));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Web Audio API refs for real-time waveform visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanupAudioNodes = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setVolumeLevel(0);
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null);
    audioChunksRef.current = [];
    setDuration(0);
    setAudioBlob(null);
    setMicState('MIC_PERMISSION_REQUESTED');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setMicState('MIC_READY');

      const mimeType = getSupportedMimeType();
      setMimeTypeUsed(mimeType);

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // Web Audio API AnalyserNode Setup for Real Waveform
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.7;
          source.connect(analyser);
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateWaveform = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              setAudioDataArray(new Uint8Array(dataArray));

              // Compute average volume level (0-100)
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              const level = Math.min(100, Math.round((average / 128) * 100));
              setVolumeLevel(level);

              animationFrameRef.current = requestAnimationFrame(updateWaveform);
            }
          };

          updateWaveform();
        }
      } catch (audioErr) {
        console.warn('Web Audio API visualization unavailable:', audioErr);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setMicState('RECORDING');

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      return true;
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setMicState('ERROR');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access blocked. Allow microphone access in your browser settings.');
      } else {
        setError('Microphone is unavailable or not detected on your system.');
      }
      return false;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      setMicState('STOPPING');

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      cleanupAudioNodes();

      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setMicState('IDLE');
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const finalMime = mediaRecorderRef.current?.mimeType || mimeTypeUsed || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalMime });

        console.log('[AUDIO DEBUG] Recording finished:', {
          sizeBytes: blob.size,
          mimeType: blob.type,
          chunksCount: audioChunksRef.current.length,
        });

        if (blob.size === 0) {
          console.error('[AUDIO ERROR] Recorded audio blob is empty!');
          setError('Recorded audio was empty. Please speak clearly and try again.');
          setMicState('ERROR');
          resolve(null);
          return;
        }

        setAudioBlob(blob);

        // Stop media stream tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [mimeTypeUsed, cleanupAudioNodes]);

  const resetRecording = useCallback(() => {
    cleanupAudioNodes();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setMicState('IDLE');
    setDuration(0);
    setAudioBlob(null);
    setError(null);
  }, [cleanupAudioNodes]);

  useEffect(() => {
    return () => {
      cleanupAudioNodes();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cleanupAudioNodes]);

  return {
    micState,
    setMicState,
    isRecording: micState === 'RECORDING',
    duration,
    audioBlob,
    volumeLevel,
    audioDataArray,
    mimeTypeUsed,
    startRecording,
    stopRecording,
    resetRecording,
    error,
  };
};
