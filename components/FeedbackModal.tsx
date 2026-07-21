
import React, { useState } from 'react';
import { Feedback } from '../types';

interface FeedbackModalProps {
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [type, setType] = useState<'bug' | 'feature'>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newFeedback: Feedback = {
      id: crypto.randomUUID(),
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
    };

    // Store in LocalStorage
    const existingRaw = localStorage.getItem('civic_twin_feedback');
    const existing: Feedback[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.push(newFeedback);
    localStorage.setItem('civic_twin_feedback', JSON.stringify(existing));

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => onClose(), 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">System Feedback</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Help us refine the Digital Twin</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-2">✕</button>
        </header>

        {isSuccess ? (
          <div className="p-12 text-center space-y-4 animate-in fade-in scale-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-black text-slate-900">Feedback Transmitted</h3>
            <p className="text-sm text-slate-500 font-medium">Your report has been logged to local persistence.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('feature')}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${type === 'feature' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Feature Request
              </button>
              <button
                type="button"
                onClick={() => setType('bug')}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${type === 'bug' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
              >
                Bug Report
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Title</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your feedback..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide as much detail as possible..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all resize-none"
              />
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
