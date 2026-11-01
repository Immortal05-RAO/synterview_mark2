import type { BodySummary } from '../hooks/useBodyLanguage';

// Body language is analysed in the browser, so the per-interview results are kept here rather than on the server.
export interface StoredBodyLanguage {
  answers: BodySummary[];
  session: BodySummary | null;
}

const key = (interviewId: string) => `synterview_body_language_${interviewId}`;

export const saveBodyLanguage = (interviewId: string, data: StoredBodyLanguage) => {
  try {
    localStorage.setItem(key(interviewId), JSON.stringify(data));
  } catch {
    // Private mode or full storage: the report just won't include body language
  }
};

export const loadBodyLanguage = (interviewId: string): StoredBodyLanguage | null => {
  try {
    const raw = localStorage.getItem(key(interviewId));
    return raw ? (JSON.parse(raw) as StoredBodyLanguage) : null;
  } catch {
    return null;
  }
};
