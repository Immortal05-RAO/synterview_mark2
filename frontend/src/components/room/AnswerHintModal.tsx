import React, { useState, useEffect } from 'react';
import { X, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { interviewsApi } from '../../api/interviews';

interface AnswerHintModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  questionId: string;
  questionText: string;
}

export const AnswerHintModal: React.FC<AnswerHintModalProps> = ({
  isOpen,
  onClose,
  interviewId,
  questionId,
  questionText,
}) => {
  const [currentHintLevel, setCurrentHintLevel] = useState<number>(1);
  const [hintsList, setHintsList] = useState<string[]>([]);
  const [isLoadingHint, setIsLoadingHint] = useState<boolean>(false);
  const [idealAnswer, setIdealAnswer] = useState<string | null>(null);
  const [isLoadingIdeal, setIsLoadingIdeal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial Hint 1 when modal opens or question changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialHint = async () => {
      setIsLoadingHint(true);
      setError(null);
      setIdealAnswer(null);
      try {
        const res = await interviewsApi.getHint(interviewId, questionId, 1);
        if (res.success && res.hint) {
          setHintsList([res.hint]);
          setCurrentHintLevel(1);
        }
      } catch (err) {
        console.warn('Failed to fetch initial hint:', err);
        setError('Unable to fetch hint. Please try again or continue with your own answer.');
      } finally {
        setIsLoadingHint(false);
      }
    };

    fetchInitialHint();
  }, [isOpen, interviewId, questionId]);

  if (!isOpen) return null;

  const handleRevealNextHint = async () => {
    if (currentHintLevel >= 5 || isLoadingHint) return;
    const nextLevel = currentHintLevel + 1;
    setIsLoadingHint(true);
    setError(null);
    try {
      const res = await interviewsApi.getHint(interviewId, questionId, nextLevel);
      if (res.success && res.hint) {
        setHintsList((prev) => [...prev, res.hint]);
        setCurrentHintLevel(nextLevel);
      }
    } catch (err) {
      console.warn('Failed to fetch next hint:', err);
      setError('Could not load next hint.');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleShowIdealAnswer = async () => {
    if (isLoadingIdeal) return;
    setIsLoadingIdeal(true);
    setError(null);
    try {
      const res = await interviewsApi.getIdealAnswer(interviewId, questionId);
      if (res.success && res.ideal_answer) {
        setIdealAnswer(res.ideal_answer);
      }
    } catch (err) {
      console.warn('Failed to fetch ideal answer:', err);
      setError('Could not load ideal answer.');
    } finally {
      setIsLoadingIdeal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <div>
            <h3 className="font-bold text-base text-slate-900">Answer hints</h3>
            <p className="text-xs text-slate-500">Use these progressive hints to build your own response.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-1">
              Current question
            </span>
            <p className="font-semibold text-slate-900">{questionText}</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hint {currentHintLevel} of 5
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={`w-5 h-1.5 rounded-sm ${lvl <= currentHintLevel ? 'bg-[#FF6B00]' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>

            {hintsList.map((hintText, idx) => (
              <div key={idx} className="border-l-2 border-[#FF6B00] pl-3 py-1">
                <span className="text-xs font-semibold text-slate-500 block mb-0.5">Hint {idx + 1}</span>
                <p className="text-sm leading-relaxed text-slate-800">{hintText}</p>
              </div>
            ))}

            {isLoadingHint && (
              <div className="p-4 rounded-md border border-dashed border-slate-300 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
                <span>Generating the next hint...</span>
              </div>
            )}
          </div>

          {idealAnswer && (
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model answer</span>
              <div className="text-sm leading-relaxed whitespace-pre-line text-slate-700">{idealAnswer}</div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleShowIdealAnswer}
            disabled={isLoadingIdeal || !!idealAnswer}
            className="px-4 py-2 rounded-md border border-slate-300 hover:bg-white text-slate-700 font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoadingIdeal && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            <span>{idealAnswer ? 'Model answer shown' : 'Show model answer'}</span>
          </button>

          <button
            onClick={handleRevealNextHint}
            disabled={currentHintLevel >= 5 || isLoadingHint}
            className="px-4 py-2 rounded-md bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span>{currentHintLevel >= 5 ? 'All hints shown' : 'Next hint'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
