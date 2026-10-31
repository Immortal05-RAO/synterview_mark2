import React, { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';

interface TextAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitText: (text: string) => void;
  questionText: string;
}

export const TextAnswerModal: React.FC<TextAnswerModalProps> = ({
  isOpen,
  onClose,
  onSubmitText,
  questionText,
}) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmitText(text.trim());
      setText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <MessageSquare className="w-5 h-5 text-[#FF6B00]" />
            <span>Type Your Response</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200/60 text-xs text-slate-700 font-medium">
          <span className="font-bold text-slate-900 block mb-1">Question:</span>
          "{questionText}"
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Your Answer
            </label>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your structured answer here. Include concrete technical details and examples..."
              className="w-full bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B00] transition-all resize-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-5 py-2.5 rounded-md text-xs font-bold bg-[#FF6B00] text-white hover:bg-[#E56000] shadow-md  flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Answer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
