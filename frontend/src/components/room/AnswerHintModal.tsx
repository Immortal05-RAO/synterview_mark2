import React, { useState, useEffect } from 'react';
import { Lightbulb, X, ChevronRight, CheckCircle2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                Answer Hints
                <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                  Coaching Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">Use these progressive hints to build your own response.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-800 dark:text-slate-200">
          {/* Question Summary Banner */}
          <div className="bg-slate-100 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Current Question
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100 italic">"{questionText}"</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Progressive Hints List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Progressive Guidance (Hint {currentHintLevel} of 5)
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={`w-5 h-1.5 rounded-full transition-all ${
                      lvl <= currentHintLevel ? 'bg-[#FF6B00]' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {hintsList.map((hintText, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-slate-800 dark:text-slate-200 text-sm font-medium flex items-start gap-3 animate-in fade-in duration-300"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                    Hint {idx + 1}
                  </span>
                  <p className="leading-relaxed">{hintText}</p>
                </div>
              </div>
            ))}

            {isLoadingHint && (
              <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
                <span>Generating next progressive hint...</span>
              </div>
            )}
          </div>

          {/* Ideal Answer Section */}
          {idealAnswer && (
            <div className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-slate-800 dark:text-slate-100 space-y-2 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>EXEMPLARY IDEAL ANSWER</span>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-line font-normal text-slate-700 dark:text-slate-200">
                {idealAnswer}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleShowIdealAnswer}
            disabled={isLoadingIdeal || !!idealAnswer}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoadingIdeal ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            <span>{idealAnswer ? 'Ideal Answer Revealed' : 'Show Ideal Answer'}</span>
          </button>

          <button
            onClick={handleRevealNextHint}
            disabled={currentHintLevel >= 5 || isLoadingHint}
            className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            <span>{currentHintLevel >= 5 ? 'All Hints Revealed' : 'Reveal Next Hint'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
